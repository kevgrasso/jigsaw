document.addEventListener('DOMContentLoaded', function () {
	var frameTimer = (new Date()).getTime(); //keep track of when frames should execute
	
	//register step-flow events
    TRIGGER.addTrigger('step');
	
    //setup canvas
	VIEWPORT = new MetaLayer({
		context: document.getElementById('display').getContext('2d'),
		
		x: null,
		y: null,
		
		viewx: 0,
		viewy: 0,
		
		width: document.getElementById('display').width,
		height: document.getElementById('display').height,
		
		attrib: {
			frameCount: 0,
			frameLength: 0,
			frameRate: 0,
			
			setFrameLength: function (num) {
				this.fps = 1000/num;
				this.frameLength = num;
			}
                        
		},
		
		draw: function () {
			this.render();
			//INPUT.updateMouse();
		}
	});
    TRIGGER.subscribe({
    	trigger: 'step',
    	func: VIEWPORT.render,
    	obj: VIEWPORT,
    	priority: 25,
    	bucket: 'global'
    });
    
    VIEWPORT.boot = include('title.js');
    (function step() {
        var pauseTime;	//time to wait for next frame
        VIEWPORT.frameCount += 1;
        
        TRIGGER.fireTrigger('step'); //signal primary step code1
        
		frameTimer += VIEWPORT.frameLength;
		pauseTime = frameTimer - (new Date()).getTime();
        setTimeout(step, pauseTime <= 1 ? 1 : pauseTime);
    }());
}, true); //TODO: is true/stopImmediatePropagation faster?