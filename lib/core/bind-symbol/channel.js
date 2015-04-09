(function() {
  var Channel;

  Channel = (function() {
    function Channel() {
      this.symbols = ['channel'];
    }

    Channel.prototype.handle = function(sender, content, args, manager, router) {
      return router.getChannels().join(', ');
    };

    return Channel;

  })();

  module.exports = new Channel;

}).call(this);
