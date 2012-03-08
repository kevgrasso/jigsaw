#collsionclasses.coffee: collision-related classes
    
#ties together sprites and shapes for coherent movement
class window.Actor
    constructor: (spec) ->
        {@pos, sprites, shapes, @grid, @topLeft, @bottomRight} = spec
        @pos ?= Vector.Zero(2)

        @sprites = {}
        if sprites?
            for own name, spec of sprites
                spec.parent = this
                @sprites[name] = new Sprite(spec)
        @shapes = {}
        if shapes?
            for own name, spec of shapes
                    spec.parent = this
                    @shapes[name] = new Shape(spec)

        @moveQueue = [].extend
            pushRel: (vector) ->
                @push {rel: vector.dup()}
            pushAbs: (vector) ->
                @push {abs: vector.dup()}
        
        @topLeft ?= Vector.Zero(2)
        @bottomRight ?= Vector.Zero(2)
        @topRight = $V [@bottomRight.getX(), @topLeft.getY()]
        @bottomLeft = $V [@topLeft.getX(), @bottomRight.getY()]
        
        if @grid?
            @topLeftCell = @grid.insert(this, @pos.add @topLeft)
            @topRightCell = @grid.insert(this, @pos.add @topRight)
            @bottomLeftCell = @grid.insert(this, @pos.add @bottomLeft)
            @bottomRightCell = @grid.insert(this, @pos.add @bottomRight)

        @dimAdjust()
    
    sprites: null #object containing all sprites by name
    shapes: null #object containing all shapes by name
    grid: null #collision grid which shapes are registered to

    pos: null #vector of aboslute position

    lastMove: null #vector containing the previous movement

    #relative location of dimensions
    topLeft: null
    topRight: null
    bottomLeft: null
    bottomRight: null

    #cells containing the entity's corners
    topLeftCell: null
    topRightCell: null
    bottomLeftCell: null
    bottomRightCell: null
    
    #
    dimRecalc: ->
    
    #recalculates dimensions and reregisters shapes
    dimAdjust: ->
        @topLeftCell = @topLeftCell?.update(this, @pos.add @topLeft)
        @topRightCell = @topRightCell?.update(this, @pos.add @topRight)
        @bottomLeftCell = @bottomLeftCell?.update(this, @pos.add @bottomLeft)
        @bottomRightCell = @bottomRightCell?.update(this, @pos.add @bottomRight)
    
    #precalculates result of next move from moveQueue
    getMove: (emptyQueue = false) ->
        buffer = Vector.Zero(2)


        @moveQueue.reverse()
        loop
            movement = @moveQueue.pop()
            break if not movement?
            
            buffer = buffer.add movement.rel if movement.rel
            buffer = movement.abs if movement.abs

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
        
        for own name, shape of obj.shapes
            pool = shape.pool
            id = shape.getID()

            if @shapelist[id]?
                record = @shapes[pool][@shapelist[id]]
                record.num += 1
            else
                record = {shape, num: 1}
                if not @shapes[pool]?
                    @shapes[pool] = [record]
                    @shapelist[id] = 0
                else
                    #Array::push returns new length of Array
                    @shapelist[id] = @shapes[pool].push(record)-1

                if not @grid.pools[pool]?
                    @grid.pools[pool] = {}
                    @grid.poolcount[pool] = {count: 0}
                
                if @grid.pools[pool][@getID()]
                    @grid.poolcount[pool][@getID()] += 1
                else
                    @grid.pools[pool][@getID()] = this
                    @grid.poolcount[pool][@getID()] = 1
                    @grid.poolcount[pool].count += 1
        this
    
    #registers shapes of actor (or given shape) into cell+grid
    deregister: (obj) ->
        obj = {shapes: {obj}} if obj instanceof Shape
        
        for own name, shape of obj.shapes
            id = shape.getID()
            pool = shape.pool
            shapePos = @shapelist[id]
            record = @shapes[pool][shapePos]

            if record.num > 1
                record.num -= 1
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
        @shapes.isEmpty()
    
    #updates grid state to new position, returning containing cell
    update: (obj, absPos) ->
        gridPos = @grid.getGridPos(absPos)
        [gridX, gridY] = gridPos.elements
        
        if @grid[gridX]?[gridY] isnt this
            isEmpty = @deregister obj
            if isEmpty then @grid.removeCell @gridPos
            @grid.insert(obj, absPos)
        else this

