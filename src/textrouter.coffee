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

module.exports = TextRouter