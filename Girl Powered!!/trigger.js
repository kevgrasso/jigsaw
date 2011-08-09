TRIGGER = (function () {
    //hidden vars
    var triggerlist = { }, //includes subscriber info
		contextstate = { }, 
		objid = { }, //rename 'entries'
		currentTrigger = null
		//TODO: some sort of buffer for currentTrigger stuff
    
    function emptyBuffer() {
    	
    }
    
    
    return {
    	frameCount: { },
    	
        addTrigger: function (trigger) {
        	if (isValue(triggerlist[trigger])) {
        		this.removeTrigger(trigger);
        	}
            triggerlist[trigger] = new BinaryHeap('priority');
        },
        removeTrigger: function (trigger) {
        	//remove all entries from objid
            delete triggerlist[trigger];
        },
        
        contextOn: function (context) {
            contextstate[context] = true;
            this.frameCount[context] = this.frameCount[context] || 0;
        },
        contextOff: function (context) {
            delete contextstate[context];
        },
        
        tick: function () {
        	var i;
        	for (i in contextstate) {
        		if (contextstate.hasOwnProperty(i)) {
        			this.frameCount[i] += 1;
        		}
        	}
        },
        clear: function (context) {
        	if (isValue(context)) {
        		delete this.frameCount[context];
        	} else {
        		for (context in this.frameCount) {
            		delete this.frameCount[context];
        		}
        	}
        },
        
        subscribe: function (spec) {
            var i, contexts,
            	id = spec.trigger+spec.func.getid();
			
            if (!isValue(objid[id])) {
				objid[id] = spec;
				triggerlist[spec.trigger].push(spec);
            } else {
				objid[id].extend(spec);
			}
            
            if (isValue(spec.length)) {
            	spec.count = spec.length;
            	switch(spec.timer){
            	case 'timeout':
            	case 'continuous':
            	case 'loop':
            		break;
            	default:
            		throw new Error('spec.timer is '+spec.timer);
            		break;
            	}
            }
            
            if (isValue(spec.context)) {
            	if (typeof spec.context === 'string') {
            		contexts = spec.context;
            		spec.context = { };
            		spec.context[contexts] = true;
            	} else {
	            	contexts = spec.context.slice(0);
					for (i = 0; i < contexts.length; i += 1) {
						spec.context[contexts[i]] = true;
					}
            	}
            }
        },											
        unsubscribe: function (trigger, func) {
            var id = trigger+func.getid();
			triggerlist[trigger].remove(objid[id]);
			delete objid[id];
        },
        
        fireTrigger: function(trigger) {
            var i, j, triggerCopy = triggerlist[trigger].copy();
            	args = Array.prototype.slice.call(arguments, 1);
			
			for (i = triggerCopy.pop(); isValue(i); i = triggerCopy.pop()) {
				for (j in i.context) {
				
					if (i.context.hasOwnProperty(j) && isValue(contextstate[j])) {
						//timer code
						if (isValue(i.count)) {
							i.count -= 1;
							
							if (i.timer ==='continuous' && i.count > 0) { //immediate code
								break;
							} else if (i.timer ==='loop' && i.count <= 0) { //looping code
								i.count = i.frames;
							} else if (i.count <= 0) { //timeout code
								this.unsubscribe(trigger, i.func);
							} 
						}
						
						//call the function. if there is an object specified, make it thisobj
						if (!isValue(i.obj)) {
							i.func.apply(null, args);
						} else {
							i.func.apply(i.obj, args);
						}
						break;
					}
				
				}
			}
		}
    };
}());
TRIGGER.contextOn('global');