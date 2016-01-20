IRouter = require '../irouter'
Senter = require '../senter.js'

class PipeRouter extends IRouter
  constructor: (@parentRouter)->
    super
  
  output : (message, to)->
    @addResult
      type : 'output'
      message : message
      to : to
  
  whois : (user, callback)->
    @parentRouter.emit "whois", user, callback
    
  names : (channal, callback)->
    @parentRouter.emit "names", channal, callback
    
  raw : (args...)->
    if args.length == 1 && Array.isArray args[0]
      args = args[0]
    
    @addResult
      type : 'raw'
      message : args
      to : null
  
  input : (message, from, to, channal)->
    sender = new Senter from, to, message, channal
    @parentRouter.emit "input", message, sender
    
  inputMe : (message, from, to, channal)->
    sender = new Senter from, to, message, channal
    @parentRouter.emit "input_me", message, sender
  
  setSelfName : (name)->
    @parentRouter.setSelfName name
  
  getSelfName : (name)->
    @parentRouter.getSelfName()
  
  setChannels : (channels)->
    @parentRouter.setChannels channels
  
  getChannels : (channels)->
    @parentRouter.getChannels channels
  
  transformResults : (res)->
    output = []
    for result in res
      if result.type is 'output'
        if Array.isArray typeof result.message
          output.push result.message.join "\r\n"
        else
          output.push result.message
    output.join '\r\n'
  
  getRouterIdentifier : ()->
    return null
module.exports = PipeRouter