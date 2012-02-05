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
window.extend = (args...) -> #([depth,] target, src1[, srcN])
    if typeof args[0] is 'boolean'
        {0:depth, 1: target, 2:source, 3:moreSource} = args
        nextSources = args[3...args.length]
    else
        {0: target, 1:source, 2:moreSource} = args
        depth = false
        nextSources = args[2...args.length]
    
    target[key] = value for own key, value of source #normal copy
    if moreSource?
        extend(depth, target, nextSources...) #remove src just copied
    target

#loads and runs external script from /include/
window.include = (filename) -> #TODO: allow hard refresh of scripts to be
    head = document.head       #      dynamically loaded
    scriptElement = document.createElement('script')

    cleanup = ->
        if @readyState is 'complete'
            #Plugs IE memory leak-- it's even there in IE9!
            scriptElement.removeEventListener('onload', cleanup, false)
            head.removeChild scriptElement
    #all browsers should call this when script is finished
    #and ready for cleanup
    scriptElement.addEventListener('onload', cleanup, false)
    
    #load script
    scriptElement.type = 'application/javascript'
    scriptElement.charset = 'utf-8'
    scriptElement.src = "lib/include/#{filename}.js"
    head.appendChild scriptElement

#creates and returns a new HTML Canvas context for drawing to/from
window.createFramebuffer = (width, height) ->
    canvasElement = document.createElement 'CANVAS'
    canvasElement.setAttribute 'width', width
    canvasElement.setAttribute 'height', height

    canvasElement.getContext '2d'

#retrieves the current time in miliseconds
window.getTime = ->
    (new Date()).getTime()

#returns whether arguement is a number or numeric string
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
Object::isEmpty = (args...) ->
    exemptions = {}

    exemptions[key] = true for key in args
    return no for own key in this when not exemptions[key]
    yes

#returns true if given value is part of an object
Object::hasValue = (value) ->
    return yes for own key of this when this[key] is value
    no

#returns first key found corresponding to a given value
Object::getKey = (value) ->
    return key for own key of this when this[key] is value
    undefined

#returns duplicate of  the array
Array::clone = ->
    @slice(0)

#removes first instance of the given value from the array
Array::remove = (value) ->
    @splice(@indexOf(value), 1)

#mixes up order of values
Array::randomize = ->
    values = {}
    order = []
    for value in this
        num = Math.random()
        while values[num]? then num = Math.random()
        values[num] = value
        order.push(num)
    order.sort()
    for num, index in order
        this[index] = values[num]
        
        

#returns a random entry
Array::getRandom = ->
    this[randomInt(0,@length-1)]