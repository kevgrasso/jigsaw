//JIGSAW HTML5 GAME LIBRARY
//Most code by Kevin Grasso
"use strict";
var COLLISION, DATA, TRIGGER, JigClass, getid, inherit, FRAGMENT, INPUT, MAP, MATERIALS, SOUND, VIEWPORT,
Coord, LinkNode, BinaryHeap, Matrix2, Layer, MetaLayer, Sprite, Cell, Grid, Actor, CollisionCell, CollisionGrid,
Shape, Box, Circle, Line, Point;

if (!document.head) { //I think this allows a few more versions of Opera
    document.head = document.getElementsByTagName('head')[0];
}

// class/object functions
function extend(target, src, depth) {
    var i;
    for (i in src) {
        if (src.hasOwnProperty(i)) {
            if (isValue(depth) && depth !== 0 && typeof src[i] == 'object' && src[i] !== null) {
                target[i] = src[i].clone(depth<0? depth:depth-1); //deep copy
            } else {
                target[i] = src[i]; //normal copy
            }
        }
    }
    
    return target;
}

function makeClass(subc, attributes, superc) {
    subc = subc || function () {
        superc.apply(this, arguments);
    };
	
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
function include (filename) {
    var head = document.head,
    e = document.createElement('script');
    e.type = 'application/javascript';
    e.charset = 'utf-8';
	
    function cleanup () {
        if (this.readyState == 'complete') {
            e.removeEventListener('onload', cleanup, false); // Plug IE memory leak-- even there in IE9!
            head.removeChild(e);
        }
    }
    e.addEventListener('onload', cleanup, false); 	//all browsers should call this when script is finished
	
    //finish loading script
    e.src = 'include/'+filename+'.js';
    head.appendChild(e);
}


function getSurface(w, h) {
    var canvas = document.createElement('CANVAS');  
    canvas.setAttribute('width', w);  
    canvas.setAttribute('height', h);  
	
    return canvas.getContext('2d');
}

function isValue(x) {
    return (typeof x !== 'undefined') && (x !== null);
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
    
    proto.clone = function (depth) {
        return extend({ }, this, depth);
    };
	
    proto.extend = function(src, depth) {
        return extend(this, src, depth);
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
    };
	
    proto.isEmpty = function () {
        var i, exemptions = {};
		
        for (i=0; i<arguments.length;i+=1) {
            exemptions[arguments[i]] = true;
        }
		
        for (i in this) {
            if (this.hasOwnProperty(i) && !exemptions[i]) {
                return false;
            }
        }
        return true;
    };
	
    proto.hasKey = function (key) {
        var i;
		
        for (i in this) {
            if (this.hasOwnProperty(i) && i === key) {
                return true;
            }
        }
        return false;
    };
	
    proto.hasValue = function (value) {
        var i;
		
        for (i in this) {
            if (this.hasOwnProperty(i) && this[i] === value) {
                return true;
            }
        }
        return false;
    };

    proto.getKey = function (value) {
        var i;
		
        for (i in this) {
            if (this.hasOwnProperty(i) && this[i] === value) {
                return i;
            }
        }
        return undefined;
    };
	
    CanvasRenderingContext2D.prototype.clear = function () {
        this.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
}());