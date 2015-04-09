(function() {
  var BotName;

  BotName = (function() {
    function BotName() {
      this.symbols = ['botname'];
    }

    BotName.prototype.handle = function(sender, content, args, manager, router) {
      return router.getSelfName();
    };

    return BotName;

  })();

  module.exports = new BotName;

}).call(this);
