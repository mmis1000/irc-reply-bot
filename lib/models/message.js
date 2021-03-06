(function() {
  var Message;

  Message = (function() {
    function Message(text, medias, asText, asCommand, asContentText) {
      this.text = text != null ? text : null;
      this.medias = medias;
      this.asText = asText != null ? asText : false;
      this.asCommand = asCommand != null ? asCommand : false;
      this.asContentText = asContentText != null ? asContentText : true;
      this.replyTo = null;
      this.forwardFrom = null;
      this.textFormat = "irc";
      this.textFormated = this.text;
      this.medias = this.medias || [];
      this.meta = {};
    }

    return Message;

  })();

  module.exports = Message;

}).call(this);
