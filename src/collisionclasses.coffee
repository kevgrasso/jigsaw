#collsionclasses.coffee: collision-related classes
    
#ties together sprites and shapes for coherent movement
class window.Actor
    constructor: (spec) ->
        {pos, sprites, shapes, grid, top, bottom, left, right} = spec
        @pos = pos ? Vector.Zero(2)

        @sprites = {}
        if sprites?
            for own k, v of sprites
                v.parent = this;
                @sprites[k] = new Sprite(v)
        @shapes = {}
        if shapes?
            for own k, v of shapes
                    v.parent = this
                    @shapes[k] = Shape.create(v)

        @grid = grid if grid

        @moveQueue = [].extend
            pushRel: (vector) ->
                @push {rel: vector.dup()}
            pushAbs: (vector) ->
                @push {abs: vector.dup()}
        @top = top ? 0
        @bottom = bottom ? 0
        @left = left ? 0
        @right = right ? 0

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
            id = v.getID()

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
                
                if @grid.pools[pool][@getID()]
                    @grid.poolcount[pool][@getID()] += 1
                else
                    @grid.pools[pool][@getID()] = this
                    @grid.poolcount[pool][@getID()] = 1
                    @grid.poolcount[pool].count += 1
        undefined
    
    #registers shapes of actor (or given shape) into cell+grid
    deregister: (obj) ->
        obj = {shapes: {obj}} if obj instanceof Shape
        
        for own k, v in obj.shapes
            id = v.getID()
            pool = v.pool
            shapePos = @shapelist[id]
            node = @shapes[pool][shapePos]

            if node.num > 1
                node.num -= 1
            else
                @shapes[pool].splice(shapePos, 1);
                delete @shapelist[id];

                @grid.poolcount[pool][@getID()] -= 1;
                if @grid.poolcount[pool][@getID()] is 0
                    delete @grid.pools[pool][@getID()]
                    delete @grid.poolcount[pool][@getID()]

                    @grid.poolcount[pool].count -= 1
                    if @grid.poolcount[pool].count is 0
                        delete @grid.pools[pool]
                        delete @grid.poolcount[pool]
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
                throw new Error 'CollisionCell not given context AND priority'
            @subscribeTo(context, priority, trigID)
    
    #private
    
    #test one shape against another
    testShapes = (shape1, shape2, func, checklist) ->
        shapeid1 = shape1.getID()
        shapeid2 = shape2.getID()

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
    
    #iterates over shapes of single list
    iterateShapeSingle = (list1, func, checklist) ->
        
        #test every possible combination of shapes
        for i in [0...list1.length-1]
            shape1 = list1[i].data
            
            for j in [i+1...list1.length]
                shape2 = list1[j].data
                
                testShapes(shape1, shape2, func, checklist)
        undefined
    
    #iterates over shapes of two lists
    iterateShapePair = (list1, list2, func, checklist) ->
        
        #test every shape in list1 against every shape in list2
        for v in list1
            shape1 = v.data;

            for w in list2
                shape2 = w.data;
                
                testShapes(shape1, shape2, func, checklist)
        undefined
    
    #processes groups into lists
    processGroups = (grid, group1, group2, func) ->
        checklist = {}  #contains every potential collision tested
            #used to prevent two objects from colliding muliple times
        
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
                    
                    iterateShapePair(list1, list2, func, checklist)
                else if list1.length >= 2
                    iterateShapeSingle(list1, func, checklist)
        else
            iterateShapes(group1, group2, func, checklist)
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
        for collision, pos in @collisions when collision.pool1 is pool1 and collision.pool2 is pool2
            @collisions.splice(pos, 1)
            break
        undefined
    
    deregisterByObject: (object) ->
        for cell in @getAllCells()
            for own pool in cell
                for shape in pool where shape.parent is object or shape is object
                    cell.deregister(shape)
    
    deregisterByPool: (pool) ->
        for cell in @pools[pool]
            for shape in cell.shapes[pool]
                cell.deregister(shape)
    
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
    constructor: ({@parent, @pool, @vertices}) ->
    
    parent: null #parent actor shape is attached to
    type: null #kind of shape (box, circle, etc)
    pool: null #pool this shape belongs to
    vertices: null
    
    #returns the absolute position
    getAbsVertex: (index) ->
        if @parent then @parent.pos.add(@vertices[index]) else @pos[index]
        
    getAbsVertices: ->
        @getAbsVertices(index) for index in [0...@vertices.length]
    
    #a lot of the following SAT collision testing code is by William of Code Zealot
    
    getShapeAxes= (shape1, sharedData) ->
        #loop over the vertices
        for vertex1, index in shape.getAbsVertices()
            #get the next vertex
            vertex2 = shape.vertices[index+1] ? shape.vertices[0]
            
            #subtract the two to get the edge vector
            edge = vertex1.subtract vertex2
            #get either perpendicular vector
            normal = edge.perp()
            #the perp method is just (x, y) => (-y, x) or (y, -x)
            radians = normal.getAngle().toFixed(7)#7 is the default precision of sylvester
            if sharedData[radians] then continue #don't angle push if it has already been tested
            sharedData[radians] = true
            normal
        
    projectShape = (shape, axis) ->
        vertices = shape.vertices
        min = max = axis.dot vertices[0]
        for vertex in vertices[1...]
            #NOTE: the axis must be normalized to get accurate projections
            dotProduct = axis.dot vertex
            if dotProduct < min
                min = dotProduct
            else if dotProduct > max
                max = dotProduct
        {min, max}
        
    getProjectionOverlap = ({min: min1, max: max1}, {min: min2, max: max2}) ->
        if min1>max2
            magnitude = min1-max2
        else if min2<max1
            magnitude = min2-max1
        else
            return false
        
        #check for containment
        if (min1 >= min2 and max1 <= max2) or (min1 <= min2 and max1 >= max2)
            #get the overlap plus the distance from the minimum end points
            mins = abs projection1.min - projection2.min
            maxs = abs projection1.max - projection2.max
            #NOTE: depending on which is smaller you may need to
            #negate the separating axis!!
            magnitude += if mins < maxs then mins else maxs
        magnitude      
    
    testAxes = (shape1, shape2, sharedData) ->
        {minAngle, minMagnitude} = sharedData
    
        #loop over the axes
        for axis in getShapeAxes shape1, shardedData
            #project both shapes onto the axis
            projection1 = projectShape shape1, axis
            projection2 = projectShape shape2, axis
            #get the overlap
            magnitude = getProjectionOverlap projection1, projection2
            #do the projections overlap?
            if magnitude is false
                #then we can guarantee that the shapes do not overlap
                return false
            #check for minimum
            if magnitude < minMagnitude
                #then set this one as the smallest
                minMagnitude = magnitude
                minAngle = axis
        sharedData.minAngle = minAngle
        sharedData.minMagnitude = minMagnitude
        true
    
    #determines if shape is colliding with given shape
    isColliding: (otherShape) ->
        sharedData = {minAngle: null, minMagnitude: Infinity}
        if not testAxis(this, otherShape, sharedData)
            return false #value only continue tests if value is not false
        
        if not testAxis(otherShape, this, sharedData)
            return false
        #if both return true then we know that every axis had overlap on it
        #so we can guarantee an intersection
        
        
        {minAngle, minMagnitude} = sharedData
        minAngle.toMagnitude(minMagnitude)