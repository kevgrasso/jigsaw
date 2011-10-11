TRIGGER = (function () {
    //hidden vars
    var triggerlist = {}, //includes subscriber info
		contextstate = {}, 
		entries = {};
    
    function parseEntry(entry, trigger, context, args) {
    	var i;
    	for (i in entry.context) {
			if (entry.context.hasOwnProperty(i) && isValue(contextstate[i])
					&& (!context || (context === i))) {
				//timer code
				if (isValue(entry.timerCount)) {
					entry.timerCount -= 1;
					
					if (entry.timerType !== 'continuous' && entry.timerCount > 0) { //immediate code
						return;
					} else if (entry.timerType ==='loop' && entry.timerCount <= 0) { //looping code
						entry.timerCount = entry.timerLength;
					} else if (entry.timerCount <= 0) { //timeout code
						TRIGGER.unsubscribe(trigger, entry.func, entry.trigId);
					} 
				}
				
				//call the function. if there is an object specified, make it the thisobj
				if (!isValue(entry.obj)) {
					entry.func.apply(null, entry.autoArgs.concat(args));
				} else {
					entry.func.apply(entry.obj, entry.autoArgs.concat(args));
				}
				return;
			}
		}
    }
    
    
    
    return {
    	frameCount: {},
    	
        addTrigger: function (trigger) {
        	if (isValue(triggerlist[trigger])) {
        		this.removeTrigger(trigger);
        	}
            triggerlist[trigger] = new BinaryHeap('priority');
        },
        removeTrigger: function (trigger) {
        	//remove all entries from entries
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
            var i, j, temp, id;
            
            if (!Array.isArray(spec.trigger)) {
            	spec.trigger = [spec.trigger];
            }
            
			for (i=0; i<spec.trigger.length; i+=1) {
				id = spec.trigger[i]+spec.func.getid()+'#'+spec.trigId;
	            if (!isValue(entries[id])) {
					entries[id] = spec;
					triggerlist[spec.trigger[i]].push(spec);
	            } else {
					entries[id].extend(spec);
				}
	            
	            if (isValue(spec.timerLength)) {
	            	spec.timerCount = spec.timerLength;
	            	switch(spec.timerType){
	            	case 'timeout':
	            	case 'continuous':
	            	case 'loop':
	            		break;
	            	default:
	            		throw new Error('spec.timerType is '+spec.timerType);
	            		break;
	            	}
	            }
	            
	            if (isValue(spec.context)) {
	            	if (typeof spec.context === 'string') {
	            		temp = spec.context;
	            		spec.context = {};
	            		spec.context[temp] = true;
	            	} else {
		            	temp = spec.context.slice(0);
		            	spec.context = {};
						for (j = 0; j < temp.length; j += 1) {
							spec.context[temp[j]] = true;
						}
	            	}
	            }
	            if (!spec.autoArgs) { //in case no auto-args are given
	            	spec.autoArgs = [];
	            }
			}
            
            return spec.func;
        },											
        unsubscribe: function (trigger, func, trigId) {
            var  i, id;
            
            if (!Array.isArray(trigger)) {
            	trigger = [trigger];
            }
            
            for (i=0; i<trigger.length; i+=1) {
            	id = trigger[i]+func.getid()+'#'+trigId;
            	triggerlist[trigger[i]].remove(entries[id]);
				delete entries[id];
            }
        },
        
        fireTrigger: function(trigger) {
            var i, context, triggerCopy,
            	args = Array.prototype.slice.call(arguments, 1);
            
            if (typeof trigger === 'object' && isValue(trigger)) {
            	context = trigger.context;
            	trigger = trigger.name;
            }
            
            triggerCopy = triggerlist[trigger] && triggerlist[trigger].copy();
            if (!triggerCopy) {
            	return;
            }
			
			for (i = triggerCopy.pop(); isValue(i); i = triggerCopy.pop()) {
				parseEntry(i, trigger, context, args);
			}
		}
    };
}());
TRIGGER.contextOn('global');