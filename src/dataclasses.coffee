#dataclasses.coffee: classes for various data types

#class window.Vector
#    constructor: (@x, @y) ->
#    @zero = -> new this(0, 0)
#    
#    @precision = 1e-6
#    @setPrecision = (@precision) ->
#    
#    x: 0
#    y: 0
#
#window.$V = Vector

class window.Polygon
    constructor: ->

#binary heap class
class window.BinaryHeap
    constructor: (@scoreName, @content = []) ->         #this class mostly written by Marijn Haverbeke:
                                			# http://eloquentjavascript.net/appendix2.html
    content: null #the heap itself
    scoreName: null#name a attribute to use as rank
    
    #adds element to heap
    push: (element) ->
        #Add the new element to the end of the array.
        @content.push element
        #Allow it to sink down.
        @sinkDown(@content.length - 1)
    
    #remove top element from heap
    pop: ->
        result = @content[0] #Store the first element so we can return it later.
        end = @content.pop() #Get the element at the end of the array.
        
        #If there are any elements left, put the end element at the
        #start, and let it bubble up.
        if @content.length > 0
            @content[0] = end
            @bubbleUp 0
        result
    
    #remove given node from the heap
    remove: (node) ->
        #To remove a value, we must search through the array to find it.
        for v, i in @content when v is node
                #When it is found, the process seen in 'pop' is repeated
                #to fill up the hole.
                end = @content.pop()
                if i isnt @content.length - 1
                    @content[i] = end
                    if end[@scoreName] < node[@scoreName]
                        return @sinkDown i
                    else
                        return @bubbleUp i
                else return end
        throw new Error "Node not found."
    
    #returns heap size
    size: ->
        @content.length
    
    #sink down the element at position n until at proper spot
    sinkDown: (n) ->
        #Fetch the element that has to be sunk.
        element = @content[n]
        #When at 0, an element can not sink any further.
        while n > 0
            #Compute the parent element's index, and fetch it.
            parentN = Math.floor((n + 1) / 2) - 1
            parent = @content[parentN]
            #Swap the elements if the parent is greater.
            if element[@scoreName] < parent[@scoreName]
                @content[parentN] = element
                @content[n] = parent
                #Update 'n' to continue at the new position.
                n = parentN
            else #Found a parent that is less, no need to sink any further.
                break
        undefined
    
    #bubble up the element at position n until at proper spot
    bubbleUp: (n) ->
        #Look up the target element and its score.
        length = @content.length
        element = @content[n]
        elemScore = element[@scoreName]

        loop
            #Compute the indices of the child elements.
            child2N = (n + 1) * 2
            child1N = child2N - 1
            #This is used to store the new position of the element, if any.
            swap = null
            #If the first child exists (is inside the array)...
            if child1N < length
                #Look it up and compute its score.
                child1 = @content[child1N]
                child1Score = child1[@scoreName]
                #If the score is less than our element's, we need to swap.
                if child1Score < elemScore
                    swap = child1N
            #Do the same checks for the other child.
            if child2N < length
                child2 = @content[child2N]
                child2Score = child2[@scoreName]
                if child2Score < (swap is if null then elemScore else child1Score)
                    swap = child2N

            #If the element needs to be moved, swap it, and continue.
            if swap isnt null
                @content[n] = @content[swap]
                @content[swap] = element
                n = swap
            else #Otherwise, we are done.
                break
        undefined
    
    #returns duplicate of current heap state
    copy: ->
        new BinaryHeap(@scoreName, @content[0...])