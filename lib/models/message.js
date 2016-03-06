(function() {
  var Message;

  Message = (function() {
    function Message(text, medias, asText, asCommand) {
      this.text = text != null ? text : null;
      this.medias = medias;
      this.asText = asText != null ? asText : false;
      this.asCommand = asCommand != null ? asCommand : false;
      this.medias = this.medias || [];
      this.meta = {};
    }

    return Message;

  })();

  module.exports = Message;

}).call(this);
