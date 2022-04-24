IRouter = require './irouter'
Senter = require '../senter.js'
Defer = require '../defer'
TextRouter = require './textrouter'

class PipeRouter extends IRouter
  constructor: (@parentRouter)->
    super()
    
    # proxy methods
    for key, value of TextRouter.prototype
      if not PipeRouter.prototype.hasOwnProperty key
        if not Defer.prototype[key]
          if 'function' is typeof value
            @[key] = @parentRouter[key].bind @parentRouter
        if Defer.prototype[key] && @hasOwnProperty key
          delete @[key]
    
  output : (message, to)->
    @addResult
      type : 'output'
      message : message
      to : to
  
  outputMessage : (message, to)->
    @addResult
      type : 'outputMessage'
      message : message
      to : to
    false
    
  transformResults : (res)->
    output = []
    for result in res
      if result.type is 'output'
        if Array.isArray typeof result.message
          output.push result.message.join "\r\n"
        else
          output.push result.message
      if result.type is 'outputMessage'
        output.push result.message.text
    output.join '\r\n'
  
  getRouterIdentifier : ()->
    return null

module.exports = PipeRouter