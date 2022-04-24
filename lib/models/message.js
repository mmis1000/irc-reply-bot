(function() {
  var Message;

  Message = class Message {
    constructor(text = null, medias, asText = false, asCommand = false, asContentText = true) {
      this.text = text;
      this.medias = medias;
      this.asText = asText;
      this.asCommand = asCommand;
      this.asContentText = asContentText;
      this.replyTo = null;
      this.forwardFrom = null;
      this.textFormat = "irc";
      this.textFormated = this.text;
      
      // for new api
      this.medias = this.medias || [];
      this.meta = {};
    }

  };

  module.exports = Message;

}).call(this);
