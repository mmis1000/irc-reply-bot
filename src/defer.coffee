{EventEmitter} = require 'events'

uuid = ->

  s4 = ->
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring 1

  s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()

# emit done (Array buffered_error, Array buffered_result)

class Defer extends EventEmitter
  constructor: ()->
    @tasklist = []
    @results = []
    @errors = []
    
    @timeout = 20 * 1000 # 20 seconds
  
  async: (display = null)->
    task = {}
    task.uuid = uuid()
    
    display = "unnamed task #{task.uuid}" if display is null
    
    task.display = display
    task.result = null
    
    task.finished = false # only when correct
    task.error = null # when timeout
    task.done = false # either finish or timeout
    task.clear = false
    
    @tasklist.push task
    
    runner = (result)=>
      if task.done isnt true
        clearTimeout timeout
        task.result = result
        task.finished = true
        task.done = true
        
        console.log "finished #{task.display}"
        
        @_checkUpTesk()
    
    onTimeout = ()=>
      task.error = new Error "timeout #{task.display}"
      task.done = true
      
      @_checkUpTesk()
      console.log 'timeout happend'
    
    timeout = setTimeout onTimeout, @timeout
    
    runner
  
  isWaiting: ()->
    @tasklist.length > 0
  
  setTimeout: (num)->
    num = Number num
    @timeout = num if num > 0 and not isNaN num
  
  addResult: (result)->
    @results.push result
    
  addError: (error)->
    @errors.push error
  
  _checkUpTesk: (uuid)->
    process.nextTick ()=>
      for task in @tasklist
        if task.done is true
          if task.finished
            if task.result?
              #console.log @, @addResult, @addError
              @addResult task.result
          else
            @addError task.error
          
          task.clear = true
      
      @tasklist = @tasklist.filter (task)->task.clear is false
      
      if @tasklist.length > 0
        return
      
      if @errors.length > 0
        @emit 'done', @errors, @results
      else
        @emit 'done', null, @results
      
      @errors = []
      @results = []


module.exports = Defer