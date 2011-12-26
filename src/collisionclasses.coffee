#collsionclasses.coffee: collision-related classes

#ties together sprites and shapes for coherent movement
class window.Actor
    constructor: (spec) ->
        @pos = spec.pos ? Vector.Zero(2)

        @sprites = {}
        if spec.sprites?
            for own k, v of spec.sprites
                v.parent = this;
                @sprites[k] = new Sprite(v)
        @shapes = {}
        if spec.shapes?
            for own k, v of spec.shapes
                    v.parent = this
                    @shapes[k] = Shape.create(v)

        @grid = spec.grid if spec.grid

        @moveQueue = [].extend
            pushRel: (vector) ->
                @push {rel: vector.dup()}
            pushAbs: (vector) ->
                @push {abs: vector.dup()}
        @top = spec.top ? 0
        @bottom = spec.bottom ? 0
        @left = spec.left ? 0
        @right = spec.right ? 0
        @extend spec.attrib if spec.attrib

        @dimAdjust()
    
    sprites: null #object containing all sprites by name
    shapes: null #object containing all shapes by name
    grid: null #collision grid which shapes are registered to

    pos: null #vector of aboslute position

    lastMove: null #vector containing the previous movement

    #relative location of dimensions
    top: 0
    bottom: 0
    left: 0
    right: 0

    #absolute location of dimensions
    x1: 0	#left
    y1: 0	#top
    x2: 0	#right
    y2: 0	#bottom

    #cells containing the entity's corners
    celltl: null
    celltr: null
    cellbl: null
    cellbr: null

    #recalculates dimensions and reregisters shapes
    dimAdjust: ->
        grid = @grid

        #calculate edges
        @x1 = @left + @pos.getX()
        @y1 = @top + @pos.getY()
        @x2 = @right + @pos.getX()
        @y2 = @bottom + @pos.getY()

        if @grid?
            #match each edge to a row or column on the grid
            gridx1 = grid.getCX @x1
            gridx2 = grid.getCX @x2
            gridy1 = grid.getCY @y1
            gridy2 = grid.getCY @y2

            #top left corner
            if @celltl isnt grid[gridx1]?[gridy1] ? null
                @celltl.deregister(this) if @celltl?

                @celltl = grid[gridx1]?[gridy1] ? null
                @celltl.register(this) if @celltl?

            #bottom left corner
            if @cellbl isnt grid[gridx1]?[gridy2] ? null
                @cellbl.deregister(this) if @cellbl?

                @cellbl = grid[gridx1]?[gridy2] ? null
                @cellbl.register(this) if @cellbl?

            #top right corner
            if @celltr isnt grid[gridx2]?[gridy1] ? null
                @celltr.deregister(this) if @celltr isnt null

                @celltr = grid[gridx2]?[gridy1] ? null
                @celltr.register(this) if @celltr?

            #bottom right corner
            if @cellbr isnt grid[gridx2]?[gridy2] ? null
                @cellbr.deregister(this) if @cellbr?

                @cellbr = grid[gridx2]?[gridy2] ? null
                @cellbr.register(this) if @cellbr?
    
    #precalculates result of next move from moveQueue
    getMove: (emptyQueue = false) ->
        buffer = Vector.Zero(2)


        @moveQueue.reverse()
        loop
            i = @moveQueue.pop()
            break if not i?
        
            buffer = buffer.add i.rel if i.rel
            buffer = i.abs if i.abs

        @moveQueue.push {rel: buffer} unless emptyQueue
        buffer
    
    #actualize next move
    move: ->
        dist = @getMove(true)

        @pos = @pos.add dist
        @lastMove = dist

        @dimAdjust()

#cell to which shapes and actors are subscribes
class window.CollisionCell extends Cell
    constructor: ->
        @shapes = {}
        @shapelist = {}

        super(arguments...)

    shapes: null #list of subscribed shapes by pool
    shapelist: null #has of subscribed shapes by id
    
    #registers shapes of actor (or given shape) into cell+grid
    register: (obj) ->
        obj = {shapes: {obj}} if obj instanceof Shape
        
        for own k, v of obj.shapes
            pool = v.pool
            id = v.getid()

            if @shapelist[id]?
                node = @shapes[pool][@shapelist[id]]
                node.num += 1
            else
                node = {data: v, num: 1}
                unless @shapes[pool]?
                    @shapes[pool] = [node]
                    @shapelist[id] = 0
                else
                    #Array::push returns new length of Array
                    @shapelist[id] = @shapes[pool].push(node)-1

                unless @grid.pools[pool]?
                    @grid.pools[pool] = {}
                    @grid.poolcount[pool] = {count: 0}
                
                if @grid.pools[pool][@getid()]
                    @grid.poolcount[pool][@getid()] += 1
                else
                    @grid.pools[pool][@getid()] = this
                    @grid.poolcount[pool][@getid()] = 1
                    @grid.poolcount[pool].count += 1
        undefined
    
    #registers shapes of actor (or given shape) into cell+grid
    deregister: (obj) ->
        obj = {shapes: {obj}} if obj instanceof Shape
        
        for own k, v in obj.shapes
            id = v.getid()
            pool = v.pool
            shapePos = @shapelist[id]
            node = @shapes[pool][shapePos]

            if node.num > 1
                node.num -= 1
            else
                @shapes[pool].splice(shapePos, 1);
                delete @shapelist[id];

                @grid.poolcount[pool][this.getid()] -= 1;
                if @grid.poolcount[pool][this.getid()] is 0
                    delete @grid.pools[pool][@getid()]
                    delete @grid.poolcount[pool][this.getid()]

                    @grid.poolcount[pool].count -= 1
                    if @grid.poolcount[pool].count is 0
                        delete this.grid.pools[pool]
                        delete this.grid.poolcount[pool]
        undefined

