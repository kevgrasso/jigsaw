Jigsaw is a 2D Game Engine for HTML5 Canvas
written by Kevin Grasso in Coffeescript

~CHANGELOG~
0.3:
*layers have contexts
*setKeys removes subscriptions to keys not a part of new key set
*mass unsubscription for contexts, objs, groups, parents (collision, triggers, surface)
*changed binary heaps to sorted arrays
*shapes rewritten + using new SAT collision formula
*new LoadTracker class
*Pixastic library removed
*iuppiter library removed
*stateBlacklist for Trigger.fireTrigger-- hold inputs won't fire multiple times
*collisions won't detect intersections multiple times
*other bugfixes

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
0.4:
-MetaLayer::getAbsPosOf(Vector)
-collision::getPointData()
-mouse input
-Actor::attach(subscribe = true)
-init moved to Context
-grid is spatial hash
-SimpleCollision
-circle type shapes supported again
-shortcut shape definitions
-keyboard input xUp to xLift (xDown too?)
-change surface images to layers
-auto-calculation of dimensions for actors

upcoming:
*map display
*map movement
*map load
*map flags
*map dynamic block definitions
*multi-maps
*loadTracker is mass loader
*Dialog
*sound mixer
*animation
*multi-grids
*extended sound
*map editor
*A* search?
*simple particle emitter?
*true randomizers?

