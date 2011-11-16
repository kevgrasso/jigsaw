(function () {
	//images+layers+sprites
	Layer = makeClass(function (spec) {
		this.draw = spec.draw;
		this.z = spec.z;
		if (spec.attrib) {
			extend(this, spec.attrib);
		}
		
		if (spec.viewport) {
			if (spec.viewport === true) {
				delete spec.viewport;
			}
			this.subscribeTo(spec.viewport);
		}
	}, {
		
		viewport: null,
		z: 0,
		
		subscribeTo: function (viewport) {
			if (this.viewport) {
				this.deactivate();
			}
			viewport = viewport || VIEWPORT;
			
			this.viewport = viewport;
			viewport.subscribe(this);
		},
		
		unsubscribeFrom: function () {
			this.viewport.unsubscribe(this);
			this.viewport = null;
		},
			
		draw: null
	});
	
	Sprite = Layer.makeClass(function (spec) {
		Layer.call(this, spec);
		
		this.parent = spec.parent;
		
		this.pos = spec.pos;
	}, {
		parent: null,
		
		pos: null,
		
		getAbsPos: function () {
			return this.parent ? this.parent=this.parent.pos.add(this.pos) : this.pos;
		},
	});

	MetaLayer = Layer.makeClass(function (spec) {
		Layer.call(this, spec);
		
		this.pos = spec.pos;
		
		this.viewpos = spec.viewpos;
		
		this.height = spec.height;
		this.width = spec.width;
		
		this.draw = spec.draw || null;
		this.context = spec.context || getSurface(this.width, this.height);
		
		this.images = new BinaryHeap('z');
		this.imglist = { };

		if (spec.images) {
			setImages(spec.images);
		}
		
	}, {
	pos: null,
    viewpos: null,
    
    canvas: null,	//2d drawing context goes here
    width: 0,
    height: 0,
    
    images: null,
	imagelist: null,
    
    subscribe: function (image) {
        this.images.push(image);
		this.imglist[image.getid()] = image;
    },
    
    unsubscribe: function (image) {
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
		
        for (i = spec.images.pop(); i; i = spec.images.pop()) {
            this.images.push(i);
        }
		extend(this.imglist, spec.imglist);
	},
	clrImages: function () {
		this.images = BinaryHeap('z');
		this.imagelist = { };
	},
    
    render: function () {
        var c = this.context, i,
        imgcopy = this.images.copy();
        
        for (i = imgcopy.pop(); i; i = imgcopy.pop()) {
        	c.save();
            i.draw(c, this.viewX, this.viewY);
        	c.restore();
        }
    },
		
		draw: function (c, viewX, viewY) {
			this.render();
			
			c.translate(this.x, this.y);
			c.drawImage(this.context, viewX, viewY);
		}
		
	});
}());