#grid for managing collisions
class window.CollisionGrid extends Grid     #TODO: subgrids
    constructor: (spec) ->
        {context, priority, trigID} = spec
        super(spec)
        
        @pools = {}
        @poolcount = {}

        @collisions = []

        if context? or priority?
            unless (context? and priority?)
                throw new Error 'CollsionCell not given context AND priority'
            @subscribeTo(context, priority, trigId)
    
    #private
    
    #test one shape against another
    testShapes = (shape1, shape2, func, checklist) ->
        shapeid1 = shape1.getid()
        shapeid2 = shape2.getid()

        #so that there's only one possible key for each combination
        if shapeid1 < shapeid2
            key = shapeid1 + '.' + shapeid2
        else
            key = shapeid2 + '.' + shapeid1

        #check if we've already checked these shapes, then,
        #if there is a collision, inform its actor
        if not checklist[key] and shape1.isColliding shape2
            switch typeof func
                when 'function'
                    func(shape1, shape2)
                when 'string'
                    shape1.parent[func]?(shape2)
                    shape2.parent[func]?(shape1)
        checklist[key] = true   #mark that we've tested these shapes
    
    #iterates over shapes of both lists
    iterateShapes = (list1, list2, func, swapped) ->
        checklist = {}  #contains every potential collision tested
        #used to prevent two objects from colliding muliple times

        #we can do fewer tests if we're testing a list against itself
        if list2?
            #test every shape in list1 against every shape in list2
            for v in list1
                shape1 = v.data;

                for w in list2
                    shape2 = w.data;

                    unless swapped
                        testShapes(shape1, shape2, func, checklist)
                    else
                        testShapes(shape2, shape1, func, checklist)
        else
            #test every possible combination of shapes
            for i in [0...list1.length-1]
                shape1 = list1[i].data
                
                for j in [i+1...list1.length]
                    shape2 = list1[j].data

                    unless swapped
                        testShapes(shape1, shape2, func, checklist)
                    else
                        testShapes(shape2, shape1, func, checklist)
        undefined
    
    #processes groups into lists
    processGroups = (grid, group1, group2, func) ->
        if typeof group1 is 'string'
            pool = group1
        else if typeof group2 is 'string'
            pool = group2

        if pool?
            for own k of grid.pools[pool]
                #set head to the head of pool's nodes
                cell = grid.pools[pool][k]

                if typeof group1 is 'string'
                    list1 = cell.shapes[group1]
                else
                    list1 = [{data: group1}]

                if group2 and group1 isnt group2
                    if typeof group2 is 'string'
                        list2 = cell.shapes[group2]
                    else
                        list2 = [{data: group2}]

                    if list1.length <= list2.length
                        iterateShapes(list1, list2, func, false)
                    else
                        iterateShapes(list2, list1, func, true)
                else if list1.length >= 2
                    iterateShapes(list1, null, func, false)
        else
            iterateShapes(group1, group2, func, false)
        undefined

    #public
    cell: CollisionCell #use CollisionCell as the default cell type

    #subgrid: null #grid to be compared against

    pools: null #documents cells have shapes from each pool
    poolcount: null #documents how many shapes are subscribed to each cell

    collisions: null #list of collisions to look for
    
    #subscribe this grid to Trigger
    subscribeTo: (context = 'global', priority = 90, trigId) ->
        Trigger.subscribe
            trigger: 'step'
            func: this.step
            obj: this
            context: context
            priority: priority
            trigId: trigId
    
    #unsubscribe from Trigger
    unsubscribeFrom: (trigId) ->
        Trigger.unsubscribe('step', @step, trigId)
    
    #add collision to list
    addCollision: (pool1, pool2, func) ->
        @collisions.push
            pool1: pool1
            pool2: pool2
            func: func
    
    #remove collision from list
    removeCollision: (pool1, pool2) ->
        for v, i in @collisions when v.pool1 is pool1 and v.pool2 is pool2
            @collisions.splice(i, 1)
            break
        undefined
    
    #check if there is a collision between group1 and group2
    getCollisions: (group1, group2) ->
        collisionList = []
        processGroups(this, group1, group2, collisionList)

        collisionList
    
    #check all collisions on list
    step: ->
        processGroups(this, v.pool1, v.pool2, v.func) for v in @collisions

