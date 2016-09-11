(function() {
  var Sender;

  Sender = (function() {
    function Sender(sender, target, text, channel) {
      this.sender = sender;
      this.target = target;
      this.text = text;
      this.channel = channel;
      this.senders = [this.sender];
      this.photo = null;
      this.meta = null;
    }

    Sender.prototype.toString = function() {
      return this.sender;
    };

    Sender.prototype.getMetadata = function() {
      return this;
    };

    return Sender;

  })();

  module.exports = Sender;

}).call(this);