#grid for managing collisions
class window.CollisionGrid extends Grid     #TODO: subgrids
    constructor: (spec) ->
        {state, priority, trigID} = spec
        spec.CellType ?= CollisionCell
        if spec.gridStart? or spec.gridStop? and not spec.gridSize? #todo: simple collision
            throw new Error "CollisionGrid can not use grid dimensions"
        super(spec)
        
        @pools = {}
        @poolcount = {}

        @collisions = []

        if state? or priority?
            unless (state? and priority?)
                throw new Error 'CollisionCell not given state AND priority'
            @subscribeTo(state, priority, trigID)
    
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
        if not checklist[key]
            value = shape1.isColliding shape2
            if value isnt false
                switch typeof func
                    when 'function'
                        func(shape1, shape2, value)
                    when 'string'
                        shape1.parent[func]?(shape2, value)
                        shape2.parent[func]?(shape1, value)
            checklist[key] = true   #mark that we've tested these shapes
    
    #iterates over shapes of single list
    iterateShapeSingle = (list1, func, checklist) ->
        
        #test every possible combination of shapes
        for index1 in [0...list1.length-1]
            shape1 = list1[index1].shape
            
            for index2 in [index1+1...list1.length]
                shape2 = list1[index2].shape
                
                testShapes(shape1, shape2, func, checklist)
        undefined
    
    #iterates over shapes of two lists
    iterateShapePair = (list1, list2, func, checklist) ->
        
        #test every shape in list1 against every shape in list2
        for record1 in list1
            shape1 = record1.shape;

            for record2 in list2
                shape2 = record2.shape;
                
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
            for own cellID, cell of grid.pools[pool]
                if typeof group1 is 'string'
                    list1 = cell.shapes[group1]
                else
                    list1 = [{shape: group1}]

                if group2 and group1 isnt group2
                    if typeof group2 is 'string'
                        list2 = cell.shapes[group2]
                    else
                        list2 = [{shape: group2}]
                    
                    iterateShapePair(list1, list2, func, checklist)
                else if list1.length >= 2
                    iterateShapeSingle(list1, func, checklist)
        else
            iterateShapes(group1, group2, func, checklist)
        undefined

    #public
    
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
    
    #add 
    addCell: (gridPos) ->
        [gridX, gridY] = gridPos.elements
        
        this[gridX] ?= {}
        cell = this[gridX][gridY] = new @CellType(this, gridPos)
    
    #
    removeCell: (gridPos) ->
        [gridX, gridY] = gridPos.elements
        
        delete this[gridX][gridY]
        if this[gridX].isEmpty()
            delete this[gridX]
        
        
    #insert actor or shape into the grid
    insert: (obj, absPos) ->
        gridPos = @getGridPos absPos
        [gridX, gridY] = gridPos.elements
        
        cell = this[gridX]?[gridY]
        if not cell then cell = @addCell gridPos
        cell.register obj
        
        cell
    
    #check all collisions on list
    step: ->
        processGroups(this, v.pool1, v.pool2, v.func) for v in @collisions
        undefined

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
        @getAbsVertex(index) for index in [0...@vertices.length]
    
    #a lot of the following SAT collision testing code is by William of Code Zealot
    
    getShapeAxes= (shape, sharedData) ->
        #loop over the vertices
        vertices = shape.vertices
        for vertex1, index in vertices
            #get the next vertex
            vertex2 = vertices[index+1] ? vertices[0]
            
            #subtract the two to get the edge vector
            edge = vertex1.subtract vertex2
            #get either perpendicular vector
            normal = edge.perp()
            #normalize the axis
            unit = normal.toUnitVector()
            
            #following optimization doesn't work right yet:
            #degrees = normal.getDegrees().toFixed(7)#7 is the default precision of sylvester
            #if sharedData[radians] #don't angle push if it has already been tested
            #    sharedData[radians] = true
            #    unit
            #else
            #    continue
        
    projectShape = (shape, axis) ->
        vertices = shape.getAbsVertices()
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
        if min1 >= max2 or min2 >= max1
            return false
        else if min1 < min2
            magnitude = max1-min2
        else
            magnitude = max2-min1
        
        #check for containment
        if (min1 >= min2 and max1 <= max2) or (min1 <= min2 and max1 >= max2)
            #get the overlap plus the distance from the minimum end points
            deltaMin = Math.abs min1 - min2
            deltaMax = Math.abs max1 - max2
            #NOTE: depending on which is smaller you may need to
            #negate the separating axis!!
            magnitude += if deltaMin < deltaMax then deltaMin else deltaMax
        magnitude      
    
    testAxes = (shape1, shape2, sharedData) ->
        {minAngle, minMagnitude} = sharedData
    
        #loop over the axes
        for axis in getShapeAxes shape1, sharedData
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
        if not testAxes(this, otherShape, sharedData)
            return false #only continue tests if doesn't return false
        
        if not testAxes(otherShape, this, sharedData)
            return false
        #if both return true then we know that every axis had overlap on it
        #so we can guarantee an intersection
        
        {minAngle, minMagnitude} = sharedData
        minAngle.multiply(minMagnitude)