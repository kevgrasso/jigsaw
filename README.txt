Jigsaw is a 2D Game Engine for HTML5 Canvas
written by Kevin Grasso in Coffeescript

Requires:
<canvas>
DOM events
DOMContentLoaded
script load event
native JSON
mouse e.pagex+e.pagey
localStorage
Array.isArray()
@font-face
<audio>

have backup:
FileWriter
web audio
clipboard
document.head
WOFF fonts


Recomended browsers:
Google Chrome 6+
Mozilla Firefox 3.5+
Safari 3.2+
Opera 10.50+
Internet Explorer 9+

~CHANGELOG~
0.2:
*using Iuppiter and Sylvester libraries
*basic functionality achieved: triggers, input, layers, and collision
*mass cleanup+bug fixes
*conversion to coffeescript

0.1:
*project exists
*basic engine under construction
*basic player physics
*using pixastic library

~ROADMAP~
0.3:
*layers have contexts
*setKeys removes subscriptions to keys not a part of new key set
*Function::subscribeTo
*Actor::attach(subscribe = true)
*mass unsubscription for contexts, objs, groups, parents (collision, triggers, contextbuffer)
*game loop is entirely triggers
*change binary heaps to sorted array. option for sorting every frame + manual adjust order (sets adjustFrame = true)
*use linked list (w/ shared attrib) for tile-shape subscription
*shapes rewritten + using new collision formula
*SimpleCollision

0.4:
*MetaLayer::getAbsPosOf(Vector)
*collision::getPointData()
*mouse input

upcoming:
*map display
*map movement
*map load
*map events
*map dynamic block definitions
*gamestate saving + loading
*Dialog
*sound
*context buffers have context controls
*animation
*multi-grids
*extended sound
*map editor
*A* search?
*simple particle emitter?
*true randomizers?

