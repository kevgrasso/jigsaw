//keyDown         keyUpTap         keyHold         keyUpHold         keyUp
//keyPressAndDown keyPressAndUpTap keyPressAndHold keyPressAndUpHold keyPressAndUp
//keyTapAndDown   keyTapAndUpTap   keyTapAndHold   keyTapAndUpHold   keyTapAndUp
//keyHoldAndDown  keyHoldAndUpTap  keyHoldAndHold  keyHoldAndUpHold  keyHoldAndUp

INPUT = (function () {
	//hidden vars
	var boolStream = false,
		keystream = [],
		inputs = {},
		keynames = {},
		keyinputlist = {},
		interval = 4,
		count = 0;
	
	function holdhandle(keyname, context) {
        INPUT.hold[keyname] = true;
		
		if (INPUT.repeat[keyname]) {
			if (INPUT.repeat[keyname] === 'tap') {
				TRIGGER.fireTrigger({name:keyname+'TapAndHold', context:context}, keyname);
			} else {
				TRIGGER.fireTrigger({name:keyname+'HoldAndHold', context:context}, keyname);
			}
			TRIGGER.fireTrigger({name:keyname+'PressAndHold', context:context}, keyname);
		}
		TRIGGER.fireTrigger({name:keyname+'Hold', context:context}, keyname);
		
		delete inputs[keynames[keyname]].holdidlist[context]; //so that uphandle doesn't unsubscribe from a nonexistent trigger
	}

	function downhandle(e) {
		var i, keyname = inputs[e.keyCode] && inputs[e.keyCode].keyname;
        e.preventDefault();
        e.stopImmediatePropagation();
        
		if (keyname && !INPUT.state[keyname]) { //only handle true keydown-- ignore further key presses
			INPUT.state[keyname] = true;
			INPUT.timeSince[keyname+'Down'] = TRIGGER.frameCount.global;
			
			if (INPUT.lastkey === keyname && INPUT.getKeyTime(keyname, 'up') <= interval) {
				if (!INPUT.hold[keyname]) {
					INPUT.repeat[keyname] = 'tap';
					TRIGGER.fireTrigger(keyname+'TapAndDown');
				} else {
					INPUT.repeat[keyname] = 'hold';
			        INPUT.hold[keyname] = false;
					TRIGGER.fireTrigger(keyname+'HoldAndDown', keyname);
				}
				TRIGGER.fireTrigger(keyname+'PressAndDown', keyname);
			} else {
				INPUT.repeat[keyname] = null;
			}
			TRIGGER.fireTrigger(keyname+'Down', keyname);
			
			for (i in inputs[e.keyCode].holdcontextlist) { //set up hold timer for all relevant contexts
				if (inputs[e.keyCode].holdcontextlist.hasOwnProperty(i)) {
					inputs[e.keyCode].holdidlist[i] = count;
					TRIGGER.subscribe({
						trigger: 'step',
						context: i,
						trigId: count,
						priority: -Infinity,
						autoArgs: [keyname, i],
						timerType: 'timeout',
						timerLength: interval,
						func: holdhandle
					});
					count += 1;
				}
			}
			INPUT.lastkey = keyname || INPUT.lastkey;
		}
		if (boolStream) {
			keystream.unshift(keycode);
			if (boolTrigger) {
				TRIGGER.fireTrigger('keystroke', keystream);
			}
		}
	}
	function uphandle(e) {
		var keyname = inputs[e.keyCode] && inputs[e.keyCode].keyname;
        e.preventDefault();
        e.stopImmediatePropagation();
		
		INPUT.state[keyname] = false;
		INPUT.timeSince[keyname+'Up'] = TRIGGER.frameCount.global;
		
		if (INPUT.repeat) {
			if (INPUT.repeat === 'tap') {
				TRIGGER.fireTrigger(keyname+'TapAndUp', keyname);
			} else {
				TRIGGER.fireTrigger(keyname+'HoldAndUp', keyname);
			}
			TRIGGER.fireTrigger(keyname+'PressAndUp', keyname);
		}
		if (!INPUT.hold[keyname]) {
			if (INPUT.repeat) {
				if (INPUT.repeat === 'tap') {
					TRIGGER.fireTrigger(keyname+'TapAndUpTap', keyname);
				} else {
					TRIGGER.fireTrigger(keyname+'HoldAndUpTap', keyname);
				}
				TRIGGER.fireTrigger(keyname+'PressAndUpTap', keyname);
			}
			TRIGGER.fireTrigger(keyname+'UpTap', keyname);
		} else {
			if (INPUT.repeat) {
				if (INPUT.repeat === 'tap') {
					TRIGGER.fireTrigger(keyname+'TapAndUpHold', keyname);
				} else {
					TRIGGER.fireTrigger(keyname+'HoldAndUpHold', keyname);
				}
				TRIGGER.fireTrigger(keyname+'PressAndUpHold', keyname);
			}
			TRIGGER.fireTrigger(keyname+'UpHold', keyname);
		}
		TRIGGER.fireTrigger(keyname+'Up', keyname);
		

		if (inputs[e.keyCode]) {
			for (i in inputs[e.keyCode].holdidlist) { //cancel all pending hold triggers
				if (inputs[e.keyCode].holdidlist.hasOwnProperty(i)) {
					TRIGGER.unsubscribe('step', holdhandle, inputs[e.keyCode].holdidlist[i]);
					delete inputs[e.keyCode].holdidlist[i];
				}
			}
		}
	}
	
	function keyboardRequest (spec, trigger) {
		var keyname = keyinputlist[trigger],
			keycode = keynames[keyname],
			triglist, i;
		
		//if key not in inputs, add it and create all neccessary attributes.
		if (!inputs[keycode]) {
			inputs[keycode] = {};
			inputs[keycode].keycode = keycode;
			inputs[keycode].keyname = keyname;
			inputs[keycode].count = 1;
			inputs[keycode].trigger = {};
			inputs[keycode].holdcontextlist = {};
			inputs[keycode].holdidlist = {};
			
			INPUT.state[keyname] = false;
			INPUT.timeSince[keyname+'Down'] = 0;
			INPUT.timeSince[keyname+'Up'] = 0;
	        INPUT.hold[keyname] = false;
	        INPUT.repeat[keyname] = false;
		} else {
			inputs[keycode].count += 1;
		}
		triglist = inputs[keycode].trigger;
		
		//if registering a function
		if (spec.func) {
			//if a hold-type input, relevant contexts to holdcontextlist
			if (trigger.substr(trigger.length-4, 4) === 'Hold') {
				
				if (typeof spec.context === 'string') {
					spec.context = [spec.context];
				}
				
				for (i=0; i<spec.context.length; i+=1) {
					if (!inputs[keycode].holdcontextlist[spec.context[i]]) {
						inputs[keycode].holdcontextlist[spec.context[i]] = 1;
					} else {
						inputs[keycode].holdcontextlist[spec.context[i]] += 1;
					}
				}
			}
			
			//if trigger not in triglist, add it and create its trigger. Otherwise, increment its count.
			if (isValue(triglist[trigger])) {
				triglist[trigger] += 1;
			} else {
				triglist[trigger] = 1;
				TRIGGER.addTrigger(trigger);
			}
			
			TRIGGER.subscribe(spec);
		}
	}
	function keyboardClose(spec, trigger) { //FIXME: full inputs and holdcontextlist
		var keyname = keyinputlist[trigger],
			keycode = keynames[keyname],
			triglist = inputs[keycode].trigger,
			i; 
		
		if (spec.func) {
			//if a hold-type input, relevant contexts to holdcontextlist
			if (trigger.substr(trigger.length-4, 4) === 'Hold') {
				
				if (typeof spec.context === 'string') {
					spec.context = [spec.context];
				}
				
				for (i=0; i<spec.context.length; i+=1) {
					inputs[keycode].holdcontextlist[spec.context[i]] += 1;
					if (inputs[keycode].holdcontextlist[spec.context[i]] <= 0) {
						delete inputs[keycode].holdcontextlist[spec.context[i]];
					}
				}
			}
			
			//unsubcribe function from trigger
			TRIGGER.unsubscribe(trigger, spec.func);
			
			triglist[trigger] -= 1;
			if (triglist[trigger] <= 0) {
				TRIGGER.removeTrigger(trigger);
				delete trigdest[trigger];
			}	
		}
		
		inputs[keycode].count -= 1;
		if (inputs[keycode].count <= 0) {
			delete inputs[keycode];
			delete INPUT.state[keyname];
			delete INPUT.timeSince[keyname+'Down'];
			delete INPUT.timeSince[keyname+'Up'];
			delete INPUT.hold[keyname];
			delete INPUT.repeat[keyname];
		}
	}
    
    return {
        state: {},
        timeSince: {},
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
			state = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase(); //capitalize
			return TRIGGER.frameCount.global-this.timeSince[key+state];
		},
		
		setKeys: function (setlist, clearlist) {
			var i;
			setlist = setlist || {};
			clearlist = clearlist || [];
			
			extend(keynames, setlist); //add new keynames to list
			for (i=0; i<clearlist.length; i+=1) { //remove old keynames
				delete keynames[clearlist[i]];
			}
			
			keyinputlist = {}; //derive whitelist for key inputs
			for (i in keynames) {
				if (keynames.hasOwnProperty(i)) {
					keyinputlist[i+'Down'] = i;
					keyinputlist[i+'UpTap'] = i;
					keyinputlist[i+'Hold'] = i;
					keyinputlist[i+'UpHold'] = i;
					keyinputlist[i+'Up'] = i;
					keyinputlist[i+'PressAndDown'] = i;
					keyinputlist[i+'PressAndUpTap'] = i;
					keyinputlist[i+'PressAndHold'] = i;
					keyinputlist[i+'PressAndUpHold'] = i;
					keyinputlist[i+'PressAndUp'] = i;
					keyinputlist[i+'TapAndDown'] = i;
					keyinputlist[i+'TapAndUpTap'] = i;
					keyinputlist[i+'TapAndHold'] = i;
					keyinputlist[i+'TapAndUpHold'] = i;
					keyinputlist[i+'TapAndUp'] = i;
					keyinputlist[i+'HoldAndDown'] = i;
					keyinputlist[i+'HoldAndUpTap'] = i;
					keyinputlist[i+'HoldAndHold'] = i;
					keyinputlist[i+'HoldAndUpHold'] = i;
					keyinputlist[i+'HoldAndUp'] = i;
				}
			}
			
			return keynames;
		},
		
		request: function (spec) {
			var input, i;
			
			if (spec.timer || isValue(spec.length)) { //sanity checking
				throw new Error('input request includes timer');
			}
			
			if (!Array.isArray(spec.input)) { //for multi-input arrays
				spec.input = [spec.input];
			} 
			for (i=0; i<spec.input.length; i+=1) { 
				if (keyinputlist[spec.input[i]]) { //determine input type
					input = 'keyboard';
				} else {
					input = spec.input[i];
				}
				
				if (!inputs[input]) { //initial request preparation -- inputs object, event listeners, and triggers
					inputs[input] = {count: 1};
					
					switch(input) {
					case 'keyboard':
						document.addEventListener('keydown', downhandle, false);
						document.addEventListener('keyup', uphandle, false);
						break;
					default:
						TRIGGER.addTrigger(input);
						inputs[input].func = function (e) {
					        e.preventDefault();
					        e.stopImmediatePropagation();
					        this.timeSince[input] = 0;
					        
					        TRIGGER.fireTrigger(input, e);
						};
						document.addEventListener(input, inputs[input].func, false);
					}
				} else {
					inputs[input].count += 1;
				}
				
				spec.trigger = spec.input[i]; //prep spec.trigger for subscription
				switch(input) { //handle triggers
				case 'keyboard':
					keyboardRequest(spec, spec.input[i]);
					break;
				default:
					TRIGGER.subscribe(spec);
				}
			}
			
			return spec.func;
		},
		
		close: function (spec) {
			var input;
			
			if (!Array.isArray(spec.input)) { //for multi-input arrays
				spec.input = [spec.input];
			} 
			for (i=0; i<spec.input.length; i+=1) { 
				if (keyinputlist[spec.input[i]]) { //determine input type
					input = 'keyboard';
				} else {
					input = spec.input[i];
				}
			
				switch(input) { //handle triggers
				case 'keyboard':
					keyboardClose(spec, spec.input[i]);
					break;
				default:
					TRIGGER.unsubscribe(spec.input[i], spec.func);
				}
				
				inputs[input].count -= 1;
				if (inputs[input] === 0) { //if no remaining events, cleanup
					delete inputs[input];
					
					switch(input) {
					case 'keyboard':
						document.removeEventListener('keydown', downhandle, false);
						document.removeEventListener('keyup', uphandle, false);
						break;
					default:
						TRIGGER.removeTrigger(input);
						document.removeEventListener(input, inputs[input].func, false);
					}
				}
			}
		}
    };
}());