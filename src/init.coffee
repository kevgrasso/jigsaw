#init.coffee: When DOM loads, setup canvas stuff and boot the game

init = ->
    document.removeEventListener('DOMContentLoaded', init, false) #cleanup
    frameTimer = getTime() #keep track of when frames should execute
	
    #define Viewport singleton
    window.Viewport = new class extends Surface
        canvas = document.getElementByElement('canvas')[0]
        constructor: ->
            super
                pos: null
                view: $V [0,0]
                width: canvas.width
                height: canvas.height
                context: canvas.getContext('2d')
                destination: no
                draw: -> #todo: start dropping frames if the time gap gets too big
                    @render()
                    #INPUT.updateMouse()
        
        audio: null #AudioContext, webkitAudioContext

        frameLength: 0 #length of a frame in miliseconds
        frameRate: 0 #number of frames per second
        
        #change the length of a frame
        setFrameLength: (num) ->
            @fps = 1000/num
            @frameLength = num
    
    #draw to canvas every step
    Trigger.subscribe
        trigger: 'step'
        func: Viewport.draw
        obj: Viewport
        priority: 100
        context: 'global'
    
    #boot game
    Viewport.boot = include 'main'
    
    #main loop
    do step = ->
        #step
        Trigger.fireTrigger 'step'
        
        #increment time
        Context.tick()
        
        frameTimer += Viewport.frameLength
        currentTime = getTime()
        
        frameTimer = currentTime-500 if frameTimer-currentTime < -500 #limit lag catch-up to 10 frames
        pauseTime = frameTimer-currentTime
        setTimeout(step, if pauseTime <= 1 then 1 else pauseTime)
document.addEventListener('DOMContentLoaded', init, false)