{EventEmitter} = require 'events'
Q = require 'q'

uuid = ->

  s4 = ->
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring 1

  s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()

# emit error   Error error
# emit done    Task task
# emit finish  Task task
# emit clear   Array buffered_error, Array buffered_result

class _Task
  constructor: (display)->
    @uuid = uuid()
    
    if not display?
      # console.log (new Error).stack
      display = "unamed task created at #{new Date}"
    @display = display
    @result = null
    
    @finished = false # only when correct
    @error = null # when timeout
    @done = false # either finish or timeout
    @clear = false
    

class Defer extends EventEmitter
  constructor: ()->
    super()
    @tasklist = []
    @results = []
    @errors = []
    
    @_defered = Q.defer()
    @promise = @_defered.promise
    
    @timeout = -1 # no timeout default
    
  async: (display = null)->
    
    task = new _Task display
    
    @tasklist.push task
    
    runner = (result)=>
      if task.done isnt true
        clearTimeout timeout
        task.result = result
        task.finished = true
        task.done = true
        
        if task.display isnt ""
          console.log "finished #{task.display}"
        
        @_checkUpTesk()
    
    onTimeout = ()=>
      task.error = new Error "timeout #{task.display}"
      task.error.type = "task_timeout"
      task.done = true
      
      
      @_checkUpTesk()
      console.log "timeout happend #{task.display}"
    if @timeout isnt -1
      timeout = setTimeout onTimeout, @timeout
    
    runner
  
  isWaiting: ()->
    @tasklist.length > 0
  
  setTimeout: (num)->
    num = Number num
    @timeout = num if num > 0 and not isNaN num
  
  addResult: (result)->
    @results.push result
    
  getResults: ()->
    @transformResults @results.slice 0
    
  dropResults: ()->
    originalResults = @results
    @results = []
    originalResults
    
  addError: (error)->
    @errors.push error
  
  getErrors: ()->
    @errors.slice 0
    
  dropErrors: ()->
    originalErrors = @errors
    @errors = []
    originalErrors
  
  hasError: ()->
    @errors.length > 0
    
  #implement by subclass to transform result into rhe form you need
  transformResults: (res)-> res 
  
  forceCheck: ()->
    process.nextTick @_checkUpTesk.bind @
  
  _checkUpTesk: ()->
    process.nextTick ()=>
      for task from @tasklist
        if task.done is true
          @emit 'done', task
          if task.finished
            @emit 'finish', task
            if task.result?
              #console.log @, @addResult, @addError
              @addResult task.result
          else
            @addError task.error
            @emit 'error', task.error
            
          task.clear = true
      
      @tasklist = @tasklist.filter (task)->task.clear is false
      
      if @tasklist.length > 0
        return
      
      if @hasError()
        @_defered.reject {
          error: @getErrors(),
          result: @getResults()
        }
        @emit 'clear', @getErrors(), @getResults()
      else
        @_defered.resolve {
          error: null,
          result: @getResults()
        }
        @emit 'clear', null, @getResults()
      
      @dropErrors()
      @dropResults()


module.exports = Defer