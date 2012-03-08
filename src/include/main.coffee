#Jigsaw test
#Kevin Grasso

Viewport.setFrameLength 1000/20
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
    draw: (context) ->
        context.fillStyle = 'black'
        context.fillRect(0, 0, Viewport.width, Viewport.height)
    viewport: Viewport
    z:-1

collide = no
debug = new Layer
    draw: (context) ->
        context.fillStyle = 'white'
        context.font = '12pt Arial'

        context.fillText("X:#{player.pos.getX()}", 0, 20)
        context.fillText("Y:#{player.pos.getY()}",0, 40)
        context.fillText("TL:#{player.topLeftCell?.gridPos.inspect()}", 100, 20)
        context.fillText("BL:#{player.bottomLeftCell?.gridPos.inspect()}", 100, 40)
        context.fillText("TR:#{player.topRightCell?.gridPos.inspect()}", 200, 20)
        context.fillText("BR:#{player.bottomRightCell?.gridPos.inspect()}", 200, 40)
        context.fillText("#{player.id}", 600, 20)

        context.fillText("eject:#{collide}", 600, 40)
    viewport: Viewport
    z:100

grid = new CollisionGrid
    cellSize: $V [225, 225]

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
                    state: 'global'
                    draw: (context, viewX, viewY, count) ->
                        context.translate @parent.pos.getX(), @parent.pos.getY()
                        context.fillStyle = 'white'
                        context.fillRect(@pos.getX(), @pos.getY(), 40, 80)

            shapes:
                bulk:
                    type: 'box'
                    pool: 'global'
                    vertices: [$V([-20, -80]), $V([20, -80]), $V([20, 0]), $V([-20, 0])]
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
        Input.register trigSpec.clone
            input: 'upHold'
            func: @ftUp
        Input.register trigSpec.clone
            input: 'upUp'
            func: @ftUpStop
        Input.register trigSpec.clone
            input: 'downHold'
            func: @ftDown
        Input.register trigSpec.clone
            input: 'downUp'
            func: @ftDownStop

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
    ftUp: ->
            @velocity = @velocity.subtract $V([0,4])
    ftUpStop: ->
            @velocity = @velocity.add $V([0,4])
    ftDown: ->
            @velocity = @velocity.add $V([0,4])
    ftDownStop:  ->
            @velocity = @velocity.subtract $V([0,4])

test = new Actor
    pos: $V [120, 100]
		
    grid: grid
		
    sprites:
        square:
            pos: $V [0, 0]
            viewport: Viewport
            state: 'global'
            draw: (context, viewX, viewY, count) ->
                context.translate @parent.pos.getX(), @parent.pos.getY()
                context.fillStyle = 'white'
                context.fillRect(@pos.getX(), @pos.getY(), 100, 20)
    shapes:
        wall:
            type: 'box'
            pool: 'global'
            vertices: [$V([0, 0]), $V([100, 0]), $V([100, 20]), $V([0, 20])]
	
grid.addCollision 'global', 'global', (a, b, eject) ->
    collide = if eject then "#{eject.inspect()}" else 'no'
	
	
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