#collision shape for attaching to actor
class window.Shape
    #you have to use this instead of the constructor because i'm dumb
    #it's going soon anyways.
    @create = (spec) ->
        switch spec.type
            when 'box'
                new Box(spec)
            when 'circle'
                new Circle(spec)

    constructor: ({@parent, @pool, @pos}) ->
    
    #private
    
    #returns the attributes of given shape
    getAttrib = (shape) ->
        value = {}
        xOffset = shape.parent.pos.getX()+shape.pos.getX()
        yOffset = shape.parent.pos.getY()+shape.pos.getY()

        switch shape.type
            when 'box'
                value.top    = yOffset - (shape.height/2)
                value.bottom = yOffset + (shape.height/2)
                value.left   = xOffset - (shape.height/2)
                value.right  = xOffset + (shape.height/2)
            when 'circle'
                value.x      = xOffset
                value.y      = yOffset
                value.radius = shape.radius
        value
        
        #object with functions test collisions for each pair of shapes
        testShape =
            boxbox: (a, b) -> #hide
                #If any of the sides from shape1 are outside of shape2
                not (a.bottom <= b.top or a.top >= b.bottom or a.right <= b.left or a.left >= b.right)
            circlecircle: (a, b) -> #hide
                #if the distance between the two points is less than their combined radius,
                #they are intersecting
                (Math.sqrt( Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2) )) <= (a.radius + b.radius)
            boxcircle:(a, b) -> #hide
                #find closest X offset
                if b.x <= a.left
                    aX = a.left
                else if b.x >= a.right
                    aX = a.right
                else
                    aX = b.x

                #find closest Y offset
                if b.y <= a.top
                    aY = a.top
                else if b.y >= a.bottom
                    aY = a.bottom
                else
                    aY = b.y
                #if closest point is inside the circle, there is collision
                (Math.sqrt( Math.pow(b.x - aX, 2) + Math.pow(b.y - aY, 2) )) <= 0

    #public
    
    parent: null #parent actor shape is attached to
    type: null #kind of shape (box, circle, etc)
    pool: null #pool this shape belongs to

    pos: null #relative position of the shape
    
    #returns the absolute position
    getAbsPos: ->
        if @parent then @parent.pos.add(@pos) else @pos
    
    #determines if shape is colliding with given shape
    isColliding: (otherShape) ->
        #select appropriate insection detection algorithm
        #and calculate required variables
        testName = @type + otherShape.type

        if testShape[testName]?
            testShape[testName](getAttrib(this), getAttrib(otherShape))
        else
            testShape[otherShape.type + @type](getAttrib(otherShape), getAttrib(this))
    
    #returns vector of ejection given the other shape, its last move, and our last move
    ejectShape: (other, otherMove, thisMove) ->
        #this function assumes this and otherShape are colliding.
        
        #the basic principal is that otherShape should be ejected in either one
        #of the directions it is moving or one one the directions this Shape is moving

        #determine otherShape's movement vector from this Shape's POV)
        dX = otherMove.getX() - thisMove.getX()
        dY = otherMove.getY() - thisMove.getY()

        #determine the depth of penetration for relevant directions 
        if dY > 0		#moving down
            yDepth = @getTop() - other.getBottom()
        else if dY < 0          #moving up
            yDepth = @getBottom() - other.getTop()

        if dX > 0		#moving right
            xDepth = @getLeft() - other.getRight()
        else if dx < 0          #moving left
            xDepth = @getRight() - other.getLeft()

        #if moving diagonally, the direction of ejection
        #is the one with the smallest depth of penetration
        if (dX isnt 0) and (dY isnt 0)
            if xDepth > yDepth
                {x:0, y:yDepth}
            else
                {x:xDepth, y:0}
        else
            {x:xDepth ? 0, y:yDepth ? 0}

#Box shape for use by Shape.create()
class Box extends Shape
    constructor: (spec) ->
        {@height, @width} = spec
        
        super(spec)
        @boundaryBox = this
    type: 'box' #marks this as box type shape
    height: 0 #height of box
    width: 0 #width of box
    
    #returns  absolution position of each side
    getTop: ->
        @getAbsPos().getY()-(@height/2)
    getBottom: ->
        @getAbsPos().getY()+(@height/2)
    getLeft: ->
        @getAbsPos().getX()-(@width/2)
    getRight: ->
        @getAbsPos().getX()+(@width/2)

#Circle shape for use by Shape.create()
class Circle extends Shape
    constructor: (spec) ->
        @radius = spec.radius
        
        super(spec)
        this.boundaryBox = new Box
            pool: @pool
            pos: @getPos()
            height: @radius
            width: @radius
    type: 'circle' #marks this as box type shape 
    radius: 0 #radius of circle