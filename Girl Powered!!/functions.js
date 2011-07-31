//JIGSAW HTML5 GAME LIBRARY
//Most code by Kevin Grasso
"use strict";
var COLLISION, DATA, TRIGGER, JigClass, getid, inherit, FRAGMENT, INPUT, MAP, MATERIALS, SOUND, VIEWPORT,
	Coord, LinkNode, BinaryHeap, Matrix2, Layer, MetaLayer, Sprite, Cell, Grid, Actor, CollisionCell, CollisionGrid,
	Shape, Box, Circle, Line, Point;

document.head = document.getElementsByTagName('head')[0]; //I'm not sure if this expands support any, but better safe than sorry
														  //TODO: check if it does

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

function makeClass(subc, attributes, superc) {
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

//TODO: allow hard refresh of scripts to be dynamically loaded
function include (filename, callback, bAsync) {
	var head = document.head,
		e = document.createElement('script'),
		targets = include.targets,
		obj = { };
	e.type = 'application/javascript';
	e.charset = 'utf-8';
	e.async = bAsync || true;
	
	//setup target object
	if (!targets[filename] ) {
		targets[filename] = [];
	}
	targets[filename].push(obj);
	
	//all browsers should call this when script is finished
	e.onload = e.onreadystatechange = function () {
	    if (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") {
	        //cleanup
	        e.onload = e.onreadystatechange = null; // Plug IE memory leak-- even there in IE9!
	        if (targets[filename].length === 0) {
	        	delete targets[filename];
	        }
	        head.removeChild(e);
	        
	        if (callback) {
	        	callback(obj, filename);
	        }
	    }
	};
	//finish loading script
	e.src = '/include/'+filename;
	head.appendChild(e);
	
	return obj;
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
    var proto = Object.prototype,
    	lastid;
    
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

    lastid = 0;
    proto.objectId = null;
    proto.getid = function () {
		
        if (!this.hasOwnProperty('objectId')) {
			lastid += 1;
            this.objectId = lastid.toString();
        }
 
        return this.objectId;
    };
    
	proto.makeClass = function (subc, attributes) {
		return makeClass(subc, attributes, this);
	}
	
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