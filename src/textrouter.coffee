{EventEmitter} = require 'events'
Senter = require './senter.js'
{UTF8LengthSplit} = require './util.js'

class TextRouter extends EventEmitter
  constructor: ()->
    @maxLength = 350
  
  output : (message, to)->
    if Array.isArray message
      message = message.join "\n"
    message = message.split /(?:\r\n|\n)/g
    
    temp = []
    
    for text in message
      temp = temp.concat UTF8LengthSplit text, @maxLength
    
    #console.log temp
    #console.log temp.length
    
    for item in temp
      @emit "output", item, to
    
  input : (message, from, to, channal)->
    sender = new Senter from, to, message, channal
    @emit "input", message, sender
    
  inputMe : (message, from, to, channal)->
    sender = new Senter from, to, message, channal
    @emit "input_me", message, sender
  
  whois : (user, callback)->
    @emit "whois", user, callback
    
  names : (channal, callback)->
    @emit "names", channal, callback
  
  notice : (nick, message)->
    @emit "notice", nick, message
    
  raw : (args...)->
    if args.length == 1 && Array.isArray args[0]
      args = args[0]
    
    @emit "raw", args
  
  rplRaw : (reply)->
    @emit "rpl_raw", reply
  
  rplJoin : (channel, nick)->
    sender = new Senter nick, channel, null, channel
    @emit "rpl_join", channel, sender

module.exports = TextRouter