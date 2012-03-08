#gridclasses.coffee: classes concerning grids

#default cell
class window.Cell
    constructor: (@grid, @gridPos) ->
        @cellSize = @grid.cellSize
        if @cellSize
            [gridX, gridY] = @gridPos.elements
            [cellWidth, cellHeight] = @grid.cellSize.elements
            absX = gridX*cellWidth
            absY = gridY*cellHeight

            @topLeft = $V [absX, absY]
            @bottomRight = @topLeft.add @grid.cellSize
        else
            @topLeft = $V [-Infinity, -Infinity]
            @bottomRight = $V [Infinity, Infinity]
    
    grid: null #grid which cell is a part of
    cellSize: null
    
    #position in grid array
    gridPos: null
    
    #absolute coordinates of borders
    topLeft: null
    bottomRight: null
    
    #get cell by relative position
    getRelCell: (relPos) ->
        absPos = relPos.add(@gridPos)
        [absX, absY] = absPos.elements
        @grid[@gridX+relX]?[@gridY+relY] ? null

#chops coordinate space into Cells
class window.Grid
    constructor: (spec) ->
        {@gridStart, @gridStop, @cellSize} = spec
        @CellType = spec.CellType ? Cell
        
        if @gridStop?
            @gridStart = $V([0,0]) if not @gridStart?
            
            [gridStartX, gridStartY] = @gridStart.elements
            [gridStopX, gridStopY] = @gridStop.elements
            [cellWidth, cellHeight] = @cellSize.elements
        
            if gridStartX%cellWidth isnt 0 or gridStopX%cellWidth isnt 0 or
                gridStartY%cellHeight isnt 0 or gridStartY%cellHeight isnt 0
                    throw new Error("#{@gridStart.inspect()} doesn't divide into #{@cellSize.inspect()} evenly")

            for gridX in [gridStartX/cellWidth..gridStopX/cellWidth]
                this[gridX] = {}
                for gridY in [gridStartY/cellHeight..gridStopY/cellHeight]
                    this[gridX][gridY] = new @Cell(this, $V [gridX, gridY])
        else if @gridStart?
            throw new Error "gridStart defined, but not gridStop"
        else if not @cellSize?
            this[0][0] = new @CellType(this, Vector.Zero(2))
    
    CellType: null
    cellSize: null
    
    #grid dimensions
    gridStart: null
    gridStop: null
    
    
    #converts absolute coords to their corresponding position in the grid array
    getGridPos: (pos) ->
        return $V([0,0]) unless @cellSize
        
        gridX = Math.floor pos.getX()/@cellSize.getX()
        gridY = Math.floor pos.getY()/@cellSize.getY()
    
        $V [gridX, gridY]
    
    #returns cell at given position
    getCellAt: (pos) ->
        cellPos = @getGrodPos pos
        [cellX, cellY] = cellPos.elements
        
        this[cellX]?[cellY] ? null
    
    #returns cells containing given bounds
    getCellArray: (topLeftPos, bottomRightPos) ->
        gridTopLeft = @getGridPos topLeftPos
        gridBottomRight = @getGridPos bottomeRightPos
        
        [gridLeft, gridTop] = gridTopLeft.elements
        [gridRight, gridBottom] = gridBottomRight.elements

        (this[x]?[y] for y in [gridTop..gridBottom] for x in [gridLeft..gridRight])
    
    getAllCells: ->
        [].concat (cellfor cell in row for own column, row of this when isNumeric(column))...
                