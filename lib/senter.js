(function() {
  var Sender;

  Sender = (function() {
    function Sender(sender, target, text, channel) {
      this.sender = sender;
      this.target = target;
      this.text = text;
      this.channel = channel;
      this.senderInfo = null;
      this.targetInfo = null;
      this.channelInfo = null;
    }

    Sender.prototype.toString = function() {
      return this.sender;
    };

    return Sender;

  })();

  module.exports = Sender;

}).call(this);
