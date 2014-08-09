{EventEmitter} = require 'events'
Senter = require './senter.js'
class TextRouter extends EventEmitter
  constructor: ()->
    @maxLength = 100
  output : (message, to)->
    if Array.isArray message
      message = message.join "\n"
    message = message.split /(?:\r\n|\n)/g
    result = true
    while result
      result = false
      index = 0
      while index < message.length
        if message[index].length > @maxLength
          segA = message[index].substring(0, @maxLength)
          segB = message[index].substring(@maxLength)
          message.splice index, 1, segA, segB
          result = true
        index++
    
    for item in message
      @emit "output", item, to
  input : (message, from, to, channal)->
    senter = new Senter from, to, message, channal
    @emit "input", message, senter

module.exports = TextRouter