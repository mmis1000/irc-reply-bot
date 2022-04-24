(function() {
  var IRouter, Q, Senter, TextRouter, UTF8LengthSplit, imgur;

  IRouter = require('./irouter');

  Senter = require('../senter.js');

  ({UTF8LengthSplit} = require('../util.js'));

  Q = require('q');

  imgur = require('imgur');

  TextRouter = class TextRouter extends IRouter {
    constructor() {
      super();
      this.maxLength = 350;
    }

    output(message, to) {
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
      
      //console.log temp
      //console.log temp.length
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
    }

    outputMessage(message, to) {
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
        }).then((results) => {
          if (message.asContentText) {
            this.output(message.text);
          }
          return Q.all(results.map((i) => {
            return this.output(i.data.link, to);
          }));
        }).catch(function(err) {
          return console.error(err.message || err.stack || '' + err);
        });
      } else {
        this.output(message.text, to);
      }
      return true;
    }

    input(message, from, to, channal) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.emit("input", message, sender);
    }

    inputMessage(message, from, to, channal) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.emit("message", message, sender);
    }

    inputMe(message, from, to, channal) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.emit("input_me", message, sender);
    }

    whois(user, callback) {
      return this.emit("whois", user, callback);
    }

    names(channal, callback) {
      return this.emit("names", channal, callback);
    }

    notice(nick, message) {
      return this.emit("notice", nick, message);
    }

    raw(...args) {
      if (args.length === 1 && Array.isArray(args[0])) {
        args = args[0];
      }
      return this.emit("raw", args);
    }

    rplRaw(reply) {
      return this.emit("rpl_raw", reply);
    }

    rplJoin(channel, nick) {
      var sender;
      sender = new Senter(nick, channel, null, channel);
      return this.emit("rpl_join", channel, sender);
    }

    setSelfName(name) {
      return this._selfName = name;
    }

    getSelfName(name) {
      return this._selfName;
    }

    setChannels(channels) {
      return this._channels = channels;
    }

    getChannels(channels) {
      return this._channels;
    }

    async() {
      
        // console.log "requested async work"
      return function() {};
    }

    // console.log "async work finished"
    addResult() {}

    addError() {}

    getSelfInfo() {
      return Promise.resolve(null);
    }

  };

  module.exports = TextRouter;

}).call(this);
