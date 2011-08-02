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
        
        //new functions for expiring
        subscribe: function (spec) {
            var i, buckets,
            	id = spec.trigger+spec.func.getid();
			
            if (!objid[id]) {
				objid[id] = spec;
				triggerlist[spec.trigger].push(spec);
            } else {
				objid[id].extend(spec);
			}
            
            if (spec.bucket) {
            	if (typeof spec.bucket === 'string') {
            		buckets = spec.bucket;
            		spec.bucket = { };
            		spec.bucket[buckets] = true;
            	} else {
	            	buckets = spec.bucket.slice(0);
					for (i = 0; i < buckets.length; i += 1) {
						spec.bucket[buckets[i]] = true;
					}
            	}
            }
			
			return spec;
        },											
        unsubscribe: function (trigger, func) {
            var id = trigger+func.getid();
			triggerlist[trigger].remove(objid[id]);
			delete objid[id];
			
			return;
        },
        
        fireTrigger: function(trigger) {
            var i, j, args = Array.prototype.slice.call(arguments, 1);
			
			triggerlist[trigger].save();
			for (i = triggerlist[trigger].pop(); i; i = triggerlist[trigger].pop()) {
				for (j in i.bucket) {
				
					if (i.bucket.hasOwnProperty(j) && bucketstate[j]) {
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