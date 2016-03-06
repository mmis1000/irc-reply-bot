
class Message
  constructor: (@text = null, @medias, @asText = false, @asCommand = false) ->
    @medias = @medias or []
    @meta = {}

module.exports = Message


  