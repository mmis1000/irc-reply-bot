Defer = require '../defer'

class IRouter extends Defer
  constructor: ()->
    super
    @maxLength = 350
  
  output : (message, to)->
  
  outputMessage: (message, to)->
  
  input : (message, from, to, channal)->
    
  inputMessage : (message, from, to, channal)->
    
  inputMe : (message, from, to, channal)->
  
  whois : (user, callback)->
    
  names : (channal, callback)->
  
  notice : (nick, message)->
    
  raw : (args...)->
  
  rplRaw : (reply)->
  
  rplJoin : (channel, nick)->
  
  setSelfName : (name)->
  
  getSelfName : (name)->
  
  setChannels : (channels)->
  
  getChannels : (channels)->

  getRouterIdentifier : ()->
    
  toDisplayName: (str)-> str.replace /@.*/, ''
  
  fromDisplayName: (str)-> str
  
  isCommand: (str)-> throw new Error 'not implement'
  
  parseArgs: (str)-> throw new Error 'not implement'
  
  getSelfInfo: ()->
  
module.exports = IRouter