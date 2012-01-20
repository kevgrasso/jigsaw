###
JIGSAW HTML5 GAME LIBRARY
Most code by Kevin Grasso
###
   
#functions.coffee: assorted useful functions

#I think this allows a few more versions of Opera
document.head ?= document.getElementsByTagName('head')[0]

#class Class
#   this::extend(mixins)

#class/object functions


#appends source object's attributes to the target object
window.extend = (arg...) -> #([depth,] target, src1[, srcN])
    if typeof arg[0] is 'bool'
        {0:depth, 1: target, 2:src, 3:multi} = arg
    else
        depth = false
        {0: target, 1:src, 2:multi} = arg
    
    target[k] = v for own k, v of src #normal copy
    if multi?
        arg.splice((unless depth then 1 else 2), 1)
        extend(arg...) #remove src just copied
    target

#loads and runs external script from /include/
window.include = (filename) -> #TODO: allow hard refresh of scripts to be
    head = document.head       #      dynamically loaded
    e = document.createElement('script')

    cleanup = ->
        if @readyState is 'complete'
            #Plugs IE memory leak-- it's even there in IE9!
            e.removeEventListener('onload', cleanup, false)
            head.removeChild e
    #all browsers should call this when script is finished
    #and ready for cleanup
    e.addEventListener('onload', cleanup, false)
    
    #load script
    e.type = 'application/javascript'
    e.charset = 'utf-8'
    e.src = "lib/include/#{filename}.js"
    head.appendChild e

#creates and returns a new HTML Canvas context for drawing to/from
window.createFramebuffer = (w, h) ->
    canvas = document.createElement 'CANVAS'
    canvas.setAttribute 'width', w
    canvas.setAttribute 'height', h

    canvas.getContext '2d'

#retrieves the current time in miliseconds
window.getTime = ->
    (new Date()).getTime()
    
window.isNumeric = (num) ->
    not isNaN(parseFloat(num)) and isFinite(num)

#returns a random rumber between low and (just below) high
window.randomNum = (low, high) ->
    Math.random()*(high-low)+low

#returns an integer between low and high
window.randomInt = (low, high) ->
    Math.floor(randomNum(low, high+1))
    
do ->
    count = 0 #ticker for generating unique numbers
    
    #generates a new unique number
    window.getUniqueNum = ->
        count += 1

# Object prototype functions

#clones object contents to new object
Object::clone = (args...) ->
    args.splice((unless typeof args[0] is 'bool' then 0 else 1), 0, {}, this)
    extend(args...)

#object oriented version of extend function
Object::extend = (args...) ->
    args.splice((unless typeof args[0] is 'bool' then 0 else 1), 0, this)
    extend(args...)

Object::objectID = null #cache storing for object's unique ID
Object::getID = -> #returns object's unique ID, generating it if neccessary 
    @objectID = getUniqueNum().toString() if not @hasOwnProperty 'objectID'
    
    @objectID

#returns true if object has no contents
Object::isEmpty = ->
    exemptions = {}

    exemptions[v] = true for v in arguments
    return no for own k in this when not exemptions[k]
    yes

#returns true if given value is part of an object
Object::hasValue = (value) ->
    return yes for own k of this when this[k] is value
    no

#returns first key found corresponding to a given value
Object::getKey = (value) ->
    return k for own k of this when this[k] is value
    undefined
    
Array::clone = ->
    @slice(0)

Array::remove = (value) ->
    @splice(@indexOf(value), 1)

#returns a random entry
Array::getRandom = ->
    this[randomInt(0,@length-1)]

#wipes the context blank
CanvasRenderingContext2D::clear = ->
    @clearRect 0, 0, @canvas.width, @canvas.height