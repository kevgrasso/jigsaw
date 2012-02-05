#input.coffee: input singleton definition

window.Input = new class
    keystreamActive = off #boolean controlling whether keystream gets tracked
    keystream = [] #list of keypress events since last polled
    inputData = {} #data for all active inputs and registrations
    keyList = {} #list of keynames attached to key's keycode #don't like this comment or next, redo
    keyTriggers = {} #all registerable key triggers attached to the plain keyname
    interval = 4 #length of time in frames for key tap to become held key
    
    #handles key hold inputs
    holdhandle = (keyname, stateLock, stateBlacklist) ->
        Input.hold[keyname] = true
        
        #determine which triggers need to be fired
        if Input.repeat[keyname] is yes
            if Input.repeat[keyname] is 'tap'
                Trigger.fireTrigger {
                    name:"#{keyname}TapAndHold"
                    stateLock
                    stateBlacklist
                }, keyname
            else
                Trigger.fireTrigger {
                    name:"#{keyname}HoldAndHold"
                    stateLock
                    stateBlacklist
                }, keyname
            Trigger.fireTrigger {
                name:"#{keyname}PressAndHold"
                stateLock
                stateBlacklist
            }, keyname
        Trigger.fireTrigger {
            name:"#{keyname}Hold"
            stateLock
            stateBlacklist
        }, keyname
        stateBlacklist[stateLock] = true
        
        #so uphandle doesn't unsubscribe from a nonexistent trigger
        delete inputData[keyList[keyname]].holdIDList[stateLock]
    
    #handles key down events
    downhandle = (event) ->
        keyname = inputData[event.keyCode]?.keyname
        event.preventDefault()
        event.stopImmediatePropagation()
        
        #only handle true keydown-- ignore further key presses
        if keyname? and not Input.state[keyname]
            Input.state[keyname] = on
            Input.timeOf[keyname+'Down'] = StateMachine.frameCount.global
            
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
            
            #set up hold timer for all relevant states
            stateBlacklist = {} #provide the same blacklist to all so it can be updated
            for own state of inputData[event.keyCode].holdStateList
                triggerID = getUniqueNum()
                inputData[event.keyCode].holdIDList[state] = triggerID
                Trigger.subscribe {
                    trigger: 'step'
                    state: state
                    triggerID: triggerID
                    func: holdhandle
                    autoArgs: [keyname, state, stateBlacklist]
                    priority: -Infinity
                    timerType: 'timeout'
                    timerLength: interval
                }
            Input.lastkey = keyname ? Input.lastkey
        if keystreamActive is on
            keystream.unshift(keycode)
            Trigger.fireTrigger('keystroke', keystream) if keystreamTriggering
    
    #handles key lift events
    uphandle = (event) ->
        keyname = inputData[event.keyCode]?.keyname
        event.preventDefault()
        event.stopImmediatePropagation()

        Input.state[keyname] = off
        Input.timeOf[keyname+'Up'] = StateMachine.frameCount.global
        
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


        if inputData[event.keyCode]?
            for own state, triggerID of inputData[event.keyCode].holdIDList #cancel all pending hold triggers
                Trigger.unsubscribe('step', holdhandle, triggerID)
                delete inputData[event.keyCode].holdIDList[state]
        undefined
    
    #processes a keyboard registration
    keyboardRegister = (spec, trigger) ->
        keyname = keyTriggers[trigger]
        keycode = keyList[keyname]

        #if key not in inputs, add it and create all neccessary attributes.
        unless inputData[keycode]?
            inputData[keycode] = {}
            inputData[keycode].keycode = keycode
            inputData[keycode].keyname = keyname
            inputData[keycode].count = 1
            inputData[keycode].trigger = {}
            inputData[keycode].holdStateList = {}
            inputData[keycode].holdIDList = {}

            Input.state[keyname] = false
            Input.timeOf["#{keyname}Down"] = 0
            Input.timeOf["#{keyname}Up"] = 0
            Input.hold[keyname] = false
            Input.repeat[keyname] = false
        else
            inputData[keycode].count += 1
        triglist = inputData[keycode].trigger

        #if registering a function
        if spec.func?
            #if a hold-type input, relevant states to holdStateList
            if trigger.substr(trigger.length-4, 4) is 'Hold'
                spec.state = [spec.state] if typeof spec.state is 'string'

                for state in spec.state
                    unless inputData[keycode].holdStateList[state]
                        inputData[keycode].holdStateList[state] = 1
                    else
                        inputData[keycode].holdStateList[state] += 1

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
        triglist = inputData[keycode].trigger

        if spec.func?
            #if a hold-type input, remove relevant states from holdStateLlist
            if trigger.substr(trigger.length-4, 4) is 'Hold'

                spec.state = [spec.state] if typeof spec.state is 'string'

                for state of spec.state
                    inputData[keycode].holdStateList[state] -= 1
                    if inputData[keycode].holdStateLlist[state] <= 0
                        delete inputData[keycode].holdStateList[state]

            #unsubcribe function from trigger
            Trigger.unsubscribe(trigger, spec.func, spec.triggerID)

            triglist[trigger] -= 1
            if triglist[trigger] <= 0
                Trigger.removeTrigger trigger
                delete triglist[trigger]

        inputData[keycode].count -= 1
        if inputData[keycode].count <= 0
            delete inputData[keycode]
            delete Input.state[keyname]
            delete Input.timeOf["#{keyname}Down"]
            delete Input.timeOf["#{keyname}Up"]
            delete Input.hold[keyname]
            delete Input.repeat[keyname]

    state: {}  #state of all keys in keyList
    timeOf: {} #time of last keyup/keydown for all keys in keyList
    hold: {}   #whether last keydown was tap or hold
    repeat: {} #whether last keydown was a sequential stroke and if so, whether
               #   it was a tap or hold
    
    lastkey: null #name of last keydown
    
    #activate keystream capturing
    streamOn: ->
        keystreamActive = on
    
    #deactivate keystream capturing
    streamOff: ->
        keyStreamActive = off
        keystream = []
    
    #returns and clears current keystream
    getStream: ->
        keystream[0...keystream.length]
        keystream = []
    
    #returns time since last keyUp or keyDown
    getKeyTime: (key, state) ->
        state = state.charAt(0).toUpperCase() + state[1...state.length].toLowerCase() #capitalize
        StateMachine.frameCount.global-@timeOf[key+state]
    
    #replace the master key list with a new key sets
    setKeys: (newList) ->
        keyList = newList
        
        keyTriggers = {} #derive whitelist for key inputs
        for own key of keyList
            keyTriggers["#{key}Down"] = key
            keyTriggers["#{key}UpTap"] = key
            keyTriggers["#{key}Hold"] = key
            keyTriggers["#{key}UpHold"] = key
            keyTriggers["#{key}Up"] = key
            keyTriggers["#{key}PressAndDown"] = key
            keyTriggers["#{key}PressAndUpTap"] = key
            keyTriggers["#{key}PressAndHold"] = key
            keyTriggers["#{key}PressAndUpHold"] = key
            keyTriggers["#{key}PressAndUp"] = key
            keyTriggers["#{key}TapAndDown"] = key
            keyTriggers["#{key}TapAndUpTap"] = key
            keyTriggers["#{key}TapAndHold"] = key
            keyTriggers["#{key}TapAndUpHold"] = key
            keyTriggers["#{key}TapAndUp"] = key
            keyTriggers["#{key}HoldAndDown"] = key
            keyTriggers["#{key}HoldAndUpTap"] = key
            keyTriggers["#{key}HoldAndHold"] = key
            keyTriggers["#{key}HoldAndUpHold"] = key
            keyTriggers["#{key}HoldAndUp"] = key

        keyList
    
    #processes an input registration
    register: (specs) ->

        specs = [specs] unless Array.isArray specs #for multi-spec arrays

        for spec in specs
        
            throw new Error 'input request includes timer' if spec.timer ? spec.length? #sanity checking
            spec.input = [spec.input]unless Array.isArray spec.input #for multi-input arrays

            for input in spec.input
                if keyTriggers[input]? #determine input type
                    inputType = 'keyboard'
                else
                    inputType = input

                unless inputData[inputType]? #initial request preparation -- inputs object, event listeners, and triggers
                    inputData[inputType] = { count: 1 }

                    switch inputType
                        when 'keyboard'
                            document.addEventListener('keydown', downhandle, false)
                            document.addEventListener('keyup', uphandle, false)
                            break
                        else
                            Trigger.addTrigger inputType
                            inputData[inputType].func = (e) ->
                                e.preventDefault()
                                e.stopImmediatePropagation()
                                @timeOf[inputType] = 0

                                Trigger.fireTrigger inputType, e
                            document.addEventListener(inputType, inputData[inputType].func, false)
                else
                    inputData[inputType].count += 1

                spec.trigger = input #prep spec.trigger for subscription
                switch inputType #handle triggers
                    when 'keyboard'
                        keyboardRegister spec, input
                        break
                    else
                        Trigger.subscribe spec

            if spec.func?
                unless spec.func.inputs
                    spec.func.inputs = [spec]
                else
                    spec.func.inputs.push spec
        if spec.length is 1
            spec[0].func ? spec[0]
        else
            spec
    
    #removes an input registration
    unregister: (specs) ->
        if typeof specs is 'function' #retrieve specs from function
            specs = spec.func.inputs
        else unless Array.isArray spec #for multi-spec arrays
            specs = [specs]

        for spec in specs
            spec.input = [spec.input] unless Array.isArray spec.input #for multi-input arrays

            for input in spec.input
                if keyTriggers[input]? #determine input type
                    inputType = 'keyboard'
                else
                    inputType = input

                switch input #handle triggers
                    when 'keyboard'
                        keyboardUnregister(spec, input)
                        break
                    else
                        Trigger.unsubscribe(input, spec.func)

                inputData[inputType].count -= 1
                if inputData[inputType] is 0 #if no remaining events, cleanup
                    delete inputData[inputType]

                    switch inputType
                        when 'keyboard'
                            document.removeEventListener('keydown', downhandle, false)
                            document.removeEventListener('keyup', uphandle, false)
                            break
                        else
                            Trigger.removeTrigger inputType
                            document.removeEventListener(inputType, inputData[inputType].func, false)