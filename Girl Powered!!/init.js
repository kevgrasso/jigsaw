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
			audio: null, //AudioContext, webkitAudioContext
			
			frameLength: 0,
			frameRate: 0,
			frameLock: true,
			frameTime: 0,
			
			setFrameLength: function (num) {
				this.fps = 1000/num;
				this.frameLength = num;
			},
                        
		},
		
		draw: function () { //todo: start dropping frames if the time gap gets too big
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
        var pauseTime, currentTime;	//time to wait for next frame
        
        //trigger 
        TRIGGER.fireTrigger('step');
        
        //increment time
        TRIGGER.tick();
        
		frameTimer += VIEWPORT.frameLength;
		currentTime = (new Date()).getTime();
		if (frameTimer-currentTime < -500) { //limit lag catch-up to 10 frames
			frameTimer = currentTime-500;
		}
		pauseTime = frameTimer-currentTime;
        setTimeout(step, pauseTime <= 1 ? 1 : pauseTime);
    }());
}, false);