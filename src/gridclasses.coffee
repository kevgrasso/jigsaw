#gridclasses.coffee: classes concerning grids

#default cell
class window.Cell
    constructor: (@grid, @gridX, @gridY) ->
        @top = gridY*@grid.cellHeight
        @bottom = (gridY+1)*@grid.cellHeight
        @left = gridX*@grid.cellWidth
        @right = (gridX+1)*@grid.cellWidth
    
    grid: null #grid which cell is a part of
    
    #position in grid array
    gridX: 0
    gridY: 0
    
    #absolute coordinates of borders
    top: 0
    bottom: 0
    left: 0
    right: 0
    
    #get cell by relative position
    getRelCell: (relX, relY) ->
        @grid[@gridX+relX]?[@gridY+relY] ? null

#chops coordinate space into Cells
class window.Grid
    constructor: (spec) ->
        {@cell} = spec if spec.cell?
        {@gridWidth, @gridHeight, @cellWidth, @cellHeight} = spec

        for gridX in [0..@gridWidth/@cellWidth]
            column = this[gridX] = []
            column[gridY] = new @cell(this, gridX, gridY) for gridY in [0..@gridHeight/@cellHeight]

    cell: Cell #type of cell used in grid

    #cell dimensions
    cellHeight: 0
    cellWidth: 0
    #grid dimensions
    gridHeight: 0
    gridWidth: 0
    
    
    #converts absolute coords to their corresponding position in the grid array
    getCX: (x) ->
        Math.floor x/@cellWidth
    getCY: (y) ->
        Math.floor y/@cellHeight
    
    #returns cell at given position
    getCellAt: (pos) ->
        cellX = @getCX(pos.getX())
        cellY = @getCY(pos.getY())
        
        this[cellX]?[cellY] ? null
    
    #returns cell at given xy coordinate
    getCellXY: (x, y) ->
        this[@getCX(x)]?[@getCY(y)] ? null
    
    #returns cells containing given bounds
    getCellArray: (xLeft, xRight, yTop, yBottom) ->
        gridLeft = @getCX xLeft
        gridRight = @getCX xRight
        gridTop = @getCY yTop
        gridBottom = @getCY yBottom

        (this[x][y] for y in [gridTop..gridBottom] for x in [gridLeft..gridRight])
    
    getAllCells: ->
        [].concat (cell for cell in row for own column, row of this when isNumeric(column))...
                