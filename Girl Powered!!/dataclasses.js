(function () {
	//data types

	BinaryHeap = makeClass(function (scoreName, content){ // this class mostly written by Marijn Haverbeke:
		this.content = content || [];					  // http://eloquentjavascript.net/appendix2.html
		this.scoreName = scoreName;
		
	}, {
		content: null,
		scoreName: null,
		
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
					}
					return;
				}
			}
			throw new Error("Node not found.");
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
		copy: function () {
			return new BinaryHeap(this.scoreName, this.content.slice(0));
		}
	});
}());