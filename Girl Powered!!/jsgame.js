//JIGSAW HTML5 GAME LIBRARY
//Most code by Kevin Grasso
"use strict";
var COLLISION, DATA, EVENT, JigClass, getid, inherit, FRAGMENT, INPUT, MAP, MATERIALS, SOUND, VIEWPORT;

// class/object functions
function extend(target, src) {
    var i;
    for (i in src) {
        if (src.hasOwnProperty(i)) {
            target[i] = src[i];
        }
    }
    
    return target;
}

JigClass = function () { };

function makeClass(superc, subc, attributes) {
	subc = subc || function () { superc.apply(this, arguments);	};
	
    if (superc) {
        extend(subc.prototype, superc.prototype);
		subc.prototype.isA = superc.prototype.isA.clone();
    } else {
        subc.prototype.isA = { };
    }
	subc.prototype.isA[subc.getid()] = true;
    
    if (attributes) {
        extend(subc.prototype, attributes);
    }
    
    return subc;
}

JigClass.prototype = {
	makeClass: function (subc, attributes) {
		return makeClass(this, subc, attributes);
	}
};


//TODO: allow hard refresh of scripts to be dynamically loaded
function include (filename, callback) {
	var head = document.getElementsByTagName('head')[0],
		e = document.createElement('script'),
		targets = this.targets
		obj = { };
	e.type = 'text/javascript';
	e.charset = 'utf-8';
	
	//setup target object
	if (!targets[filename] ) {
		targets[filename] = [];
	}
	targets[filename].push(obj);
	
	//all browers should call this when script is finished
	e.onload = e.onreadystatechange = function () {
	    if (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") {
	        //cleanup
	        e.onload = e.onreadystatechange = null; // Plug IE memory leak-- even there in IE9!
	        if (targets[filename].length === 0) {
	        	delete this.targets[filename];
	        }
	        head.removeChild(e);
	        
	        if (callback) {
	        	callback(obj, filename);
	        }
	    }
	};
	
	//finish loading script
	e.src = filename;
	head.appendChild(e);
}
include.targets = { };


function getSurface(w, h) {
	var canvas = document.createElement('CANVAS');  
	canvas.setAttribute('width', w);  
    canvas.setAttribute('height', h);  
	
	return canvas.getContext('2d');
}


//Object prototype functions
(function () {
    var proto = Object.prototype;
    
    proto.create = function (spec) {
        function Superc() { }
        Superc.prototype = this;
        
        return extend(new Superc(), spec);
    };
    
    proto.clone = function () {
        return extend({ }, this);
    };
	
	proto.extend = function(src) {
		return extend(this, src);
	};
    
    proto.objectId = null;
    lastid = 0;
	
    proto.getid = function () {
		
        if (!this.hasOwnProperty('objectId')) {
			lastid += 1;
            this.objectId = lastid.toString();
        }
 
        return this.objectId;
    };
    
    proto.makeClass = function (subc, overrides) {
        return makeClass(this, subc, overrides);
    };
	
	proto.isEmpty = function () {
		var i;
		
		for (i in this) {
			if (this.hasOwnProperty(i)) {
				return false;
			}
		}
		return true;
	};
	
	CanvasRenderingContext2D.prototype.clear = function () {
		this.clearRect(0, 0, this.canvas.width, this.canvas.height);
	};
}());

TRIGGER = (function () {
    //hidden vars
    var triggerlist = { }, //includes subscriber info
		bucketstate = { }, 
		objid = { }; //TODO: rename objfunc id
    
    return {
        addTrigger: function (trigger) {
            triggerlist[trigger] = BinaryHeap('priority');
			return;
        },
        removeTrigger: function (trig) {
            delete triggerlist[trigger];
			return;
        },
        
        bucketOn: function (bucket) {
            bucketstate[bucket] = true;
			return;
        },
        bucketOff: function (bucket) {
            delete bucketstate[bucket];
			return;
        },
        
        subscribe: function (obj, func, trigger) {
            var id = obj.getid().toString() + '+' + func.getid().toString(),
				i, buckets = Array.splice.call(arguments, 3),
				entry;
			
            if (!objid[id]) {
            	entry = {
    					func: func,
    					obj: obj,
    					buckets: { }
    			};
				objid[id] = entry;
				triggerlist[trigger].push(entry);
            } else {
				entry = objid[id];
			}
				
			for (i = 0; i < buckets.length; i += 1) {
				entry.buckets[buckets[i]] = true;
			}
			
			return entry;
        },											
        unsubscribe: function (obj, func, trigger) {
            var id = obj.getid() + '+' + func.getid();
			triggerlist[trigger].remove(objid[id]);
			delete objid[id];
			
			return;
        },
        
        fireTrigger: function(trigger) {
            var i, j, args = Array.prototype.slice.call(arguments, 1);
			
			trigger.save();
			for (i = renderlist.pop(); i; i = renderlist.pop) {
				for (j in i.buckets) {
				
					if (i.buckets.hasOwnProperty(j) && this.bucketstate[j]) {
						i.func.apply(i.obj, args);
						break;
					}
				
				}
			}
			trigger.restore();
						
			return;
		}
    };
}());
TRIGGER.bucketOn('global');

