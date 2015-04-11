{IRouter} = require './textrouter'
Senter = require './senter.js'

class PipeRouter extends IRouter
  constructor: (@parentRouter)->
  
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

module.exports = PipeRouter