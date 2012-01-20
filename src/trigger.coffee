#trigger.coffee: trigger singleton definition

window.StateMachine = new class
    stateBuffer = {} #state of active states next tick
    activeStates = {} #contains all active states
    frameCount: {} #number of frames each state has been active
    
    #activates given state
    activate: (state) ->
        stateBuffer[state] = on
        @frameCount[state] ?= 0
    
    #deactivates given context
    deactivate: (state) ->
        delete stateBuffer[state]
    
    check: (statelist, contextLock, stateBlacklist) ->
        statelist = [statelist] if typeof statelist is 'string'
        
        for own state in statelist when activeState[state]? and (not stateLock? or (stateLock is state and not stateBlacklist[state]?))
            return true
    
    #increments frameCount
    tick: ->
        activeStates = stateBuffer.clone()
        @frameCount[state] += 1 for own state of activeState
        undefined
StateMachine.activate 'global' #defines global context

window.Trigger = new class
    #hidden
    triggerLists = {} #list of subscriptions by trigger name and order of priority
    entries = {} #shortcut to subscription info by function id
    
    #parses subscription data, manages timers and calls functions if has active context
    parseEntry = (entry, trigger, args, stateLock, stateBlacklist) ->
        if StateMachine.check(entry.state, stateLock, stateBlacklist)
            #timer code
            if entry.timerCount?
                entry.timerCount -= 1

                if entry.timerType isnt 'continuous' and entry.timerCount > 0 #immediate code
                    return
                else if entry.timerType is 'loop' and entry.timerCount <= 0 #looping code
                    entry.timerCount = entry.timerLength
                else if entry.timerCount <= 0 #timeout code
                    Trigger.unsubscribe(trigger, entry.func, entry.triggerId)
            
            argList = entry.autoArgs?.concat(args) ? args
            #call the function. if there is an object specified, make it the thisobj
            unless entry.obj?
                entry.func(argList...)
            else
                entry.func.apply(entry.obj, argList)
            undefined

    #public
    
    #creates trigger and readies it for subscription
    addTrigger: (trigger) ->
        triggerLists[trigger] = [] unless triggerLists[trigger]?
    
    #deletes a trigger
    removeTrigger: (trigger) ->
        @unsubscribe(i.trigger, i.func, i.trigID) for t in triggerLists #removes all from entries
        delete triggerLists[trigger]
    
    #clears all entries or all entries of a given context
    clear: (context) ->
        if context?
            delete @frameCount[context]
        else
            delete @frameCount[context] for own context of @frameCount
        undefined

    #subcribes function to trigger
    #   trigger and func are the only required attributes in spec
    subscribe: (spec) ->
        {trigger, func, state, triggerId, timerType, timerLength, autoArgs} = spec
        trigger = [trigger] unless Array.isArray trigger
        
        if typeof state is 'string'
            spec.state = [state]
        else if not state?
            spec.state = ['global']
        #in case no auto-args are given
        spec.autoArgs = [] unless autoArgs

        for v in trigger
            id = v+func.getID()+'#'+triggerId
            unless entries[id]?
                entries[id] = spec
                triggerLists[v].push spec
            else
                entries[id].extend spec

            if timerType?                
                spec.timerCount = timerLength
                switch timerType #error detection
                    when 'timeout', 'continuous', 'loop'
                        if v isnt 'step'
                            throw new Error "Timer not on 'step' ('#{v}')"
                    else
                        throw new Error("spec.timerType is #{timerType}")
        
        func
    
    #unsubscribe function from trigger
    unsubscribe: (trigger, func, triggerId) ->
        trigger = [trigger] unless Array.isArray trigger
        
        for v in trigger
            id = v+func.getID()+'#'+triggerId
            triggerLists[v].splice(triggerLists[v].indexOf(entries[id]), 1)
            delete entries[id]
        undefined
        
    unsubscribeByState: (state) ->
        for own list of triggerLists
            for entry in list when entry.state is state
                @unsubscribe(entry.trigger, entry.func, entry.triggerID)
    unsubscribeByObject: (object) ->
        for own list of triggerLists
            for entry in list when entry.obj is object
                @unsubscribe(entry.trigger, entry.func, entry.triggerID)
    
    #private function for ranking two given objs by priority
    entryCompare = (a, b) ->
        a.priority - b.priority
    
    #fires entries with given trigger and an active context
    fireTrigger: (trigger, args...) ->
        if typeof trigger is 'object' and trigger?
            {name:trigger, stateLock, stateBlacklist} = trigger
        
        triggerList = triggerLists[trigger]
        return unless list?
        triggerList.sort(entryCompare)
        
        parseEntry(entry, trigger, args, stateLock, stateBlacklist) for entry in triggerList.clone()
        undefined
Trigger.addTrigger 'step' #register step-flow event