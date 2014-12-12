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
    senter = new Senter from, to, message, channal
    @emit "input", message, senter

  whois : (user, callback)->
    @emit "whois", user, callback
    
  names : (channal, callback)->
    @emit "names", channal, callback

  raw : (args...)->
    if args.length == 1 && Array.isArray args[0]
      args = args[0]
    
    @emit "raw", args

  rplRaw : (reply)->
    @emit "rpl_raw", reply

module.exports = TextRouter