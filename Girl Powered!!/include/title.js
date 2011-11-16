//Jigsaw test
//Kevin Grasso

//next:
//expiring triggers
//test collisions
//add callPointFunction for INPUT.updateMouse
//cleanup shapes/fix ejectShape
//cleanup sprite (SpriteLayer)
//cleanup boot
//get rid of makeClass-- generic Object.prototype.isA function instead
//use DOM events for readystate in Include
//move framerate stuff to TRIGGER
//new name for buckets
//finish Map functions
//INPUT.updateMouse(): checks given CollisionGrid, either pushes SelfShape/MouseShape into Heap or checks out subgrid/viewport containing. BinaryHeap is made a
//	attribute of INPUT. mouse events bubble down array until false is returned. do something about moveover/out.
//	TRIGGER.subscribe(Shape.getTrigger('dblclick')); (based on ID)

//---later---
//
//ENTITY:
//any other changes to the moveQueue system (have map in mind)
//multi-cell entities
//
//INPUT:
//mouse
//*mouseon
//*mouseoff
//*mouseover
//*mousedown
//*mouseup
//*click (if mousedown over shape, then leave shape, doesn't count)
//*doubleclick (both must be fast)
//*drag
//interval
//lowup
//lowdown
//tap
//doubletap
//
//MAPS:
//MoveAlong (for walls too (for walljumps and grabbing ledges))
//MoveAcross
//
//PLAYER:
//balance characters better
//change jump physics
//add dodging
//
//ENEMIES:
//
//ANIMATION:
//
//ACTOR:
//actors larger than cells
//
//GRID:
//multi-resolution cells
//chunk loading/unloading
//
//OTHER:
//MetaLayer.render could maybe be replaced with a trigger (but what if the metalayer is deleted??) 
//matrix2d class
//pause on Window losing focus (throttle framerate to 2fps or lower)
//playing same file multiple times

//BUGS:
//sprite's isViewable function not working //it shouldn't
//test won't register collision if y ~= 255

//attacks:
//punch
//kick
//walking punch
//running punch
//jump kick
//leap kick
//
//combos have minor effect on damage, major effect on pickups

VIEWPORT.setFrameLength(50);
INPUT.setKeys({
	w: 87,
	s: 83,
	a: 65,
	d: 68,
	up: 38,
	down: 40,
	left: 37,
	right: 39,
	z: 90,
	x: 88,
	c: 67,
	v: 86,
	space: 32,
	esc: 27,
	enter: 13,
	backspace: 8,
	tab: 9,
	shift: 16,
	ctrl: 17,
	alt: 18,
	1: 49,
	2: 50,
	3: 51
});

