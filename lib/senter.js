(function() {
  var Sender;

  Sender = (function() {
    function Sender(sender, target, text, channel) {
      this.sender = sender;
      this.target = target;
      this.text = text;
      this.channel = channel;
    }

    return Sender;

  })();

  module.exports = Sender;

}).call(this);