INPUT = (function () {
	//hidden vars
	var boolStream = false,
		keystream = [ ],
		keylist = [ ];

	function downhandle(e) {
		var keycode = event.keyCode,
			keyname = keylist[keycode];
        e.preventDefault();
        e.stopImmediatePropagation();
		
		if (!this.state[keyname]) {
			this.state[keyname] = true;
			
			TRIGGER.fire(keyname+'Down');
			this.keydown[keyname] = Time().getTime(); //TODO: double tap
		}
		if (boolStream) {
			keystream.unshift(keycode);
			if (boolEvent) {
				TRIGGER.fireEvent('keystroke', keystream);
			}
		}
		this.lastkey = keycode;
	}
	function uphandle(e) {
		var keyname = keylist[event.keyCode];
        e.preventDefault();
        e.stopImmediatePropagation();
		
		if (this.state[keyname]) {
			this.state[keyname] = false;
			
			TRIGGER.fire(keyname+'Down');
			this.keyup[keyname] = Time().getTime();
		}
	}
    
    return {
        state: { },
        keydown: { },
        keyup: { },
		
		lastkey: null,
		
		streamOn: function () {
			boolStream = true;
		},
		streamOff: function () {
			boolStream = false;
			keystream = [ ];
		},
		
		getStream: function () {
			return keystream.slice(0).reverse();
		},
		
		setKeys: function (newkeys) {
			var keycode, keyname;
			
			for (keycode in newkeys) {
				if (newkeys.hasOwnProperty(keycode) && !keylist[keycode]) {
					keyname = newkeys[keycode];
					
					this.state[keyname] = false;
					this.keyup[keyname] = 0;
					this.keydown[keyname] = 0;
					
					TRIGGER.addEvent(keyname+'Down');
					TRIGGER.addEvent(keyname+'Up');
				}
			}

			for (keycode in keylist) {
				if (keylist.hasOwnProperty(keycode) && !newkeys[keycode]) {
					keyname = newkeys[keycode];
					
					delete this.state[keyname];
					delete this.keyup[keyname];
					delete this.keydown[keyname];
					
					TRIGGER.removeEvent(keyname+'Down');
					TRIGGER.removeEvent(keyname+'Up');
				}
			}
			
			keylist = newkeys;
		}
    };
}());

