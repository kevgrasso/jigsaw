#Jigsaw test
#Kevin Grasso

#next:
#add callPointFunction for Input.updateMouse
#cleanup shapes/fix ejectShape
#cleanup sprite (SpriteLayer)
#cleanup boot
#finish Map functions
#Input.updateMouse(): checks given CollisionGrid, either pushes SelfShape/MouseShape into Heap or checks out subgrid/viewport containing. BinaryHeap is made a
#	attribute of Input. mouse events bubble down array until false is returned. do something about moveover/out.
#	Trigger.subscribe(Shape.getTrigger('dblclick')) (based on ID)

#---later---
#
#ENTITY:
#any other changes to the moveQueue system (have map in mind)
#multi-cell entities
#
#Input:
#mouse
#*mouseon
#*mouseoff
#*mouseover
#*mousedown
#*mouseup
#*click (if mousedown over shape, then leave shape, doesn't count)
#*doubleclick (both must be fast)
#*drag
#interval
#lowup
#lowdown
#tap
#doubletap
#
#MAPS:
#MoveAlong (for walls too (for walljumps and grabbing ledges))
#MoveAcross
#
#ENEMIES:
#
#ANIMATION:
#
#ACTOR:
#
#GRID:
#multi-resolution cells
#chunk loading/unloading
#
#OTHER:
#pause on Window losing focus (throttle framerate to 2fps or lower)

#BUGS:
#test won't register collision if y ~= 255

Viewport.setFrameLength 100
Input.setKeys
    w: 87
    s: 83
    a: 65
    d: 68
    up: 38
    down: 40
    left: 37
    right: 39
    z: 90
    x: 88
    c: 67
    v: 86
    space: 32
    esc: 27
    enter: 13
    backspace: 8
    tab: 9
    shift: 16
    ctrl: 17
    alt: 18
    1: 49
    2: 50
    3: 51

bgcolor = new Layer
    draw: (c) ->
        c.fillStyle = 'black'
        c.fillRect(0, 0, Viewport.width, Viewport.height)
    viewport: Viewport
    z:-1

collide = no
debug = new Layer
    draw: (c) ->
        c.fillStyle = 'white'
        c.font = '12pt Arial'

        c.fillText("X:#{player.pos.getX()}", 0, 20)
        c.fillText("Y:#{player.pos.getY()}",0, 40)
        c.fillText("X:#{player.x1}", 200, 20)
        c.fillText("Y:#{player.y1}", 200, 40)
        c.fillText("X:#{player.grid.getCX player.x1}", 400, 20)
        c.fillText("Y:#{player.grid.getCY player.y1}", 400, 40)
        c.fillText("#{player.id}", 600, 20)
        c.fillText("xspeed:#{player.xspeed}", 0, 60)
        c.fillText("yspeed:#{player.yspeed}", 0, 80)

        c.fillText('collision', 600, 20) if collide
    viewport: Viewport
    z:100

grid = new CollisionGrid
    gridw: 740
    gridh: 500
    cellw: 120
    cellh: 125

    state: 'global'
    priority: 85

player = new class extends Actor
    constructor: ->
        super 
            grid: grid
            pos: $V [400, 140]
            z: 1

            top: -80
            bottom: 0
            left: -20
            right: 20

            sprites:
                square:
                    pos: $V [-20, -80]
                    viewport: Viewport
                    draw: (c, viewX, viewY, count) ->
                        c.translate @parent.pos.getX(), @parent.pos.getY()
                        c.fillStyle = 'white'
                        c.fillRect(@pos.getX(), @pos.getY(), 20, 80)

            shapes:
                bulk:
                    type: 'box'
                    pool: 'global'
                    pos: $V [0, -40]
                    width: 40
                    height: 80
        trigSpec =
            state: 'global'
            obj: this
            priority: 50

        Trigger.subscribe trigSpec.clone
            trigger: 'step'
            func: @step
        Input.register trigSpec.clone
            input: 'leftHold'
            func: @ftLeft
        Input.register trigSpec.clone
            input: 'leftUp'
            func: @ftLeftStop
        Input.register trigSpec.clone
            input: 'rightHold'
            func: @ftRight
        Input.register trigSpec.clone
            input: 'rightUp'
            func: @ftRightStop

    velocity: Vector.Zero(2)
    
    step: ->
            collide = no
				
            @moveQueue.pushRel(@velocity, null)
				
            @move()
    ftLeft: ->
            @velocity = @velocity.subtract $V([4,0])
    ftLeftStop: ->
            @velocity = @velocity.add $V([4,0])
    ftRight: ->
            @velocity = @velocity.add $V([4,0])
    ftRightStop:  ->
            @velocity = @velocity.subtract $V([4,0])

test = new Actor
    pos: $V [150, 100]
		
    grid: grid
		
    sprites:
        square:
            pos: $V [0, 0]
            viewport: Viewport
            draw: (c, viewX, viewY, count) ->
                c.translate @parent.pos.getX(), @parent.pos.getY()
                c.fillStyle = 'white'
                c.fillRect(@pos.getX(), @pos.getY(), 100, 20)
    shapes:
        wall:
            type: 'box'
            pool: 'global'
            pos: $V [50, 10]
            width: 100
            height: 20
	
grid.addCollision 'global', 'global', (a, b) ->
    collide = yes
	
class Dialog
	
#	rope = {
#		pos: $V([0, 0]),
#		
#		length: 0,
#		mass: 0,
#		
#		joints: [ ] //x, y, length
#	} //mass * gravity * length * -sin(angle)

#end code

#fishing line retraction 
#
#x & y are relative to player
#probably ought to be xhook+yhook
#
#curlength = the pythagorean theorum
#newlength = length*(time/5)
#ratio = newlength/curlength
#
#x *= ratio
#y *= ratio
#
#ctx.printxy

#delay wall removal for walljump
#toggle platforms
#many projectile enemies