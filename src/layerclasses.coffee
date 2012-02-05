#layerclasses.coffee: classes for drawing to HTML5 Canvas

#base layer class for subscribing to destination and displaying graphics on request
class window.Layer
    constructor: (spec) ->
        {@draw, @depth, @state, destination} = spec

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
        {@pos, @viewpos, @height, @width, layers, context} = spec
        super(spec)

        @context = context ? createFramebuffer(@width, @height)

        @layers = []
        @layerList = {}

        @setLayers(layers) if layers?
    
    pos: null #position of layer relative to destination viewport camera
    viewpos: null #viewport camera

    context: null #2d canvas drawing context
    width: 0
    height: 0

    layers: null #ordered list of layers
    
    #add layer to list
    subscribe: (layer) ->
        unless layer.state?
            layer.state = ['global']
        @layers.push layer
    
    #remove layer from list
    unsubscribe: (layer) ->
        @images.remove(layer)
        
    unsubscribeByObject: (object) ->
        for layer in @layers where layer.parent is object or layer is object
            @unsubscribe(image)
    unsubscribeByState: (state) ->
        for layer in @layers where entry.state.indexOf(state) is 0 and entry.state.length is 1
            @unsubscribe(layer)
    
    #returns entire set of layers
    getLayers: ->
        @layers
    
    #replaces list of images with given set
    setLayers: (@layers) ->
    
    #splices given set into list of layers
    addLayers: (layers) ->
        @images.push(layer) for layer in layers
    
    #empty layer set
    clrLayers: ->
        @layers = []
    
    #private function for ranking two given layers by priority
    layerCompare = (layerA, layerB) ->
        layerA.priority - layerB.priority
    
    #composite images (should be called from draw())
    render: ->
        context = @context
        
        @layers.sort(layerCompare)
        for layer in @layers.clone() when StateMachine.check(layer.state)?
            context.save()
            layer.draw(context, @viewX, @viewY)
            context.restore()