(function () {    
	//data types
	Coord = makeClass(null, function (x, y) {
		this.x = x;
		this.y = y;
	}, {
		x: 0,
		y: 0,
		
		addxy: function (x, y) {
			return new Coord(this.x+x, this.y+y);
		},
		addcoord: function (coord) {
			return this.addxy(coord.x, coord.y);
		},
		multixy: function (x, y) {
			return new Coord(this.x*x, this.y*y);
		},
		multinum: function (num) {
			return this.multixy(num, num);
		},
		multicoord: function (coord) {
			return this.multixy(coord.x, coord.y);
		},
		
		transform: function (matrix) {
			return new Coord(0, 0);
		},
		reverse: function () {
			return this.multinum(-1);
		},
		swap: function () {
			return Coord(this.y, this.x);
		}
	});
	
	Node = makeClass(null, function (data, next, prev) {
		this.data = data;
		
		if (next) {
			this.next = next;
			next.prev = this;
		}
		if (prev) {
			this.prev = prev;
			prev.next = this;
		}
	}, {
		next: null,
		prev: null,
		
		data: null,
		
		deconstructor: function () {
			if (this.prev) {
				this.prev.next = this.next;
			}
			if (this.next) {
				this.next.prev = this.prev;
			}
			
			return this.next;
		}
	});

	BinaryHeap = makeClass(null, function (scoreName, content){ // this class written by Marijn Haverbeke:
		this.content = content || [];							// http://eloquentjavascript.net/appendix2.html
		this.scoreName = scoreName;
	}, {
		push: function(element) {
			// Add the new element to the end of the array.
			this.content.push(element);
			// Allow it to sink down.
			this.sinkDown(this.content.length - 1);
		},

		pop: function () {
			// Store the first element so we can return it later.
			var result = this.content[0],
			// Get the element at the end of the array.
				end = this.content.pop();
			// If there are any elements left, put the end element at the
			// start, and let it bubble up.
			if (this.content.length > 0) {
				this.content[0] = end;
				this.bubbleUp(0);
			}
			return result;
		},

		remove: function(node) {
			var len = this.content.length, i, end;
			// To remove a value, we must search through the array to find
			// it.
			for (i = 0; i < len; i += 1) {
				if (this.content[i] === node) {
					// When it is found, the process seen in 'pop' is repeated
					// to fill up the hole.
					end = this.content.pop();
					if (i !== len - 1) {
						this.content[i] = end;
						if (end[this.scoreName] < node[this.scoreName]) {
							this.sinkDown(i);
						} else {
							this.bubbleUp(i);
						}
						return;
					}
				}
				throw new Error("Node not found.");
			}
		},

		size: function () {
			return this.content.length;
		},

		sinkDown: function(n) {
			// Fetch the element that has to be sunk.
			var element = this.content[n],
				parentN, parent;
			// When at 0, an element can not sink any further.
			while (n > 0) {
				// Compute the parent element's index, and fetch it.
				parentN = Math.floor((n + 1) / 2) - 1;
				parent = this.content[parentN];
				// Swap the elements if the parent is greater.
				if (element[this.scoreName] < parent[this.scoreName]) {
					this.content[parentN] = element;
					this.content[n] = parent;
					// Update 'n' to continue at the new position.
					n = parentN;
				} else { // Found a parent that is less, no need to sink any further.
					break;
				}
			}
		},

		bubbleUp: function(n) {
			// Look up the target element and its score.
			var length = this.content.length,
				element = this.content[n],
				elemScore = element[this.scoreName],
				child1, child1N, child1Score,
				child2, child2N, child2Score,
				swap;

			while(true) {
				// Compute the indices of the child elements.
				child2N = (n + 1) * 2;
				child1N = child2N - 1;
				// This is used to store the new position of the element,
				// if any.
				swap = null;
				// If the first child exists (is inside the array)...
				if (child1N < length) {
					// Look it up and compute its score.
					child1 = this.content[child1N];
					child1Score = child1[this.scoreName];
					// If the score is less than our element's, we need to swap.
					if (child1Score < elemScore) {
						swap = child1N;
					}
				}
				// Do the same checks for the other child.
				if (child2N < length) {
					child2 = this.content[child2N];
					child2Score = child2[this.scoreName];
					if (child2Score < (swap === null ? elemScore : child1Score)) {
						swap = child2N;
					}
				}

				// If the element needs to be moved, swap it, and continue.
				if (swap !== null) {
					this.content[n] = this.content[swap];
					this.content[swap] = element;
					n = swap;
				} else { // Otherwise, we are done.
					break;
				}
			}
		},
		
		//store and restore the current heap state ala HTML Canvas
		save: function () {
			history.push(this.content.splice(0));
		},
		
		restore: function () {
			content = history.pop();
		}
	});

	Matrix2 = makeClass(null, function(data) {
		this.set(data);
		if (arguments > 1) {
			this.transform.apply(this, arguments.slice(1));
		}
	}, {
		data: null,
		history: null, 
		
		
		set: function (data) {
			this.data = data || [1, 1,
								 1, 1];
			this.history = [ ];
		},
		transform: function () {
			var trans, p, q,    //name of transformation, parameter, and temp value
				i,              //iterator
				matrices = [ ]; //ordered list of matrices to multiply
			for (i = 0; i < arguments.length; i += 2) {
				trans = arguments[i];
				p = arguments[i+1];
				
				switch(trans) {
				case 'identity':
					matrices.push([ 1,  0,
									0,  1]);
					break;
				case 'flipx':
					matrices.push([-1,  0,
									0,  1]);
					break;
				case 'flipy':
					matrices.push([-1,  0,
									0,  1]);
					break;
				case 'rotate':
					q = Math.sin(p);
					p = Math.cos(p);
					matrices.push([ q,  p,
								   -p,  q]);
					break;
				case 'scale':
					matrices.push([ p,  0,
									0,  p]);
					break;
				case 'scalex':
					matrices.push([ p,  0,
									0,  1]);
					break;
				case 'scaley':
					matrices.push([ 1,  0,
									0,  p]);
					break;
				case 'skewx':
					p = Math.tan(p);
					matrices.push([ 1,  0,
									p,  1]);
					break;
				case 'skewy':
					p = Math.tan(p);
					matrices.push([ 1,  p,
									0,  1]);
					break;
				}
			}
			return this.multiply.apply(this, matrices);
		},
		multiply: function () { //TODO: Strassen's algorithm?
			var x, y;
			for (y = 0; y < arguments.length; y += 2) {
				x = this.data;
				this.data = [];
				
				this.data[0] = (x[0]*y[0])+(x[1]*y[3]);
				this.data[1] = (x[1]*y[2])+(x[2]*y[4]);
				this.data[2] = (x[3]*y[1])+(x[4]*y[3]);
				this.data[3] = (x[3]*y[2])+(x[4]*y[4]);
				
				this.history.push(y);
			}
			
			return this;
		},
		rollback: function (num) {
			//TODO:
		},
		getx: function (x) {
			
		},
		gety: function (y) {
			
		},
		getxy: function (coords) {
			coords[0] = this.getx(coords[0]);
			coords[1] = this.getx(coords[1]);
			return coords;
		}
		
	});
}());

