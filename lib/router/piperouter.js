(function() {
  var IRouter, PipeRouter, Senter,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  IRouter = require('../irouter');

  Senter = require('../senter.js');

  PipeRouter = (function(_super) {
    __extends(PipeRouter, _super);

    function PipeRouter(parentRouter) {
      this.parentRouter = parentRouter;
    }

    PipeRouter.prototype.output = function(message, to) {
      return this.addResult({
        type: 'output',
        message: message,
        to: to
      });
    };

    PipeRouter.prototype.whois = function(user, callback) {
      return this.parentRouter.emit("whois", user, callback);
    };

    PipeRouter.prototype.names = function(channal, callback) {
      return this.parentRouter.emit("names", channal, callback);
    };

    PipeRouter.prototype.raw = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 1 && Array.isArray(args[0])) {
        args = args[0];
      }
      return this.addResult({
        type: 'raw',
        message: args,
        to: null
      });
    };

    PipeRouter.prototype.input = function(message, from, to, channal) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.parentRouter.emit("input", message, sender);
    };

    PipeRouter.prototype.inputMe = function(message, from, to, channal) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.parentRouter.emit("input_me", message, sender);
    };

    PipeRouter.prototype.setSelfName = function(name) {
      return this.parentRouter.setSelfName(name);
    };

    PipeRouter.prototype.getSelfName = function(name) {
      return this.parentRouter.getSelfName();
    };

    PipeRouter.prototype.setChannels = function(channels) {
      return this.parentRouter.setChannels(channels);
    };

    PipeRouter.prototype.getChannels = function(channels) {
      return this.parentRouter.getChannels(channels);
    };

    PipeRouter.prototype.transformResults = function(res) {
      var output, result, _i, _len;
      output = [];
      for (_i = 0, _len = res.length; _i < _len; _i++) {
        result = res[_i];
        if (result.type === 'output') {
          if (Array.isArray(typeof result.message)) {
            output.push(result.message.join("\r\n"));
          } else {
            output.push(result.message);
          }
        }
      }
      return output.join('\r\n');
    };

    return PipeRouter;

  })(IRouter);

  module.exports = PipeRouter;

}).call(this);
