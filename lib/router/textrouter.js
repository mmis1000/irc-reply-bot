(function() {
  var IRouter, Senter, TextRouter, UTF8LengthSplit,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  IRouter = require('./irouter');

  Senter = require('../senter.js');

  UTF8LengthSplit = require('../util.js').UTF8LengthSplit;

  TextRouter = (function(_super) {
    __extends(TextRouter, _super);

    function TextRouter() {
      this.maxLength = 350;
      TextRouter.__super__.constructor.apply(this, arguments);
    }

    TextRouter.prototype.output = function(message, to) {
      var item, person, temp, text, _i, _j, _k, _len, _len1, _len2, _results, _results1;
      if (Array.isArray(message)) {
        message = message.join("\n");
      }
      message = message.split(/(?:\r\n|\n)/g);
      temp = [];
      for (_i = 0, _len = message.length; _i < _len; _i++) {
        text = message[_i];
        temp = temp.concat(UTF8LengthSplit(text, this.maxLength));
      }
      if (('string' === typeof to) || (to == null)) {
        _results = [];
        for (_j = 0, _len1 = temp.length; _j < _len1; _j++) {
          item = temp[_j];
          _results.push(this.emit("output", item, to));
        }
        return _results;
      } else {
        _results1 = [];
        for (_k = 0, _len2 = to.length; _k < _len2; _k++) {
          person = to[_k];
          _results1.push((function() {
            var _l, _len3, _results2;
            _results2 = [];
            for (_l = 0, _len3 = temp.length; _l < _len3; _l++) {
              item = temp[_l];
              _results2.push(this.emit("output", item, person));
            }
            return _results2;
          }).call(this));
        }
        return _results1;
      }
    };

    TextRouter.prototype.input = function(message, from, to, channal) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.emit("input", message, sender);
    };

    TextRouter.prototype.inputMessage = function(message, from, to, channal) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.emit("message", message, sender);
    };

    TextRouter.prototype.inputMe = function(message, from, to, channal) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.emit("input_me", message, sender);
    };

    TextRouter.prototype.whois = function(user, callback) {
      return this.emit("whois", user, callback);
    };

    TextRouter.prototype.names = function(channal, callback) {
      return this.emit("names", channal, callback);
    };

    TextRouter.prototype.notice = function(nick, message) {
      return this.emit("notice", nick, message);
    };

    TextRouter.prototype.raw = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 1 && Array.isArray(args[0])) {
        args = args[0];
      }
      return this.emit("raw", args);
    };

    TextRouter.prototype.rplRaw = function(reply) {
      return this.emit("rpl_raw", reply);
    };

    TextRouter.prototype.rplJoin = function(channel, nick) {
      var sender;
      sender = new Senter(nick, channel, null, channel);
      return this.emit("rpl_join", channel, sender);
    };

    TextRouter.prototype.setSelfName = function(name) {
      return this._selfName = name;
    };

    TextRouter.prototype.getSelfName = function(name) {
      return this._selfName;
    };

    TextRouter.prototype.setChannels = function(channels) {
      return this._channels = channels;
    };

    TextRouter.prototype.getChannels = function(channels) {
      return this._channels;
    };

    TextRouter.prototype.async = function() {
      console.log("requested async work");
      return function() {
        return console.log("async work finished");
      };
    };

    TextRouter.prototype.addResult = function() {};

    TextRouter.prototype.addError = function() {};

    return TextRouter;

  })(IRouter);

  module.exports = TextRouter;

}).call(this);
