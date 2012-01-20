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
-layers have contexts
-setKeys removes subscriptions to keys not a part of new key set
-mass unsubscription for contexts, objs, groups, parents (collision, triggers, surface)
-change binary heaps to sorted arrays
*shapes rewritten + using new collision formula
-new LoadTracker class
-Pixastic library removed
-stateBlacklist for Trigger.fireTrigger-- hold inputs won't fire multiple times
-collisions won't detect intersections multiple times

0.4:
*MetaLayer::getAbsPosOf(Vector)
*collision::getPointData()
*mouse input
*Actor::attach(subscribe = true)
*init moved to Context
*grid is spatial hash
*SimpleCollision

upcoming:
*map display
*map movement
*map load
*map events
*map dynamic block definitions
*loadtracker is mass loader
*Dialog
*sound mixer
*surfaces have canvas context controls
*animation
*multi-grids
*use linked list (w/ shared attrib) for tile-shape subscription
*extended sound
*map editor
*A* search?
*simple particle emitter?
*true randomizers?

