(function () {    
	//data types
	Coord = makeClass(function (x, y) {
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
	
	LinkNode = makeClass(function (data, next, prev) {
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

	BinaryHeap = makeClass(function (scoreName, content){ // this class written by Marijn Haverbeke:
		this.content = content || [];							// http://eloquentjavascript.net/appendix2.html
		this.scoreName = scoreName;
		
		this.history = [];
	}, {
		content: null,
		scoreName: null,
		history: null,
		
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
			this.history = this.content.slice(0);
		},
		
		restore: function () {
			this.content = this.history;
		}
	});

	Matrix2 = makeClass(function(data) {
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