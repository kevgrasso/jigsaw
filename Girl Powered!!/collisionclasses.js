(function () {
	//collision+shapes,
		var testShape;
	//TODO: lineline boxline circleline linepoint, more shapes, return vector+penetration
	
	function testShapes(shape1, shape2, func, checklist) {
		var shapeid1 = shape1.getid(),
			shapeid2 = shape2.getid(),
			key;
		
		//so that there's only one possible key for each combination
		if (shapeid1 < shapeid2) {
			key = shapeid1 + '.' + shapeid2;
		} else {
			key = shapeid2 + '.' + shapeid1;
		}
		
		//check if we've already checked these shapes, then,
		//if there is a collision, inform its actor
		if (!checklist[key] && shape1.isColliding(shape2)) {
			switch(typeof func) {
			case 'function':
				func(shape1, shape2);
				break;
			case 'string':
				if (shape1.parent[func]) {
					shape1.parent[func](shape2);
				}
				if (shape2.parent[func]) {
					shape2.parent[func](shape1);
				}
				break;
			}
		}//end_if
		checklist[key] = true;   //mark that we've tested these shapes
	}
	
	function iterateShapes(list1, list2, func, swapped) {
		var i, j, //iterators
			shape1, shape2, //hold shapes from lists
			checklist = { };  //contains every potential collision tested
							  //used to prevent two objects from colliding muliple times
						
		//we can do fewer tests if we're testing a list against itself
		if (list2) {
			//test every shape in list1 against every shape in list2
			for (i = 0; i+1 < list1.length; i += 1) {
				shape1 = list1[i];
				
				for (j = i; j < list2.length; j += 1) {
					shape2 = list2[j];
					
					if (!swapped) {
						testShapes(shape1, shape2, func, checklist);
					} else {
						testShapes(shape2, shape1, func, checklist);
					}
				}
			}//end_for
			
		} else {
			//test every possible combination of shapes
			for (i = head1; i !== null; i = i.next) {
				shape1 = k.data;
				
				for (j = head2; j !== null; j = j.next) {
					shape2 = l.data;
					
					if (!swapped) {
						testShapes(shape1, shape2, func, checklist);
					} else {
						testShapes(shape2, shape1, func, checklist);
					}
				}
			}//end_for
			
		}//end_ifelse
	}
	
	function processGroups(grid, group1, group2, func) {
		var i, j, //iterators
			pool,
			cell, 
			list1, list2,
			head;
		
		if (typeof group1 === 'string') {
			pool = group1;
		} else if (typeof group2 === 'string') {
			pool = group2;
		}
		
		if (pool) {
			for (i in grid.pools[pool]) {
				if (grid.pools[pool].hasOwnProperty(i)) {
					//set head to the head of pool's nodes
					cell = grid.pools[pool][i];
					
					if (typeof group1 === 'string') {
						list1 = [];
						head = cell.shapes[pool];
						for (j = head; j.next !== null; j = j.next) {
							list1.push = j.data;
						}
					} else {
						list1 = group1;
					}
					
					if (group2) {
						if (typeof group2 === 'string') {
							list2 = [];
							head = cell.shapes[pool];
							for (j = head; j.next !== null; j = j.next) {
								list2.push = j.data;
							}
						} else {
							list2 = group2;
						}
						
						if (list1.length <= list2.length) {
							iterateShapes(list1, list2, func, false);
						} else {
							iterateShapes(list2, list1, func, true);
						}
					} else {
						iterateShapes(list1, null, func, false);
					}
					
				}
			}//end_forin
		} else {
			iterateShapes(group1, group2, func, false);
		}
		
	}
	
	CollisionCell = Cell.makeClass(function () {
		this.shapes = { };
		this.shapelist = { };
		
		Cell.apply(this, arguments);
	}, {
		
		shapes: null,
		shapelist: null,
		
		register: function (obj) {
			var i, shape, pool, id, node;
			
			for (i in obj.shapes) {
				if (obj.shapes.hasOwnProperty(i)) {
					shape = obj.shapes[i];
					pool = shape.pool;
					id = shape.getid();
					
					if (this.shapelist[id]) {
						node = this.shapelist[id];
						node.num += 1;
					} else {
						node = new LinkNode(shape, this.shapes[pool]);
						node.num = 1;
						
						this.shapes[pool] = node;
						this.shapelist[id] = node;
						
						if (!this.grid.pools[pool]) {
							this.grid.pools[pool] = { };
							this.grid.poolcount[pool] = { count: 0 };
						} 
						if (this.grid.pools[pool][this.getid()]) {
							this.grid.poolcount[pool][this.getid()] += 1;
						} else {
							this.grid.pools[pool][this.getid()] = this;
							this.grid.poolcount[pool][this.getid()] = 1;
							this.grid.poolcount[pool].count += 1;
						}
					}
				}
			}
		},
		
		deregister: function (obj) {
			var i, shape, pool, id, node;
			
			for (i in obj.shapes) {
				if (obj.shapes.hasOwnProperty(i)) {
					shape = obj.shapes[i];
					pool = shape.pool;
					id = shape.getid();
					
					node = this.shapelist[id];
					
					if (node.num > 1) {
						node.num -= 1;
					} else {
						if (node === this.shapes[pool]) {
							this.shapes[pool] = node.deconstructor();
						} else {
							node.deconstructor();
						}
						delete this.shapelist[id];
						
						this.grid.poolcount[pool][this.getid()] -= 1;
						if (this.grid.poolcount[pool][this.getid()] === 0) {
							delete this.grid.pools[pool][this.getid()];
							delete this.grid.poolcount[pool][this.getid()];
							
							this.grid.poolcount[pool].count -= 1;
							if (this.grid.poolcount[pool].count === 0) {
								delete this.grid.pools[pool];
								delete this.grid.poolcount[pool];
							}
						}
					}
				}
			}
		}
	});
	
	CollisionGrid = Grid.makeClass(function () {
		//TODO: subgrids
		
		this.pools = { };
		this.poolcount = { };
		
		this.collisions = [];
	
		return Grid.apply(this, arguments);
	}, {
		cell: CollisionCell,
		
		subgrid: null,
		
		pools: null,
		poolcount: null,
		
		collisions: null,
		
		addCollision: function (pool1, pool2, func) {
			this.collisions.push({
				pool1: pool1,
				pool2: pool2,
				func: func
			});
		},
		removeCollision: function(pool1, pool2) {
			var i; //iterator
			for (i = 0; i<collisions.length; i += 1) {
				if (this.collisions[i].pool1 === pool1 && this.collisions[i].pool2 === pool2) {
					this.collisions.splice(i, 1);
					break;
				}
			}
		},
		getCollisions: function (group1, group2) {
			var collisionList = [ ];
			processGroups(this, group1, group2, collisionList);
			
			return collisionList;
		},
		test: function () {
			var i, //iterator
				pool1, pool2, func; //data from collisions array
			
			for (i = 0; i < this.collisions.length; i += 1) {
				pool1 = this.collisions[i].pool1;
				pool2 = this.collisions[i].pool2;
				func = this.collisions[i].func;
					
				processGroups(this, pool1, pool2, func);
			}
		}
	});
		testShape = {
		
			boxbox: function (a, b) { //hide
				//If any of the sides from shape1 are outside of shape2
				return (a.bottom >= b.top && a.top <= b.bottom && a.right >= b.left && a.left <= b.right);
			},
			circlecircle: function (a, b) { //hide
				return (Math.sqrt( Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2 ) )) <= (a.radius + b.radius);
				//if the distance between the two points is less than their combined radius,
				//they are intersecting
			},
			lineline: function (a, b) { //hide
				return ;
			},
			pointpoint: function (a, b) { //hide
				return a.x === b.x && a.y === b.y;
			},
			boxcircle: function (a, b) { //hide
				var aX, aY;
				//find closest X offset
				if (b.x <= a.left) {
					aX = a.left;
				} else if (b.x >= a.right) {
					aX = a.right;
				} else {
					aX = b.x;
				}
				//find closest Y offset
				if (b.y <= a.top) {
					aY = a.top;
				} else if (b.y >= a.bottom) {
					aY = a.bottom;
				} else {
					aY = b.y;
				}
				//if closest point is inside the circle, there is collision
				return (Math.sqrt( Math.pow(b.x - aX, 2) + Math.pow(b.y - aY, 2 ) )) <= 0;
			},
			boxline: function (a, b) { //hide
				return ;
			},
			boxpoint: function (a, b) { //hide
				//If any of the sides from shape1 are outside of shape2
				return (a.bottom >= b.y && a.top <= b.y && a.right >= b.x && a.left <= b.x);
			},
			circleline: function (a, b) { //hide
				return ;
			},
			circlepoint: function (a, b) { //hide
				return (Math.sqrt( Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2 ) )) <= 0;
			},
			linepoint: function (a, b) { //hide
				return ;
			}
		};
	
	function getAttrib(shape) {
		var value = { },
			xOffset = shape.parent.x, yOffset = shape.parent.y;
		
		switch (shape.type) {
		case 'box':
			value.top    = yOffset + shape.y;
			value.bottom = yOffset + shape.y + shape.height;
			value.left   = xOffset + shape.x;
			value.right  = xOffset + shape.x + shape.width;
			break;
		case 'circle':
			value.x      = xOffset + shape.x;
			value.y      = yOffset + shape.y;
			value.radius = shape.radius;
			break;
		case 'line':
			value.x1 	 = xOffset + shape.x;
			value.y1 	 = yOffset + shape.y;
			value.x2 	 = xOffset + shape.endx;
			value.y2 	 = yOffset + shape.endy;
			break;
		case 'point':
			value.x  	 = xOffset + shape.x;
			value.y 	 = yOffset + shape.y;
			break;
		}
		
		return value;
	}
	
	Shape = makeClass(function (spec) {
		this.parent = spec.parent;
		this.pool = spec.pool;
		
		this.x = spec.x;
		this.y = spec.y;
	}, {
		parent: null,
		type: null,
		pool: null,
		
		x: 0,
		y: 0,
		
		getX: function () {
			return this.parent ? this.parent.x+this.x : this.x;
		},
		getY: function () {
			return this.parent ? this.parent.y+this.y : this.y;
		},
		
		isColliding: function (otherShape) { 
			//select appropriate insection detection algorithm
			//and calculate required variables
			var testName = this.type + otherShape.type;
			
			if (!testShape[testName]) {
				return testShape[testName](getAttrib(this), getAttrib(otherShape));
			} else {
				return testShape[otherShape.type + this.type](getAttrib(otherShape), getAttrib(this));
			}
		},
		
		ejectShape: function (other, dXOther, dYOther, dXThis, dYThis) {
			//this function assumes this and otherShape are colliding.
			var dX, dY, xDepth, yDepth;
			//the basic principal is that otherShape should be ejected in either one
			//of the directions it is moving or one one the directions this Shape is moving

			//determine otherShape's movement vector from this Shape's POV)
			dX = dXOther - dXThis;
			dY = dYOther - dYThis;
		
			//determine the depth of penetration for relevant directions 
			if (dY > 0) {		//moving down
				yDepth = this.getTop() - other.getBottom();
			} else if (dY < 0) {//moving up
				yDepth = this.getBottom() - other.getTop();
			}
				
			if (dX > 0) {		//moving right
				xDepth = this.getLeft() - other.getRight();
			} else if (dx < 0) {//moving left
				xDepth = this.getRight() - other.getLeft();
			}
			
			//if moving diagonally, the direction of ejection
			//is the one with the smallest depth of penetration
			if ((dX !== 0) && (dY !== 0)) {
				if (xDepth > yDepth) {
					return {x:0, y:yDepth};
				} else {
					return {x:xDepth, y:0};
				}
			} else {
				return {x:xDepth||0, y:yDepth||0};
			}
		}
	});
	
	Box = Shape.makeClass(function (spec) {
		Shape.call(this, spec);
		this.boundaryBox = this;
		
		this.height = spec.height;
		this.width = spec.width;
	}, {
		type: 'box',
		
		height: 0,
		width: 0,
		
		getTop: function () {
			return this.getY()-(this.height/2);
		},
		getBottom: function () {
			return this.getY()+(this.height/2);
		},
		getLeft: function () {
			return this.getX()-(this.width/2);
		},
		getRight: function () {
			return this.getX()+(this.width/2);
		}
	});
	
	Circle = Shape.makeClass(function(spec) {
		Shape.call(this, spec);
		this.boundaryBox = new Box({ 
			pool: this.pool,
			x: this.relx,
			y: this.rely,
			height: this.radius,
			width: this.radius
		});
		
		this.radius = spec.radius;
	}, {
		type: 'circle',
		
		radius: 0
	});
	
	Line = Shape.makeClass(function (spec) {
		Shape.call(this, spec);
		this.boundaryBox = {
			pool: this.pool,
			x: (this.x+endx)/2,
			y: (this.y+endy)/2,
			height: Math.abs(endx),
			width: Math.abs(endy)
		};
		
		this.endx = spec.endx;
		this.endy = spec.endy;
	}, {
		type: 'line',
		
		endx: 0,
		endy: 0
	});
	
	Point = Shape.makeClass(function (spec) {
		Shape.call(this, spec);
		this.boundaryBox = {
			pool: this.pool,
			x: this.x,
			y: this.y,
			height: 0,
			width: 0
		};
	}, {type: 'point'});
}());