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
    	context: 'global'
    });
    
    VIEWPORT.boot = include('title');
    (function step() {
        var pauseTime;	//time to wait for next frame
        
        TRIGGER.fireTrigger('step');
        
        //increment time
        TRIGGER.tick();
        
		frameTimer += VIEWPORT.frameLength;
		pauseTime = frameTimer - (new Date()).getTime();
        setTimeout(step, pauseTime <= 1 ? 1 : pauseTime);
    }());
}, false);