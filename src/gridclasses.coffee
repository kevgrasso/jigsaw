#gridclasses.coffee: classes concerning grids

#default cell
class window.Cell
    constructor: (@grid, @cx, @cy) ->
        @x1 = cx*@grid.cellw
        @y1 = cy*@grid.cellh
        @x2 = cx*(@grid.cellw+1)
        @y2 = cy*(@grid.cellh+1)
    
    grid: null #grid which cell is a part of
    
    #position in grid array
    cx: 0
    cy: 0
    
    #absolute coordinates of borders
    x1: 0	#left
    y1: 0	#top
    x2: 0	#right
    y2: 0	#bottom
    
    #get cell by relative position
    getRelCell: (relx, rely) ->
        @grid[@cx+relx][@cy+rely] ? null

#chops coordinate space into Cells
class window.Grid
    constructor: (spec) ->
        {@cell} = spec if spec.cell?
        {@gridw, @gridh, @cellw, @cellh} = spec

        for i in [0..@gridw/@cellw]
            this[i] = []
            this[i][j] = new @cell(this, i, j) for j in [0..@gridh/@cellh]

    cell: Cell #type of cell used in grid

    #cell dimensions
    cellh: 0
    cellw: 0
    #grid dimensions
    gridh: 0
    gridw: 0
    
    
    #converts absolute coords to their corresponding position in the grid array
    getCX: (x) ->
        Math.floor x/@cellw
    getCY: (y) ->
        Math.floor y/@cellh
    
    #returns cell at given position
    getCellAt: (pos) ->
        cellx = @getCX(pos.getX())
        celly = @getCY(pos.getY())
        
        this[cellx]?[celly] ? null
    
    #returns cell at given xy coordinate
    getCellXY: (x, y) ->
        this[@getCX(x)]?[@getCY(y)] ? null
    
    #returns cells containing given bounds
    getCellArray: (x1, y1, x2, y2) ->
        top = @getcy y1
        bottom = @getcy y2
        left = @getcy x1
        right = @getcy x2

        (this[i][j] for j in [top..bottom] for i in [left..right])
    
    getAllCells: ->
        [].concat (cell for cell in row for own column, row of this when isNumeric(column))...
                