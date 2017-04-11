(function() {
  var Defer, IRouter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Defer = require('../defer');

  IRouter = (function(superClass) {
    extend(IRouter, superClass);

    function IRouter() {
      IRouter.__super__.constructor.apply(this, arguments);
      this.maxLength = 350;
    }

    IRouter.prototype.output = function(message, to) {};

    IRouter.prototype.outputMessage = function(message, to) {};

    IRouter.prototype.input = function(message, from, to, channal) {};

    IRouter.prototype.inputMessage = function(message, from, to, channal) {};

    IRouter.prototype.inputMe = function(message, from, to, channal) {};

    IRouter.prototype.whois = function(user, callback) {};

    IRouter.prototype.names = function(channal, callback) {};

    IRouter.prototype.notice = function(nick, message) {};

    IRouter.prototype.raw = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    };

    IRouter.prototype.rplRaw = function(reply) {};

    IRouter.prototype.rplJoin = function(channel, nick) {};

    IRouter.prototype.setSelfName = function(name) {};

    IRouter.prototype.getSelfName = function(name) {};

    IRouter.prototype.setChannels = function(channels) {};

    IRouter.prototype.getChannels = function(channels) {};

    IRouter.prototype.getRouterIdentifier = function() {};

    IRouter.prototype.toDisplayName = function(str) {
      return str.replace(/@.*/, '');
    };

    IRouter.prototype.fromDisplayName = function(str) {
      return str;
    };

    IRouter.prototype.isCommand = function(str) {
      throw new Error('not implement');
    };

    IRouter.prototype.parseArgs = function(str) {
      throw new Error('not implement');
    };

    IRouter.prototype.getSelfInfo = function() {};

    return IRouter;

  })(Defer);

  module.exports = IRouter;

}).call(this);
