class Sender
  constructor: (@sender, @target, @text, @channel)->
    
    @senderInfo = null
    @targetInfo = null
    @channelInfo = null
    
  toString: ()->
    @sender
module.exports = Sender