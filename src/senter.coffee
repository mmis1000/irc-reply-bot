class Sender
  constructor: (@sender, @target, @text, @channel)->
  
  toString: ()->
    @sender
module.exports = Sender