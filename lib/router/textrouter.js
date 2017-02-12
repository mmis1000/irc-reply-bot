(function() {
  var IRouter, Q, Senter, TextRouter, UTF8LengthSplit, imgur,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  IRouter = require('./irouter');

  Senter = require('../senter.js');

  UTF8LengthSplit = require('../util.js').UTF8LengthSplit;

  Q = require('q');

  imgur = require('imgur');

  TextRouter = (function(superClass) {
    extend(TextRouter, superClass);

    function TextRouter() {
      this.maxLength = 350;
      TextRouter.__super__.constructor.apply(this, arguments);
    }

    TextRouter.prototype.output = function(message, to) {
      var item, j, k, l, len, len1, len2, len3, m, person, temp, text;
      if (Array.isArray(message)) {
        message = message.join("\n");
      }
      message = message.split(/(?:\r\n|\n)/g);
      temp = [];
      for (j = 0, len = message.length; j < len; j++) {
        text = message[j];
        temp = temp.concat(UTF8LengthSplit(text, this.maxLength));
      }
      if (('string' === typeof to) || (to == null)) {
        for (k = 0, len1 = temp.length; k < len1; k++) {
          item = temp[k];
          this.emit("output", item, to);
        }
      } else {
        for (l = 0, len2 = to.length; l < len2; l++) {
          person = to[l];
          for (m = 0, len3 = temp.length; m < len3; m++) {
            item = temp[m];
            this.emit("output", item, person);
          }
        }
      }
      return true;
    };

    TextRouter.prototype.outputMessage = function(message, to) {
      if (message.medias.length > 0) {
        Q.all(message.medias.map(function(i) {
          return i.getAllFiles();
        })).then(function(arr_arr_file) {
          var files;
          files = [].concat.apply(arr_arr_file[0], arr_arr_file.slice(1));
          files = files.filter(function(file) {
            return file.MIME && file.MIME.match(/^image/);
          }).map(function(file) {
            return imgur.uploadBase64(file.content.toString('base64'));
          });
          return Q.all(files);
        }).then((function(_this) {
          return function(results) {
            Q.all(results.map(function(i) {
              return _this.output(i.data.link, to);
            }));
            if (message.asContentText) {
              return _this.output(message.text);
            }
          };
        })(this))["catch"](function(err) {
          return console.error(err.message || err.stack || '' + err);
        });
      } else {
        this.output(message.text, to);
      }
      return true;
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
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
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
      return function() {};
    };

    TextRouter.prototype.addResult = function() {};

    TextRouter.prototype.addError = function() {};

    return TextRouter;

  })(IRouter);

  module.exports = TextRouter;

}).call(this);
