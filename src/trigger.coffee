#trigger.coffee: trigger singleton definition

window.Trigger = new class
    #hidden
    triggerlist = {} #list of subscriptions by trigger name and order of priority
    contextstate = {} #contains all active contexts
    entries = {} #shortcut to subscription info by function id
    
    #parses subscription data, manages timers and calls functions if has active context
    parseEntry = (entry, trigger, context, args...) ->
        for v in entry.context when contextstate[v]? and (not context? or context is v)
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
                entry.func.apply(null, argList)
            else
                entry.func.apply(entry.obj, argList)
            undefined

    #public

    frameCount: {} #number of frames each context has been active
    
    #creates trigger and readies it for subscription
    addTrigger: (trigger) ->
        @removeTrigger trigger if triggerlist[trigger]?
        triggerlist[trigger] = new BinaryHeap 'priority'
    
    #deletes a trigger
    removeTrigger: (trigger) ->
        #todo: remove all entries from entries
        
        delete triggerlist[trigger]
    
    #activates given context
    contextOn: (context) ->
        contextstate[context] = on
        @frameCount[context] ?= 0
    
    #deactivates given context
    contextOff: (context) ->
        delete contextstate[context]
    
    #increments frameCount
    tick: ->
        @frameCount[k] += 1 for own k of contextstate
        undefined
    
    #clears all entries or all entries of a given context
    clear: (context) ->
        if context?
            delete @frameCount[context]
        else
            delete @frameCount[context] for own context of @frameCount
        undefined

    #subcribes function to trigger
    # spec is an object with the following attributes:
    #   trigger
    subscribe: (spec) ->
        {trigger, func, triggerId, timerType, timerLength, autoArgs, context} = spec
        trigger = [trigger] unless Array.isArray trigger

        for v in trigger
            id = v+func.getID()+'#'+triggerId
            unless entries[id]?
                entries[id] = spec
                triggerlist[v].push spec
            else
                entries[id].extend spec

            if timerLength?                
                spec.timerCount = timerLength
                switch timerType #error detection
                    when 'timeout', 'continuous', 'loop'
                        if v isnt 'step'
                            throw new Error "Timer not on 'step' ('#{v}')"
                    else
                        throw new Error("spec.timerType is #{timerType}")

            spec.context = [context] if typeof context is 'string'
            #in case no auto-args are given
            spec.autoArgs = [] unless autoArgs

        func
    
    #unsubscribe function from trigger
    unsubscribe: (trigger, func, triggerId) ->
        trigger = [trigger] unless Array.isArray trigger

        for v in trigger
            id = v+func.getID()+'#'+triggerId
            triggerlist[v].remove entries[id]
            delete entries[id]
        undefined
    
    #fires entries with given trigger and an active context
    fireTrigger: (trigger, args...) ->

        if typeof trigger is 'object' and trigger?
            {name:trigger, context} = trigger

        triggerCopy = triggerlist[trigger]?.copy()
        return unless triggerCopy?

        loop
            i = triggerCopy.pop() #todo: simplify
            break unless i?

            parseEntry(i, trigger, context, args)
        undefined
Trigger.contextOn 'global' #defines global context