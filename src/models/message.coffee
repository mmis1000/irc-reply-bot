
class Message
  constructor: (@text = null, @medias, @asText = false, @asCommand = false, @asContentText = true) ->
    @replyTo = null;
    @forwardFrom = null;
    
    @medias = @medias or []
    @meta = {}
    
    
module.exports = Message
