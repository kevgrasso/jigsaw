(function () {
	//grids+cells
	Cell = makeClass(function (grid, cx, cy) {
		this.grid = grid;
		
		this.cx = cx;
		this.cy = cy;
		
		this.x1 = cx*this.grid.cellw;
		this.y1 = cy*this.grid.cellh;
		this.x2 = cx*(this.grid.cellw+1);
		this.y2 = cy*(this.grid.cellh+1);
	}, {
		grid: null,
		
		cx: 0,
		cy: 0,
		
		x1: 0,	//left
		y1: 0,	//top
		x2: 0,	//right
		y2: 0,	//bottom
		
		getRelCell: function (relx, rely) {
			return this.grid[this.cx+relx][this.cy+rely] || null;
		}
	});

	Grid = makeClass(function (spec) {
		var i, j;
		
		this.cell = spec.cell = spec.cell || this.cell;
		
		this.gridw = spec.gridw;
		this.gridh = spec.gridh;
		
		this.cellw = spec.cellw;
		this.cellh = spec.cellh;
		
		for (i = 0; i < this.gridw/this.cellw; i += 1) {
			this[i] = [];
			for (j = 0; j < this.gridh/this.cellh; j += 1) {
				this[i][j] = new this.cell(this, i, j);
			}
		}
		
	}, {
		cell: Cell,
		
		cellh: 0, //TODO: gridstart, gridend, cellstart, cellend
		cellw: 0,
		gridh: 0,
		gridw: 0,
		
		getcx: function (x) {
			return Math.floor(x/this.cellw);
		},
		getcy: function (y) {
			return Math.floor(y/this.cellh);
		},
		getcell: function (x, y) {
			var cellx = this.getcx(x),
				celly = this.getcy(y);
			if (this[cellx] && this[cellx][celly]) {
				return this[cellx][celly];
			} else {
				return null;
			}
		},
		getcellarray: function (x1, x2, y1, y2) {
			var top = this.getcy(y1),
				bottom = this.getcy(y2),
				left = this.getcy(x1),
				right = this.getcy(x2),
				value = [ ],
				i, j;
			
			for (i = left; i <= right; i += 1) {
				for (j = top; j <= bottom; j += 1) {
					value.push(this[i][j]);
				}
			}
			
			return value;
		}
	});
}());