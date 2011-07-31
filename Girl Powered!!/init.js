document.addEventListener('DOMContentLoaded', function () {
	var frameTimer = (new Date()).getTime(); //keep track of when frames should execute
	
	//register step-flow events
    TRIGGER.addTrigger('step');
	
    //setup canvas
	VIEWPORT = new MetaLayer({
		x: null,
		y: null,
		
		viewx: 0,
		viewy: 0,
		
		width: document.getElementById('display').width,
		height: document.getElementById('display').height,
		
		draw: MetaLayer.render,
		context: document.getElementById('display').getContext('2d'),
		
		attrib: {
			priority: 100,
			
			frameCount: 0,
			frameLength: 0,
			frameRate: 0,
			
			setFrameLength: function (num) {
				this.fps = 1000/num;
				this.frameLength = num;
			}
                        
		}
	});
    TRIGGER.subscribe('step', VIEWPORT, VIEWPORT.render, 'global');
    
    VIEWPORT.boot = include('boot.js');
    (function step() {
        var pauseTime;	//time to wait for next frame
        VIEWPORT.frameCount += 1;
        
        TRIGGER.fireTrigger('step'); //signal primary step code1
        
		frameTimer += VIEWPORT.frameLength;
		pauseTime = frameTimer - (new Date()).getTime();
        setTimeout(step, pauseTime <= 1 ? 1 : pauseTime);
    }());
}, true); //TODO: is true/stopImmediatePropagation faster?