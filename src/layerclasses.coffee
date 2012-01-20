#layerclasses.coffee: classes for drawing to HTML5 Canvas

#base layer class for subscribing to destination and displaying graphics on request
class window.Layer
    constructor: (spec) ->
        {@draw, @depth, destination} = spec

        unless destination is no
            delete destination if not destination?
            @subscribeTo destination

    destination: null #cxt buffer which layer is subscribed to and requests draw
    depth: 0 #determines draw order relative to other layers
    
    #subscribes layer to given destination, if none given, uses the Viewport
    subscribeTo: (destination = Viewport) ->
        @deactivate() if @destination?

        @destination = destination
        destination.subscribe this
    
    #unsubscribes layer from current destination
    unsubscribeFrom: ->
        @destination.unsubscribe this
        @destination = null

    draw: null #drawing function, recieves 2d context + camera coords as Point

#sprite class for attaching to actors
class window.Sprite extends Layer
    constructor: (spec) ->
        {@parent, @pos} = spec
        super(spec)
    
    parent: null #actor Sprite is attached to
    pos: null #current position, relative to parent if available
    
    #returns absolute position
    getAbsPos: ->
        if @parent then @parent.pos.add(@pos) else @pos

#composites subscribed layers and draws to destination
class window.Surface extends Layer#todo: ContextBuffer.getAbsPosOf(Vector)
    constructor: (spec) -> 
        {@pos, @viewpos, @height, @width, images, context} = spec
        super(spec)

        @context = context ? createFramebuffer(@width, @height)

        @images = []
        @imglist = {}

        @setImages(images) if images
    
    pos: null #position of layer relative to destination viewport camera
    viewpos: null #viewport camera

    context: null #2d canvas drawing context
    width: 0 
    height: 0

    images: null #ordered list of layers
    
    #add layer to list
    subscribe: (image) ->
        unless image.context?
            image.context = ['global']
        @images.push image
    
    #remove layer from list
    unsubscribe: (image) ->
        @images.remove(image)
        
    unsubscribeByObject: (object) ->
        for image in @images where image.parent is object or image is object
            @unsubscribe(image)
    unsubscribeByState: (state) ->
        for image in @images where image.state is state
            @unsubscribe(image)
    
    #returns entire set of layers
    getImages: ->
        @images
    
    #replaces list of images with given set
    setImages: (@images) ->
    
    #splices given set into list of layers
    addImages: (images) ->
        @images.push(i) for i in images
    
    #empty layer set
    clrImages: ->
        @images = []
    
    #private function for ranking two given objs by priority
    compare = (a, b) ->
        a.priority - b.priority
    
    #composite images (should be called from draw())
    render: ->
        c = @context
        
        @images.sort(compare)
        for i in @images.clone() when StateMachine.check(image.state)?
            c.save()
            i.draw(c, @viewX, @viewY)
            c.restore()
