Defer = require '../defer'

class IRouter extends Defer
  constructor: ()->
    @maxLength = 350
  
  output : (message, to)->

  input : (message, from, to, channal)->
    
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

module.exports = IRouter