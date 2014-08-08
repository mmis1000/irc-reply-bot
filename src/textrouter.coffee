{EventEmitter} = require 'events'
Senter = require './senter.js'
class TextRouter extends EventEmitter
  constructor: ()->
  
  output : (message, to)->
    if Array.isArray message
      for item in message
        @emit "output", item, to
    else
      @emit "output", message, to
  input : (message, from, to, channal)->
    senter = new Senter from, to, message, channal
    @emit "input", message, senter

module.exports = TextRouter