(function () {
	//images+layers+sprites
	Layer = makeClass(null, function (spec) {
		extend(this, spec.extend);
		// TODO: for (x in this.prototype) { spec[x] = this[x]; } ??? (filter)
		
		this.draw = spec.draw;
		this.z = spec.z;
	}, {
		
		viewport: null,
		z: 0,
		
		activate: function (viewport) {
			if (this.viewport) {
				this.deactivate();
			}
			viewport = viewport || VIEWPORT;
			
			this.viewport = viewport;
			viewport.addImage(this);
		},
		
		deactivate: function () {
			this.viewport.removeImage(this);
			this.viewport = null;
		},
			
		draw: null
	});

	jig.MetaLayer = makeClass(jig.Layer, function (spec) {
		jig.Layer.call(this, spec);
		
		this.x = spec.x;
		this.y = spec.y;
		
		this.viewx = spec.viewx;
		this.viewy = spec.viewy;
		
		this.height = spec.height;
		this.width = spec.width;
		
		this.draw = spec.draw || null;
		this.context = spec.context || getSurface(this.width, this.height);
		
		if (spec.images) {
			setImages(spec.images);
		}
		
		this.images = BinaryHeap('z');
		this.imglist = { };
		
	}, {
	x: 0,
	y: 0,
	
    viewx: 0,
    viewy: 0,
    
    element: null,	//html canvas element goes here
    context: null,	//2d drawing context goes here
    width: 0,
    height: 0,
    
    images: null,
	imagelist: null,
    
    addImage: function (image) {
        this.images.push(image);
		this.imglist[image.getid()] = image;
    },
    
    removeImage: function (image) {
		this.images.remove(this.imglist[image.getid()]);
		delete this.imglist[image.getid()];
    },
	
	getImages: function () {
		return ({images: this.images, imglist: this.imglist});
	},
	setImages: function (spec) {
		this.clrImages();
		
		this.images = spec.images;
		this.imglist = spec.imglist;
	},
	addImages: function (spec) {
		var i;
		
        for (i = spec.images.pop(); i; i = spec.images.pop) {
            this.images.push(i);
        }
		extend(this.imglist, spec.imglist);
	},
	clrImages: function () {
		this.images = BinaryHeap('z');
		this.imagelist = { };
	},
    
    render: function () {
        var c = this.context, i;
        
		this.images.save();
        for (i = this.images.pop(); i; i = this.images.pop()) {
            c.save();
            i.draw(c, this.viewX, this.viewY);
            c.restore();
        }
		this.images.restore();
    },
		
		draw: function (c, viewX, viewY) {
			this.render();
			
			c.drawImage(this.context, viewX, viewY);
		}
		
	});
	
	Sprite = makeClass(jig.Layer, function (spec) {
		jig.Layer.call(this, spec);
		
		this.parent = spec.parent;
		this.z = spec.z;
		this.relx = spec.relx;
		this.rely = spec.rely;
	}, {
		parent: null,
		z: 0,
		
		relx: 0,
		rely: 0,
		
		isViewable: function (x1, x2, y1, y2) {
			return this.parent.y1 <= y2 && this.parent.x1 <= x2 && this.parent.x2 >= x1 && this.parent.y2 >= y2;
		}
	});
}());

