//Jigsaw test
//Kevin Grasso

//EVENT:
//!!simplify to bucket/priority system
//
//ACTOR:
//any other changes to the moveQueue system (have map in mind)
//combine shapes and sprites into attrib?
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
//load maps from json
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

//for rewrite:
//--get rid of unnessessary upvars in collision
//--put intersection test into shapes
//shape has ejection fuction
//--setup VIEWPORT properly
//remove FRAGMENT
//triggers with expiration times
//buffered input

//---later---
//VIEWPORT:
//--replace heap with more efficent one
//
//ACTOR:
//actors larger than cells
//
//GRID:
//multi-resolution cells
//chunk loading/unloading
//
//OTHER:
//matrix2d class
//pause on Window losing focus

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
INPUT.setKeys({27: 'esc', 49: '1', 50: '2', 51: '3', 39: 'right', 38: 'up', 37: 'left', 40: 'down', 65: 'a', 87: 'w', 83: 's', 68: 'd', 32: 'space'});

(function () {
	var jig = DATA.jigsaw,
		that = DATA.boot,
		player, bgcolor, debug,
		test, mapDisplay,
		solids;
	
	bgcolor = new jig.Layer({draw:function (c) {
		c.fillStyle = 'black';
		c.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
	}, z:-1 });
	bgcolor.activate();
	
	debug = new jig.Layer({draw:function (c) {
		
		c.fillStyle = 'white';
		c.font = '12pt Arial';
		
		c.fillText('X:'+player.x, 0, 20);
		c.fillText('Y:'+player.y,0, 40);
		c.fillText('X:'+player.x1, 200, 20);
		c.fillText('Y:'+player.y1, 200, 40);
		c.fillText('X:'+player.grid.getcx(player.x1), 400, 20);
		c.fillText('Y:'+player.grid.getcy(player.y1), 400, 40);
		c.fillText(player.id, 600, 20);
		c.fillText('xspeed:'+player.xspeed, 0, 60);
		c.fillText('yspeed:'+player.yspeed, 0, 80);
		
		if (DATA.collide) {
			c.fillText('collision', 600, 20);
		}
		
	}, z:100 });
	debug.activate();
	
	grid = new jig.Grid(740, 500, 120, 125);
	
	player = new jig.Actor({
		x: 400,
		y: 330,
		z: 1,
		grid: grid,
		
		top: -140,
		bottom: 0,
		left: -20,
		right: 20,
		
		sprites:{ square: new Sprite ({
			relx: -20,
			rely: -80,
			draw: function (c, viewX, viewY, count) {
				c.translate(this.parent.x, this.parent.y);
				c.fillStyle = 'white';
				c.fillRect(this.relx, this.rely, 30, 80);
			}
			
		})
	},
		shapes:{ bulk:{
			type: 'box',
			pool: 'global',
			relx: -20,
			rely: -150,
			width: 40,
			height: 150
		} }
	});
	
	player.id = 'jess';
	player.xspeed = 0;
	player.yspeed = 0;
	player.jumpState = 'walk';
	player.dashState = 'ready';
	DATA.stats = {
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
		
		neostyle: {
			flightVel: null,
			fightVel: null,
			dashVel: null,
			dashWarp: null,
			slowVel: null,
			slowTime: null,
			
			jumpType: null,
			jumpVel: null,
			gravAcc: null,
			jumpDeacc: null,
			
			rechargeIdleRate: null,
			rechangeFlightRate: null,
			rechargeFightRate: null,
			rechargeAttackRate:null,
			rechargeDelay: null,
			
			physType: null,
			range: null,
			element: null
			//todo: unique hitboxes?
		},
	
		jess: {
			ftVel: 4.1,
			flAcc: 4/14,
			
			deacc: 10/21,
			turnAcc: 4/14,
			maxVel: 8.75,
			
			jmpVel: -14,
			airAcc: 9/14,
			maxAirVel: 5
		}, 
		kate: {
			ftVel: 3.2,
			flAcc: 6/14,
			
			deacc: 16/21,
			turnAcc: 5/14,
			maxVel: 8,
			
			jmpVel: -13,
			airAcc: 7/14,
			maxAirVel: 4.5
		},
		megan: {
			ftVel: 4.8,
			flAcc: 5/14,
			
			deacc:8/21,
			turnAcc: 3/14,
			maxVel: 9.5,
			
			jmpVel: -15,
			airAcc: 5/14,
			maxAirVel: 4
		}
	};
	
	player.step = function () {
		var stats,
			xVel,
			flightKey = 'neutral',
			fightKey = 'neutral',
			airKey = 'neutral',
			jumpStart = false,
			jumpKey = false,
			dashKey = false,
		
			dirKey = 'neutral',
			dirSign;
		
		
		//PHYSICS
		//warning: this info is obsolete
		//24 frames to max  (1.20 seconds)
		//17 frames to stop (0.85 seconds)
		//08 frames to turn (0.40 seconds)
		//
		//xx.x pixels to max?
		//xx.x pixels to stop?
		//xx.x pixels to turn?
		
		DATA.collide = false;
		
		if (INPUT.state[1]) {
			this.id = 'jess';
		} else if (INPUT.state[2]) {
			this.id = 'kate';
		} else if (INPUT.state[3]) {
			this.id = 'megan';
		}
		stats = DATA.stats[this.id];
		
		if (INPUT.state.up || INPUT.state.w) {
			if ((INPUT.keydown.up <= 3 || INPUT.keydown.w <= 3) && !this.airborne) {
				jumpStart = true;
			}
			jumpKey = true;
		}
		if (!INPUT.state.left || !INPUT.state.right) { //if both fight keys held, they cancel out
			if (INPUT.state.right) {
				fightKey = 'right';
				if (INPUT.keydown.right === 0 && INPUT.keyup.right <= 3) {
					dashKey = true;
				}
			} else if (INPUT.state.left) {
				fightKey = 'left';
				if (INPUT.keydown.left === 0 && INPUT.keyup.left <= 3) {
					dashKey = true;
				}
			}
		}
		if (!INPUT.state.a || !INPUT.state.d) { //if both flight keys held, they cancel out
			if (INPUT.state.d) {
				flightKey = 'right';
			} else if (INPUT.state.a) {
				flightKey = 'left';
			}
		}
		
		if (jumpStart) {
			this.airborne = true;
			this.yspeed = stats.jmpVel-Math.abs(this.xspeed/7);
		}
		
		if (this.airborne) {
			if (this.yspeed < 0 && !jumpKey) {
				this.yspeed *= 0.80;
			}
			this.yspeed += (Math.E/3); //gravity
			this.moveQueue.pushRel(null, this.yspeed);
			
			if (this.y+this.yspeed >= 330) {
				this.airborne = false;
				this.yspeed = 0;
				this.moveQueue.pushAbs(null, 330);
			}
		}
	
		if (this.xspeed === 0 && flightKey === 'neutral') {
			if (fightKey !== 'neutral') {
				this.facing = fightKey;
			}
		
			if (fightKey === 'left') {
				xVel = -stats.ftVel;
			} else if (fightKey === 'right') {
				xVel = stats.ftVel;
			}
		} else {
			if (flightKey !== 'neutral') {
				this.facing = flightKey;
			}
			
			if (this.airborne) {
				if (flightKey === 'left' && this.xspeed > -stats.maxAirVel) {
					this.xspeed -= stats.airAcc;
					if (this.xspeed < -stats.maxAirVel) {
						this.xspeed = -stats.maxAirVel;
					}
				} else if (flightKey === 'right' && this.xspeed < stats.maxAirVel) {
					this.xspeed += stats.airAcc;
					if (this.xspeed > stats.maxAirVel) {
						this.xspeed = stats.maxAirVel;
					}
				}
				
				xVel = this.xspeed;
			} else {
				
				
				if (this.xspeed < 0 || (this.xspeed === 0 && flightKey === 'left')) {
					dirSign = -1;
					if (flightKey === 'left') {
						dirKey = 'forward';
					} else if (flightKey === 'right') {
						dirKey = 'reverse';
					}
				} else if (this.xspeed > 0 || (this.xspeed === 0 && flightKey === 'right')) {
					dirSign = 1;
					if (flightKey === 'right') {
						dirKey = 'forward';
					} else if (flightKey === 'left') {
						dirKey = 'reverse';
					}
				}
				
				// running
				if (dirKey === 'forward') {
						//only cap speed by acceleration at 9.
						//if they got above 9 some other way, don't touch it
					if (Math.abs(this.xspeed) < stats.maxVel) {
						this.xspeed += stats.flAcc *dirSign;
						
						if (Math.abs(this.xspeed) > stats.maxVel) {
							this.xspeed = stats.maxVel *dirSign;
						}
					}
					
				// friction/deacceleration
				} else if (dirKey !== 'forward') {
					this.xspeed -= stats.deacc *dirSign;
					if (dirKey === 'reverse') {
						this.xspeed -= stats.turnAcc *dirSign;
						
						if (Math.abs(this.xspeed) <= stats.deacc + stats.turnAcc ) {
							this.xspeed = 0;
						}
					} else if (Math.abs(this.xspeed) <= stats.deacc) {
						this.xspeed = 0;
					}
				}
				
				xVel = this.xspeed;
			}
			
		}
		this.moveQueue.pushRel(xVel, null);
		
		return this.move();
		
	};
	EVENT.subscribe('step', 'global', player, player.step);
	
	test = new DATA.jigsaw.Actor({
		x: 150,
		y: 160,
		
		grid: grid,
		
		sprites: { square: {
			relx: -6,
			rely: -40,
			draw: function (c, viewX, viewY, count) {
				c.translate(this.parent.x, this.parent.y);
				c.fillStyle = 'white';
				c.fillRect(this.relx, this.rely, 40, 12);
			}
		} },
		shapes:{ wall: {
			type: 'box',
			pool: 'global',
			relx: -50,
			rely: -10,
			width: 100,
			height: 20
		} }
		
	});
	
	COLLISION.addCollision(grid, 'global', 'global', function (a, b) {
		DATA.collide = true;
	});
	
	mapDisplay = new Layer({ //you're going to have to make it a class
		
		draw: function (c, viewX, viewY, count) {
			var i, j, tile, 
				printList = [ ],
				map = this.map;
			
			for (i = 0; i < map.gridw/map.cellw; i += 1) {
				c.save();
				for (j = 0; j < map.gridh/map.cellh; j += 1) {
					tile = this.tileSet[map[i][j].image];
					switch(typeof tile) {
					case 'object':
						c.drawImage(tile, 0, 0);
						break;
					case 'function':
						tile(c, viewX, viewY, count, i, j);
						break;
					}
					
					if (map[i][j].print) {
						printList.push(map[i][j].print);
					}
					c.translate(0, map.cellh);
				}
				c.restore();
				
				c.translate(map.cellw, 0);
			}
			
		}
	});
	
	that.Tile = {//lookups
		type: null, 	 //lslope rslope block ledge empty breakable tempbreak
		entities: null,  //crumble hurt switch onblock offblock convey door spring
		attrib: null, //if block or empty has string or image, print it
		
		makeShape: function () {
		
		},
		
		isBlocking: function (x, y) {
			x = x || 0;
			y = y || 0;
			
			switch (this.type) {
			case 'block':
			case 'breakable':
			case 'tempbreak':
			case 'hurt':
			case 'convey':
			case 'spring':
				return true; //always blocks
			case 'empty':
			case 'door':
				return false; //never blocks
				
			case 'ledge':
				return y > 0; //blocks from above
			case 'onblock':
				return this.attrib.attrib; //blocks if on
			case 'offblock':
				return !this.attrib.attrib; //blocks if off
				
			case 'lslope':
				return y > 0 || x < 0;
			case 'rslope':
				return y > 0 || x > 0;
			
			}
		}
	};
	
	that.Map = { //fix type
		moveAlong: function (x, y, dx, shape) {
			var startcell = this.getcell(x, y), // initial cell
				
				tcell = startcell, //target cell, start calculations at initial cell
				tx = x + dx, ry, //target x pos
				dir = (dx !== 0) && Math.abs(dx) / dx || 0, //direction of movement: -1 = left, 1 = right
				
				uphill = dir === -1 ? 'rslope' : 'lslope',
				downhill = dir === -1 ? 'lslope' : 'rslope';
				
			shape = shape.getBox();
			
			//if moving between cells
			while (this.getcx(rx) != tcell.x) { 
				
				if (tcell.type === uphill) { //if moving uphill
					//target cell is above and left/right of current cell
					tcell = tcell.getRelCell(dir, -1);
				} else {
					//destination cell is left/right of current cell
					tcell = tcell.getRelCell(dir, 0); 
				}
				
				if (tcell.getRelCell(0, 1).type === downhill) {  //if moving downhill
					//destination cell is below current cell, make that the target cell instead
					tcell = tcell.getRelCell(0, 1);
				}
			}
			
			while (true) {
				//determine target y pos (move into Tile)
				if (tcell.type === 'lslope') {
					y = this.cellh/this.cellw * (tcell.x1-tx);
				} else if (tcell.type === 'rslope') {
					y = this.cellh/this.cellw * (tx-tcell.x2);
				} else {
					//set target y to bottom of target cell (assume there's ground for now)
					ty = tcell.y2;
				}
			
			//future entity+tile collision goes here! if collision, recalculate y pos
			
			}
			
			return {
				x: rx,
				y: ry,
				wall: null,
				floor: null
			};
		},
		moveThrough: function (x, y, dx, dy) {
			
			
		}
	};
	
	that.SCRIPT = {
		
	};
	
	that.rope = {
		x: 0,
		y: 0,
		
		length: 0,
		mass: 0,
		
		joints: [ ] //x, y, length
	}; //mass * gravity * length * -sin(angle)
	
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