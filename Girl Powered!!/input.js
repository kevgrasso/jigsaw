//keyDown         keyUpTap         keyHold!         keyUpHold         keyUp
//keyPressAndDown keyPressAndUpTap keyPressAndHold! keyPressAndUpHold keyPressAndUp
//keyTapAndDown   keyTapAndUpTap   keyTapAndHold!   keyTapAndUpHold   keyTapAndUp
//keyHoldAndDown  keyHoldAndUpTap  keyHoldAndHold!  keyHoldAndUpHold  keyHoldAndUp

//TODO: DOM events, non-keyboard events, hold triggers
INPUT = (function () {
	//hidden vars
	var boolStream = false,
		keystream = [],
		keycodelookup = {},
		keynamelookup = {},
		interval = 4;

	function downhandle(e) {
		var keyname = keycodelookup[e.keycode].keyname;
        e.preventDefault();
        e.stopImmediatePropagation();
        
		if (!this.state[keyname]) { //only handle true keydown-- ignore further key presses
			this.state[keyname] = true;
			this.keydown[keyname] = TRIGGER.frameCount.global;
			
			TRIGGER.fireTrigger(keyname+'Down');
			if (this.lastkey === keyname && this.getKeyTime(keyname, 'up') <= interval) {
				TRIGGER.fireTrigger(keyname+'PressAndDown');
				if (!this.hold[keyname]) {
					TRIGGER.fireTrigger(keyname+'TapAndDown');
			        this.repeat[keyname] = 'tap';
				} else {
					TRIGGER.fireTrigger(keyname+'HoldAndDown');
			        this.repeat[keyname] = 'hold';
				}
			}
	        this.hold[keyname] = false;
		}
		if (boolStream) {
			keystream.unshift(keycode);
			if (boolTrigger) {
				TRIGGER.fireTrigger('keystroke', keystream);
			}
		}
		this.lastkey = keyname;
	}
	function uphandle(e) {
		var keyname = keylist[event.keyCode].keyname;
        e.preventDefault();
        e.stopImmediatePropagation();
		
		this.state[keyname] = false;
		this.keyup[keyname] = TRIGGER.frameCount.global;
		
		TRIGGER.fireTrigger(keyname+'Up');
		if (this.repeat) {
			TRIGGER.fireTrigger(keyname+'PressAndUp');
			if (this.repeat === 'tap') {
				TRIGGER.fireTrigger(keyname+'TapAndUp');
			} else {
				TRIGGER.fireTrigger(keyname+'HoldAndUp');
			}
		}
		if (!this.hold[keyname]) {
			TRIGGER.fireTrigger(keyname+'UpTap');
			if (this.repeat === 'tap') {
				TRIGGER.fireTrigger(keyname+'TapAndUpTap');
			} else {
				TRIGGER.fireTrigger(keyname+'HoldAndUpTap');
			}
		} else {
			TRIGGER.fireTrigger(keyname+'UpHold');
			if (this.repeat === 'tap') {
				TRIGGER.fireTrigger(keyname+'TapAndUpHold');
			} else {
				TRIGGER.fireTrigger(keyname+'HoldAndUpHold');
			}
		}
	}
    
    return {
        state: {},
        keydown: {},
        keyup: {},
        hold: {},
        repeat: {},
		
		lastkey: null,
		
		streamOn: function () {
			boolStream = true;
		},
		streamOff: function () {
			boolStream = false;
			keystream = [ ];
		},
		
		getStream: function () {
			return keystream.slice(0).reverse();
		},
		
		getKeyTime: function (key, state) {
			return TRIGGER.frameCount.global-this['key'+state][key];
		},
		
		request: function (spec) {
			var i, triggername = spec.trigger, triglist; 
			
			//if key not in keycodelookup, add it and create all neccessary attributes.
			if (!keycodelookup[spec.keycode]) {
				keycodelookup[spec.keycode] = {};
				keycodelookup[spec.keycode].keycode = spec.keycode;
				keycodelookup[spec.keycode].keyname = spec.keyname;
				keycodelookup[spec.keycode].count = 1;
				keycodelookup[spec.keycode].trigger = {};
				keynamelookup[spec.keyname] = keycodelookup[spec.keycode];
				
				this.state[spec.keyname] = false;
				this.keyup[spec.keyname] = 0;
				this.keydown[spec.keyname] = 0;
		        this.hold[spec.keyname] = false;
		        this.repeat[spec.keyname] = false;
			} else {
				count += 1;
			}
			triglist = keycodelookup[spec.keycode].trigger;
			
			if (spec.func) {
				//add trigger not in triglist, add it and create its trigger. Otherwise, increment its count.
				if (isValue(triglist[triggername])) {
					triglist[triggername] += 1;
				} else {
					triglist[triggername] = 1;
					TRIGGER.addTrigger(spec.keyname+triggername);
				}
				
				//prepare spec and subcribe function to TRIGGER
				spec.trigger = spec.keyname+triggername;
				TRIGGER.subscribe(spec);
			}
		},
		
		cancel: function (spec) { //TODO: where do we get the keycodes
			var i, trigsrc = spec.trigger, trigdest = keynamelookup[spec.keyname].trigger; 
			
			if (spec.func) {
				//unsubcribe function from trigger
				TRIGGER.unsubscribe(spec.keyname+spec.trigger[i], spec.func);
				
				trigdest[spec.trigger[i]] -= 1;
				if (trigdest[spec.trigger[i]] <= 0) {
					TRIGGER.removeTrigger(spec.keyname+spec.trigger[i]);
					delete trigdest[spec.trigger[i]];
				}	
			}
			
			keynamelookup[spec.keyname].count -= 1
			if (keynamelookup[spec.keyname].count === 0) {
				delete keycodelookup[keynamelookup[spec.keyname].keycode];
				delete keynamelookup[spec.keyname];
				delete this.state[spec.keyname];
				delete this.keyup[spec.keyname];
				delete this.keydown[spec.keyname];
				delete this.hold[spec.keyname];
				delete this.repeat[spec.keyname];
				break;
			}
		}
    };
}());