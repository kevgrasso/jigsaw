//keyDown         keyUpTap         keyHold         keyUpHold         keyUp
//keyPressAndDown keyPressAndUpTap keyPressAndHold keyPressAndUpHold keyPressAndUp
//keyTapAndDown   keyTapAndUpTap   keyTapAndHold   keyTapAndUpHold   keyTapAndUp
//keyHoldAndDown  keyHoldAndUpTap  keyHoldAndHold  keyHoldAndUpHold  keyHoldAndUp
//keyUp has repeats-- rename

INPUT = (function () {
	//hidden vars
	var boolStream = false,
		keystream = [ ],
		keylist = [ ];

	function downhandle(e) {
		var keycode = event.keyCode,
			keyname = keylist[keycode];
        e.preventDefault();
        e.stopImmediatePropagation();
		
		if (!this.state[keyname]) {
			this.state[keyname] = true;
			
			TRIGGER.fireTrigger(keyname+'Down');
			this.keydown[keyname] = Time().getTime(); //TODO: double tap
		}
		if (boolStream) {
			keystream.unshift(keycode);
			if (boolTrigger) {
				TRIGGER.fireTrigger('keystroke', keystream);
			}
		}
		this.lastkey = keycode;
	}
	function uphandle(e) {
		var keyname = keylist[event.keyCode];
        e.preventDefault();
        e.stopImmediatePropagation();
		
		if (this.state[keyname]) {
			this.state[keyname] = false;
			
			TRIGGER.fireTrigger(keyname+'Down');
			this.keyup[keyname] = Time().getTime();
		}
	}
    
    return {
        state: { },
        keydown: { },
        keyup: { },
        hold: {},
        double: {},
		
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
		
		setKeys: function (newkeys) {
			var keycode, keyname;
			
			for (keycode in newkeys) {
				if (newkeys.hasOwnProperty(keycode) && !keylist[keycode]) {
					keyname = newkeys[keycode];
					
					this.state[keyname] = false;
					this.keyup[keyname] = 0;
					this.keydown[keyname] = 0;
					
					TRIGGER.addTrigger(keyname+'Down');
					TRIGGER.addTrigger(keyname+'Up');
				}
			}

			for (keycode in keylist) {
				if (keylist.hasOwnProperty(keycode) && !newkeys[keycode]) {
					keyname = newkeys[keycode];
					
					delete this.state[keyname];
					delete this.keyup[keyname];
					delete this.keydown[keyname];
					
					TRIGGER.removeTrigger(keyname+'Down');
					TRIGGER.removeTrigger(keyname+'Up');
				}
			}
			
			keylist = newkeys;
		}
    };
}());