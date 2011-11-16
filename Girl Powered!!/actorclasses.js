(function () {
	//grids+cells+actors
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
	
	Actor = makeClass(function (spec) {
		var i;
		
		this.pos = spec.pos || Vector.Zero(2);
		
		this.sprites = { };
		if (spec.sprites) {
			for (i in spec.sprites) {
				if (spec.sprites.hasOwnProperty(i)) {
					spec.sprites[i].parent = this;
					this.sprites[i] = new Sprite(spec.sprites[i]);
				}
			}
		}
		this.shapes = { };
		if (spec.shapes) {
			for (i in spec.shapes) {
				if (spec.shapes.hasOwnProperty(i)) {
					spec.shapes[i].parent = this;
					this.shapes[i] = Shape.create(spec.shapes[i]);
				}
			}
		}
		
		if (spec.grid) {
			this.grid = spec.grid;
		}
		
		this.moveQueue = extend([], {
			pushRel: function (vector) {
				this.push({rel: vector});
			},
			pushAbs: function (vector) {
				this.push({abs: vector});
			}
		});
		
		this.top = spec.top || 0;
		this.bottom = spec.bottom || 0;
		this.left = spec.left || 0;
		this.right = spec.right || 0;
		if (spec.attrib) {
			this.extend(spec.attrib);
		}
		
		this.dimAdjust();
	}, {
		sprites: null,
		shapes: null,
		grid: null,
		
		pos: null,
		
		lastMove: null,
		
		//relative location of dimensions
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		
		//absolute location of dimensions
		x1: 0,	//left
		y1: 0,	//top
		x2: 0,	//right
		y2: 0,	//bottom
		
		//cells which contain the corners of the entity
		cells: null,
		celltl: null,
		celltr: null,
		cellbl: null,
		cellbr: null,
		
		//METHODS:
		dimAdjust: function () {
			var grid = this.grid,
				gridx1, gridx2, gridy1, gridy2;
			
			//calculate edges
			this.x1 = this.left + this.pos.elements[0];
			this.y1 = this.top + this.pos.elements[1];
			this.x2 = this.right + this.pos.elements[0];
			this.y2 = this.bottom + this.pos.elements[1];
			
			if (this.grid) {
				//match each edge to a row or column on the grid
				gridx1 = grid.getcx(this.x1);
				gridx2 = grid.getcx(this.x2);
				gridy1 = grid.getcy(this.y1);
				gridy2 = grid.getcy(this.y2);
				
				//i could do: if (cell !== ((temp = grid[gridx]) && temp[gridy] || null))
				//but really wouldn't be worth the decline in readability
				
				//top left corner
				if (this.celltl !== (grid[gridx1] && grid[gridx1][gridy1] || null)) {
					if (this.celltl !== null) {
						this.celltl.deregister(this);
					}
					
					this.celltl = (grid[gridx1] && grid[gridx1][gridy1] || null);
					if (this.celltl) {
						this.celltl.register(this);
					}
				}
				
				//bottom left corner
				if (this.cellbl !== (grid[gridx1] && grid[gridx1][gridy2] || null)) {
					if (this.cellbl !== null) {
						this.cellbl.deregister(this);
					}
					
					this.cellbl = (grid[gridx1] && grid[gridx1][gridy2] || null);
					if (this.cellbl) {
						this.cellbl.register(this);
					}
				}
				
				//top right corner
				if (this.celltr !== (grid[gridx2] && grid[gridx2][gridy1] || null)) {
					if (this.celltr !== null) {
						this.celltr.deregister(this);
					}
					
					this.celltr = (grid[gridx2] && grid[gridx2][gridy1] || null);
					if (this.celltr) {
						this.celltr.register(this);
					}
				}
				
				//bottom right corner
				if (this.cellbr !== (grid[gridx2] && grid[gridx2][gridy2] || null)) {
					if (this.cellbr !== null) {
						this.cellbr.deregister(this);
					}
					
					this.cellbr = (grid[gridx2] && grid[gridx2][gridy2] || null);
					if (this.cellbr) {
						this.cellbr.register(this);
					}
				}
			}
		},
		
		getMove: function (emptyQueue) {
			var i, buffer = Vector.Zero(2);
			
			
			this.moveQueue.reverse();
			for (i = this.moveQueue.pop(); i; i = this.moveQueue.pop()) { 
				if (i.rel) {
					buffer = buffer.add(i.rel);
				}
				
				if (i.abs) {
					buffer = i.abs;
				}
			}
			
			if (!emptyQueue) {
				this.moveQueue.push({rel: buffer});
			}
			
			return buffer;
		},
		
		move: function () {
			var dist = this.getMove(true);
			
			this.pos = this.pos.add(dist);
			this.lastMove = dist;
			
			return this.dimAdjust();
		}
	});
}());