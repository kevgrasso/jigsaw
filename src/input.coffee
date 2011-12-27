#input.coffee: input singleton definition

window.Input = new class
    #hidden vars
    bStream = off #boolean controlling whether keystream gets tracked
    keystream = [] #list of keypress events since last polled
    inputs = {} #data for all active inputs and registrations
    keyList = {} #list of keynames attached to key's keycode #don't like this comment or next, redo
    keyTriggers = {} #all registerable key triggers attached to the plain keyname
    interval = 4 #length of time in frames for key tap to become held key
    
    #handles key hold inputs
    holdhandle = (keyname, context) ->
        Input.hold[keyname] = true
        
        #determine which triggers need to be fired
        if Input.repeat[keyname] is yes
            if Input.repeat[keyname] is 'tap'
                Trigger.fireTrigger {
                    name:"#{keyname}TapAndHold"
                    context:context
                }, keyname
            else
                Trigger.fireTrigger {
                    name:"#{keyname}HoldAndHold"
                    context:context
                }, keyname
            Trigger.fireTrigger {
                name:"#{keyname}PressAndHold"
                context:context
            }, keyname
        Trigger.fireTrigger {
            name:"#{keyname}Hold"
            context:context
        }, keyname
        
        #so uphandle doesn't unsubscribe from a nonexistent trigger
        delete inputs[keyList[keyname]].holdidlist[context]
    
    #handles key down events
    downhandle = (e) ->
        keyname = inputs[e.keyCode]?.keyname
        e.preventDefault()
        e.stopImmediatePropagation()
        
        #only handle true keydown-- ignore further key presses
        if keyname? and not Input.state[keyname]
            Input.state[keyname] = on
            Input.timeOf[keyname+'Down'] = Trigger.frameCount.global
            
            #determine which triggers need to be fired
            if Input.lastkey is keyname and Input.getKeyTime(keyname, 'up') <= interval
                if Input.hold[keyname] is no
                    Input.repeat[keyname] = 'tap'
                    Trigger.fireTrigger "#{keyname}TapAndDown", keyname
                else
                    Input.repeat[keyname] = 'hold'
                    Input.hold[keyname] = no
                    Trigger.fireTrigger "#{keyname}HoldAndDown", keyname

                Trigger.fireTrigger "#{keyname}PressAndDown", keyname
            else
                Input.repeat[keyname] = null
            Trigger.fireTrigger "#{keyname}Down", keyname
            
            #set up hold timer for all relevant contexts
            for own k of inputs[e.keyCode].holdcontextlist
                triggerId = getUniqueNum()
                inputs[e.keyCode].holdidlist[k] = triggerId
                Trigger.subscribe {
                    trigger: 'step'
                    context: k
                    triggerId: triggerId
                    func: holdhandle
                    autoArgs: [keyname, k]
                    priority: -Infinity
                    timerType: 'timeout'
                    timerLength: interval
                }
            Input.lastkey = keyname ? Input.lastkey
        if bStream is on
            keystream.unshift(keycode)
            Trigger.fireTrigger('keystroke', keystream) if bTrigger
    
    #handles key lift events
    uphandle = (e) ->
        keyname = inputs[e.keyCode]?.keyname
        e.preventDefault()
        e.stopImmediatePropagation()

        Input.state[keyname] = off
        Input.timeOf[keyname+'Up'] = Trigger.frameCount.global
        
        #determine which triggers need to be fired
        if Input.repeat is yes
            if Input.repeat is 'tap'
                Trigger.fireTrigger "#{keyname}TapAndUp", keyname
            else
                Trigger.fireTrigger "#{keyname}HoldAndUp", keyname
            Trigger.fireTrigger "#{keyname}PressAndUp", keyname
        if Input.hold[keyname] is no
            if Input.repeat is yes
                if Input.repeat is 'tap'
                    Trigger.fireTrigger "#{keyname}TapAndUpTap", keyname
                else
                    Trigger.fireTrigger "#{keyname}HoldAndUpTap", keyname
                Trigger.fireTrigger "#{keyname}PressAndUpTap}", keyname
            Trigger.fireTrigger "#{keyname}UpTap", keyname
        else
            if Input.repeat is yes
                if Input.repeat is 'tap'
                    Trigger.fireTrigger "#{keyname}TapAndUpHold", keyname
                else
                    Trigger.fireTrigger "#{keyname}HoldAndUpHold", keyname
                Trigger.fireTrigger "#{keyname}PressAndUpHold", keyname
            Trigger.fireTrigger "#{keyname}UpHold", keyname
        Trigger.fireTrigger "#{keyname}Up", keyname


        if inputs[e.keyCode]?
            for own k, v of inputs[e.keyCode].holdidlist #cancel all pending hold triggers
                Trigger.unsubscribe('step', holdhandle, v)
                delete inputs[e.keyCode].holdidlist[k]
        undefined
    
    #processes a keyboard registration
    keyboardRegister = (spec, trigger) ->
        keyname = keyTriggers[trigger]
        keycode = keyList[keyname]

        #if key not in inputs, add it and create all neccessary attributes.
        unless inputs[keycode]?
            inputs[keycode] = {}
            inputs[keycode].keycode = keycode
            inputs[keycode].keyname = keyname
            inputs[keycode].count = 1
            inputs[keycode].trigger = {}
            inputs[keycode].holdcontextlist = {}
            inputs[keycode].holdidlist = {}

            Input.state[keyname] = false
            Input.timeOf["#{keyname}Down"] = 0
            Input.timeOf["#{keyname}Up"] = 0
            Input.hold[keyname] = false
            Input.repeat[keyname] = false
        else
            inputs[keycode].count += 1
        triglist = inputs[keycode].trigger

        #if registering a function
        if spec.func?
            #if a hold-type input, relevant contexts to holdcontextlist
            if trigger.substr(trigger.length-4, 4) is 'Hold'
                spec.context = [spec.context] if typeof spec.context is 'string'

                for v in spec.context
                    unless inputs[keycode].holdcontextlist[v]
                        inputs[keycode].holdcontextlist[v] = 1
                    else
                        inputs[keycode].holdcontextlist[v] += 1

            #if trigger not in triglist, add it and create its trigger. Otherwise, increment its count.
            if triglist[trigger]?
                triglist[trigger] += 1
            else
                triglist[trigger] = 1
                Trigger.addTrigger trigger

            Trigger.subscribe spec
    
    #removes a keyboard registration
    keyboardUnregister = (spec, trigger) ->
        keyname = keyTriggers[trigger]
        keycode = keyList[keyname]
        triglist = inputs[keycode].trigger

        if spec.func?
            #if a hold-type input, relevant contexts to holdcontextlist
            if trigger.substr(trigger.length-4, 4) is 'Hold'

                spec.context = [spec.context] if typeof spec.context is 'string'

                for v of spec.context
                    inputs[keycode].holdcontextlist[v] -= 1
                    if inputs[keycode].holdcontextlist[v] <= 0
                        delete inputs[keycode].holdcontextlist[v]

            #unsubcribe function from trigger
            Trigger.unsubscribe(trigger, spec.func, spec.trigId)

            triglist[trigger] -= 1
            if triglist[trigger] <= 0
                Trigger.removeTrigger trigger
                delete triglist[trigger]

        inputs[keycode].count -= 1
        if inputs[keycode].count <= 0
            delete inputs[keycode]
            delete Input.state[keyname]
            delete Input.timeOf["#{keyname}Down"]
            delete Input.timeOf["#{keyname}Up"]
            delete Input.hold[keyname]
            delete Input.repeat[keyname]

    #public vars
    state: {}  #state of all keys in keyList
    timeOf: {} #time of last keyup/keydown for all keys in keyList
    hold: {}   #whether last keydown was tap or hold
    repeat: {} #whether last keydown was a sequential stroke and if so, whether
               #   it was a tap or hold
    
    lastkey: null #name of last keydown
    
    #activate keystream capturing
    streamOn: ->
        bStream = on
    
    #deactivate keystream capturing
    streamOff: ->
        bStream = off
        keystream = []
    
    #returns and clears current keystream
    getStream: ->
        keystream[0..]
        keystream = []
    
    #returns time since last keyUp or keyDown
    getKeyTime: (key, state) ->
        state = state.charAt(0).toUpperCase() + state[1..].toLowerCase() #capitalize
        Trigger.frameCount.global-@timeOf[key+state]
    
    #replace the master key list with a new key sets
    setKeys: (newList) ->
        keyList = newList

        keyTriggers = {} #derive whitelist for key inputs
        for own k of keyList
            keyTriggers["#{k}Down"] = k
            keyTriggers["#{k}UpTap"] = k
            keyTriggers["#{k}Hold"] = k
            keyTriggers["#{k}UpHold"] = k
            keyTriggers["#{k}Up"] = k
            keyTriggers["#{k}PressAndDown"] = k
            keyTriggers["#{k}PressAndUpTap"] = k
            keyTriggers["#{k}PressAndHold"] = k
            keyTriggers["#{k}PressAndUpHold"] = k
            keyTriggers["#{k}PressAndUp"] = k
            keyTriggers["#{k}TapAndDown"] = k
            keyTriggers["#{k}TapAndUpTap"] = k
            keyTriggers["#{k}TapAndHold"] = k
            keyTriggers["#{k}TapAndUpHold"] = k
            keyTriggers["#{k}TapAndUp"] = k
            keyTriggers["#{k}HoldAndDown"] = k
            keyTriggers["#{k}HoldAndUpTap"] = k
            keyTriggers["#{k}HoldAndHold"] = k
            keyTriggers["#{k}HoldAndUpHold"] = k
            keyTriggers["#{k}HoldAndUp"] = k

        keyList
    
    #processes an input registration
    register: (spec) ->
        throw new Error 'input request includes timer' if spec.timer ? spec.length? #sanity checking

        spec = [spec] unless Array.isArray spec #for multi-spec arrays

        for v in spec
            v.input = [v.input]unless Array.isArray v.input #for multi-input arrays

            for w in v.input
                if keyTriggers[w]? #determine input type
                    input = 'keyboard'
                else
                    input = w

                unless inputs[input]? #initial request preparation -- inputs object, event listeners, and triggers
                    inputs[input] = { count: 1 }

                    switch input
                        when 'keyboard'
                            document.addEventListener('keydown', downhandle, false)
                            document.addEventListener('keyup', uphandle, false)
                            break
                        else
                            Trigger.addTrigger input
                            inputs[input].func = (e) ->
                                e.preventDefault()
                                e.stopImmediatePropagation()
                                @timeOf[input] = 0

                                Trigger.fireTrigger input, e
                            document.addEventListener(input, inputs[input].func, false)
                else
                    inputs[input].count += 1

                v.trigger = w #prep spec.trigger for subscription
                switch input #handle triggers
                    when 'keyboard'
                        keyboardRegister v, w
                        break
                    else
                        Trigger.subscribe v

            if v.func?
                unless v.func.inputs
                    v.func.inputs = [v]
                else
                    v.func.inputs.push v
        if spec.length is 1
            spec[0].func ? spec[0]
        else
            spec
    
    #removes an input registration
    unregister: (spec) ->
        if typeof spec is 'function' #retrieve specs from function
            spec = spec.func.inputs
        else unless Array.isArray spec #for multi-spec arrays
            spec = [spec]

        for v in spec
            v.input = [v.input] unless Array.isArray spec.input #for multi-input arrays

            for w in v.input
                if keyTriggers[w]? #determine input type
                    input = 'keyboard'
                else
                    input = w

                switch input #handle triggers
                    when 'keyboard'
                        keyboardUnregister(v, w)
                        break
                    else
                        Trigger.unsubscribe(w, v.func)

                inputs[input].count -= 1
                if inputs[input] is 0 #if no remaining events, cleanup
                    delete inputs[input]

                    switch input
                        when 'keyboard'
                            document.removeEventListener('keydown', downhandle, false)
                            document.removeEventListener('keyup', uphandle, false)
                            break
                        else
                            Trigger.removeTrigger input
                            document.removeEventListener(input, inputs[input].func, false)