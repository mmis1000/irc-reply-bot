
class Message
  constructor: (@text = null, @medias, @asText = false, @asCommand = false, @asContentText = true) ->
    @replyTo = null;
    @forwardFrom = null;
    
    # v2 format for multi plaform support
    @textFormat = "irc"
    @textFormated = @text
    
    # for new api
    @medias = @medias or []
    @meta = {}
    
    
module.exports = Message
