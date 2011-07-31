TRIGGER = (function () {
    //hidden vars
    var triggerlist = { }, //includes subscriber info
		bucketstate = { }, 
		objid = { }; //TODO: rename objfunc id
    
    return {
        addTrigger: function (trigger) {
            triggerlist[trigger] = new BinaryHeap('priority');
			return;
        },
        removeTrigger: function (trig) {
            delete triggerlist[trigger];
			return;
        },
        
        bucketOn: function (bucket) {
            bucketstate[bucket] = true;
			return;
        },
        bucketOff: function (bucket) {
            delete bucketstate[bucket];
			return;
        },
        
        subscribe: function (trigger, obj, func) {
            var id = obj.getid() + '+' + func.getid(),
				i, buckets = Array.prototype.slice.call(arguments, 3),
				entry;
			
            if (!objid[id]) {
            	entry = {
    					func: func,
    					obj: obj,
    					buckets: { }
    			};
				objid[id] = entry;
				triggerlist[trigger].push(entry);
            } else {
				entry = objid[id];
			}
				
			for (i = 0; i < buckets.length; i += 1) {
				entry.buckets[buckets[i]] = true;
			}
			
			return entry;
        },											
        unsubscribe: function (trigger, obj, func) {
            var id = obj.getid() + '+' + func.getid();
			triggerlist[trigger].remove(objid[id]);
			delete objid[id];
			
			return;
        },
        
        fireTrigger: function(trigger) {
            var i, j, args = Array.prototype.slice.call(arguments, 1);
			
			triggerlist[trigger].save();
			for (i = triggerlist[trigger].pop(); i; i = triggerlist[trigger].pop()) {
				for (j in i.buckets) {
				
					if (i.buckets.hasOwnProperty(j) && bucketstate[j]) {
						i.func.apply(i.obj, args);
						break;
					}
				
				}
			}
			triggerlist[trigger].restore();
						
			return;
		}
    };
}());
TRIGGER.bucketOn('global');