(function () {
	//grids+cells+actors
	Cell = makeClass(null, function (grid, cx, cy) {
		this.grid = grid;
		
		this.cx = cx;
		this.cy = cy;
		
		this.x1 = x*this.grid.cellw;
		this.y1 = y*this.grid.cellh;
		this.x2 = x*(this.grid.cellw+1);
		this.y2 = y*(this.grid.cellh+1);
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

	Grid = makeClass(null, function (gridw, gridh, cellw, cellh, cell) {
		var i, j;
		
		cell = cell || this.cell;
		this.cell = cell;
		
		this.gridw = gridw;
		this.gridh = gridh;
		
		this.cellw = cellw;
		this.cellh = cellh;
		
		for (i = 0; i < gridw/cellw; i += 1) {
			this[i] = [];
			for (j = 0; j < gridh/cellh; j += 1) {
				this[i][j] = new cell(this, i, j);
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
	
	Actor = makeClass(null, function (spec) {
		var i;
		
		this.x = spec.x;
		this.y = spec.y;
		
		this.sprites = { };
		if (spec.sprites) {
			for (i in spec.sprites) {
				if (spec.sprites.hasOwnProperty(i)) {
					spec.sprites[i].parent = this;
					this.sprites[i] = new DATA.jigsaw.Sprite(spec.sprites[i]);
				}
			}
		}
		this.shapes = { };
		if (spec.shapes) {
			for (i in spec.shapes) {
				if (spec.shapes.hasOwnProperty(i)) {
					spec.shapes[i].parent = this;
					this.shapes[i] = new DATA.jigsaw.Shape(spec.shapes[i]);
				}
			}
		}
		
		if (spec.grid) {
			this.grid = spec.grid;
		}
		
		this.moveQueue = extend([ ], {
			pushRel: function (x, y) {
				this.push({relx: x, rely: y});
			},
			pushAbs: function (x, y) {
				this.push({absx: x, absy: y});
			},
			pushAng: function (angle, dist) {
				this.push({angle: angle, dist: dist});
			}
		});
		
		this.top = spec.top || 0;
		this.bottom = spec.bottom || 0;
		this.left = spec.left || 0;
		this.right = spec.right || 0;
		
		this.dimAdjust();
	}, {
		sprites: null,
		shapes: null,
		grid: null,
		
		x: 0,
		y: 0,
		
		lastx: 0,
		lasty: 0,
		angle: 0,
		dist: 0,
		
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
		celltl: null,
		celltr: null,
		cellbl: null,
		cellbr: null,
		
		//METHODS:
		dimAdjust: function () {
			var grid = this.grid,
				gridx1, gridx2, gridy1, gridy2;
			
			//calculate edges
			this.x1 = this.left + this.x;
			this.y1 = this.top + this.y;
			this.x2 = this.right + this.x;
			this.y2 = this.bottom + this.y;
			
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
			var value, i, bufx = 0, bufy = 0;
			
			
			this.moveQueue.reverse();
			for (i = this.moveQueue.pop(); this.moveQueue[0]; i = this.moveQueue.pop()) { 
				if (i.relx) {
					bufx += i.relx;
				}
				if (i.rely) {
					bufy += i.rely;
				}
				
				if (i.absx) {
					bufx = i.absx;
				}
				if (i.absy) {
					bufy = i.absy;
				}
				
				if (i.angle) {
					bufx = Math.cos(i.angle)*i.dist;
					bufy = Math.sin(i.angle)*i.dist;
				}
			}
			value.lastx = bufx;
			value.lasty = bufy;
			value.angle = Math.atan(bufy/bufx) || this.angle;
			value.dist = Math.sqrt(Math.pow(bufx, 2) + Math.pow(bufy, 2));
			
			if (!emptyQueue) {
				this.moveQueue.push({relx: bufx, rely: bufy});
			}
			
			return value;
		},
		
		move: function () {
			var data = getMove(true);
			
			this.x = this.x + data.relx;
			this.y = this.y + data.rely;
			extend(this, data);
			
			return this.dimAdjust();
		}
	});
}());

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
	
	CollisionCell = makeClass(Cell, function () {
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
						node = new DATA.jigsaw.Node(shape, this.shapes[pool]);
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
	
	CollisionGrid = makeClass(Grid, function () {
		//TODO: subgrids
		
		this.pools = { };
		this.poolcount = { };
		
		this.collisions = [];
	
		return Grid.apply(this, arguments);
	}, {
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
			value.top    = yOffset + shape.rely;
			value.bottom = yOffset + shape.rely + shape.height;
			value.left   = xOffset + shape.relx;
			value.right  = xOffset + shape.relx + shape.width;
			break;
		case 'circle':
			value.x      = xOffset + shape.relx;
			value.y      = yOffset + shape.rely;
			value.radius = shape.radius;
			break;
		case 'line':
			value.x1 	 = xOffset + shape.relx;
			value.y1 	 = yOffset + shape.rely;
			value.x2 	 = xOffset + shape.endx;
			value.y2 	 = yOffset + shape.endy;
			break;
		case 'point':
			value.x  	 = xOffset + shape.relx;
			value.y 	 = yOffset + shape.rely;
			break;
		}
		
		return value;
	}
	
	Shape = makeClass(null, function (spec) {
		this.parent = spec.parent;
		this.pool = spec.pool;
		
		this.x = spec.x;
		this.y = spec.y;
		this.relx = spec.relx;
		this.rely = spec.rely;
	}, {
		parent: null,
		type: null,
		pool: null,
		
		x: 0,
		y: 0,
		
		relx: 0,
		rely: 0,
		
		getX: function () {
			return this.parent ? this.parent.x+this.relx : this.x;
		},
		getY: function () {
			return this.parent ? this.parent.y+this.rely : this.y;
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
				return {x:xDepth||0, y:yDepth||0} 
			}
		}
	});
	
	Box = makeClass(Shape, function (spec) {
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
	
	Circle = makeClass(Shape, function(spec) {
		Shape.call(this, spec);
		this.boundaryBox = new Box({ 
			pool: this.pool,
			relx: this.relx,
			rely: this.rely,
			height: this.radius,
			width: this.radius
		});
		
		this.radius = spec.radius;
	}, {
		type: 'circle',
		
		radius: 0
	});
	
	Line = makeClass(Shape, function (spec) {
		Shape.call(this, spec);
		this.boundaryBox = {
			pool: this.pool,
			relx: (this.relx+endx)/2,
			rely: (this.rely+endy)/2,
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
	
	Point = makeClass(Shape, function (spec) {
		Shape.call(this, spec);
		this.boundaryBox = {
			pool: this.pool,
			relx: this.relx,
			rely: this.rely,
			height: 0,
			width: 0
		};
	}, {type: 'point'});
}());

VIEWPORT = new MetaLayer();
//		this.x = spec.x;
//		this.y = spec.y;
		
//		this.viewx = spec.viewx;
//		this.viewy = spec.viewy;
		
//		this.height = spec.height;
//		this.width = spec.width;
		
//		this.draw = spec.draw || null;
//		this.context = spec.context || getSurface(this.width, this.height);
    
document.addEventListener('DOMContentLoaded', function () {
	var frameTimer = Date().getTime(); //keep track of when frames should execute
	
    //setup canvas
	VIEWPORT = new MetaLayer({
		x: null,
		y: null,
		
		viewx: 0,
		viewy: 0,
		
		width: document.getElementById('display').width,
		height: document.getElementById('display').height,
		
		draw: MetaLayer.render,
		context: document.getElementById('display').getContext('2d'),
		
		extend: {
			startTime: frameTimer,
			frameLength: 0,
			fps: 0,
			
			setFrames: function (value) {
				if (value >= 1) {
					this.fps = value;
					this.frameLength = 1/value;
				} else {
					this.frameLength = value;
					this.fps = 1/value;
				}
			}
                        
		}
	});
    
	//register step-flow events
    EVENT.addEvent('step');
    
    include('boot.js');
    (function step() {
        var pauseTime;	//time to wait for next frame
        
        EVENT.fireEvent('step', null); //signal primary step code
        
        VIEWPORT.render();
        
		frameTimer += VIEWPORT.frameLength;
		pauseTime = frameTimer - Date().getTime();
        setTimeout(step, pauseTime <= 1 ? 1 : pauseTime);
    }());
}, true); //TODO: is true/stopImmediatePropagation faster?
