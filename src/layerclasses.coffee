#layerclasses.coffee: classes for graphical display

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

        @context = context ? getFramebuffer(@width, @height)

        @images = new BinaryHeap('z')
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
        @images.push image
    
    #remove layer from list
    unsubscribe: (image) ->
        @images.remove image
    
    #returns entire set of layers
    getImages: ->
        @images
    
    #replaces list of images with given set
    setImages: (@images) ->
    
    #splices given set into list of layers
    addImages: (images) ->
        loop
            i = images.pop()
            break unless i
            
            @images.push i
    
    #empty layer set
    clrImages: ->
        @images = BinaryHeap('z')
    
    #composite images (should be called from draw())
    render: ->
        c = @context
        imgcopy = @images.copy()

        loop
            i = imgcopy.pop()
            break unless i
            
            c.save()
            i.draw(c, @viewX, @viewY)
            c.restore()
