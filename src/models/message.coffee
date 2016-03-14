
class Message
  constructor: (@text = null, @medias, @asText = false, @asCommand = false, @asContentText = true) ->
    @medias = @medias or []
    @meta = {}

module.exports = Message


  