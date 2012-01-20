class window.LoadTracker   
    constructor: (@elements...) ->
        for element in elements
            element.addEventListener('load', @loadHandler, false)
            element.addEventListener('error', @abort, false)
    
    elements: null
    complete: 0
    progress: 0
    error: false
    
    loadHandler: (event) =>
        event.target.removeEventListener('load', @loadHandler, false)
        event.target.addEventListener('error', @abort, false)
        @elements.remove(event.target)
        @completed += 1
        @progress = @complete/@elements.length 
    abort: =>
        for element in elements
            element.removeEventListener('load', @loadHandler, false)
            element.removeEventListener('error', @abort, false) 
        @progress = @complete = NaN
        error = true
        #throw new Error 'element failed to load'
    
    add: (element) ->
        @elements.push element
        element.addEventListener('load', @loadHandler, false)
        element.addEventListener('error', @abort, false)
        @progress = @complete/@elements.length
    getProgress: ->
        @progress
    getError: ->
        @error