(function () {
	var that = {},
		player, bgcolor, debug,
		test, mapDisplay,
		solids, stats;
	
	bgcolor = new Layer({draw:function (c) {
		c.fillStyle = 'black';
		c.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
	}, viewport: VIEWPORT, z:-1 });
	
	debug = new Layer({draw:function (c) {
		c.fillStyle = 'white';
		c.font = '12pt Arial';
		
		c.fillText('X:'+player.pos.getX(), 0, 20);
		c.fillText('Y:'+player.pos.getY(),0, 40);
		c.fillText('X:'+player.x1, 200, 20);
		c.fillText('Y:'+player.y1, 200, 40);
		c.fillText('X:'+player.grid.getcx(player.x1), 400, 20);
		c.fillText('Y:'+player.grid.getcy(player.y1), 400, 40);
		c.fillText(player.id, 600, 20);
		c.fillText('xspeed:'+player.xspeed, 0, 60);
		c.fillText('yspeed:'+player.yspeed, 0, 80);
		
		if (that.collide) {
			c.fillText('collision', 600, 20);
		}
	}, viewport: VIEWPORT, z:100 });
	
	grid = new CollisionGrid({
		gridw: 740,
		gridh: 500,
		cellw: 120,
		cellh:125,
		
		context: 'global',
		priority: 85
	});
	
	player = new Actor({
		grid: grid,
		pos: $V([400, 140]),
		z: 1,
		
		top: -140,
		bottom: 0,
		left: -20,
		right: 20,
		
		sprites:{ square: {
			pos: $V([-20, -80]),
			viewport: VIEWPORT,
			draw: function (c, viewX, viewY, count) {
				c.translate(this.parent.pos.getX(), this.parent.pos.getY());
				c.fillStyle = 'white';
				c.fillRect(this.pos.getX(), this.pos.getY(), 30, 80);
			}
		} },
		
		shapes:{ bulk: {
			type: 'box',
			pool: 'global',
			pos: $V([-20, -150]),
			width: 40,
			height: 150
		} }
	});
	extend(player, {
		id: 'jess',
		velocity: Vector.Zero(2),
		jumpState: 'walk',
		dashState: 'ready',
		stats: {
		//jess:
		// speed med, but relatively faster run
		// jump bit lower than megan, swing hook, umbrella (ride thermals)
		// grav high
		// max grav high
		// range med
		// recharge low
		// attack low
		// juice high
		// whelm high
		// wide phys and stun attack
		// fire
		//megan:
		// speed high
		// jump high, wall stick+jump, floaty
		// grav low
		// max grav low
		// range low
		// recharge high
		// attack high
		// juice low
		// whelm low
		// combo phys and no stun attack, air attack
		// phys stronger than normal
		// water
		//kate:
		// speed low
		// jump low, double jump, jetpack, backflip
		// grav high
		// max grav mid
		// range high
		// recharge med
		// attack med
		// juice med
		// whelm med
		// no phys attack
		// electricity
			
			jess: {
				fightVel: 4.1,
				flightVel: 8.75,
				skidVel: null,
				skidTime: null,
				
				jumpVel: null,
				ftJumpVel: null,
				flJumpVel: null,
				gravity: null,
			}
		
//			jess: {
//				ftVel: 4.1,
//				flAcc: 4/14,
//				
//				deacc: 10/21,
//				turnAcc: 4/14,
//				maxVel: 8.75,
//				
//				jmpVel: -14,
//				airAcc: 9/14,
//				maxAirVel: 5
//			}, 
//			kate: {
//				ftVel: 3.2,
//				flAcc: 6/14,
//				
//				deacc: 16/21,
//				turnAcc: 5/14,
//				maxVel: 8,
//				
//				jmpVel: -13,
//				airAcc: 7/14,
//				maxAirVel: 4.5
//			},
//			megan: {
//				ftVel: 4.8,
//				flAcc: 5/14,
//				
//				deacc:8/21,
//				turnAcc: 3/14,
//				maxVel: 9.5,
//				
//				jmpVel: -15,
//				airAcc: 5/14,
//				maxAirVel: 4
//			}
		},
		
		step: TRIGGER.subscribe({
			trigger: 'step',
			context: 'global',
			obj: player,
			func: function () {
				that.collide = false;
				
				this.moveQueue.pushRel(this.velocity.dup(), null);
				
				return this.move();
			},
			priority: 50
		}),
		ftLeft: INPUT.request({
			input: 'leftHold',
			context: 'global',
			obj: player,
			func: function () {
				this.velocity = this.velocity.subtract($V([this.stats[this.id].fightVel,0]));
			},
			priority: 50
		}),
		ftLeftStop: INPUT.request({
			input: 'leftUp',
			context: 'global',
			obj: player,
			func: function () {
				this.velocity = this.velocity.add($V([this.stats[this.id].fightVel,0]));
			},
			priority: 50
		}),
		ftRight: INPUT.request({
			input: 'rightHold',
			context: 'global',
			obj: player,
			func: function () {
				this.velocity = this.velocity.add($V([this.stats[this.id].fightVel,0]));
			},
			priority: 50
		}),
		ftRightStop: INPUT.request({
			input: 'rightUp',
			context: 'global',
			obj: player, 
			func: function () {
				this.velocity = this.velocity.subtract($V([this.stats[this.id].fightVel,0]));
			},
			priority: 50
		}),
			
	});
	
	
	
	
	test = new Actor({
		pos: $V([150, 100]),
		
		grid: grid,
		
		sprites: { square: {
			pos: $V([0, 0]),
			viewport: VIEWPORT,
			draw: function (c, viewX, viewY, count) {
				c.translate(this.parent.pos.getX(), this.parent.pos.getY());
				c.fillStyle = 'white';
				c.fillRect(this.pos.getX(), this.pos.getY(), 100, 20);
			}
		} },
		shapes:{ wall: {
			type: 'box',
			pool: 'global',
			pos: $V([50, 10]),
			width: 100,
			height: 20
		} },
		
	});
	
	grid.addCollision('global', 'global', function (a, b) {
		that.collide = true;
	});
	
	that.DIALOG = {
		
	};
	
//	that.rope = {
//		pos: $V([0, 0]),
//		
//		length: 0,
//		mass: 0,
//		
//		joints: [ ] //x, y, length
//	}; //mass * gravity * length * -sin(angle)
	
	that.player = player;
	that.grid = grid;
	
}()); //end code
/*
fishing line retraction 

x & y are relative to player
probably ought to be xhook+yhook

curlength = the pythagorean theorum;
newlength = length*(time/5);
ratio = newlength/curlength;

x *= ratio;
y *= ratio;

ctx.printxy;
*/

//delay wall removal for walljump
//toggle platforms
//many projectile enemies