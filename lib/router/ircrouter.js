(function() {
  var IrcRouter, TextRouter, irc,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TextRouter = require('./textrouter');

  irc = require('irc');

  IrcRouter = (function(superClass) {
    extend(IrcRouter, superClass);

    function IrcRouter(server, nick1, channels, port, SASL, identifier) {
      this.server = server;
      this.nick = nick1 != null ? nick1 : 'irc-bot';
      this.channels = channels != null ? channels : [];
      this.port = port != null ? port : null;
      this.SASL = SASL != null ? SASL : null;
      this.identifier = identifier != null ? identifier : '*';
      IrcRouter.__super__.constructor.apply(this, arguments);
      this._timeoutId = null;
      this._timeoutInterval = null;
      this._init();
      this.routerIdentifier = '';
    }

    IrcRouter.prototype.enableFloodProtection = function(floodProtection) {
      return this.client.activateFloodProtection(floodProtection);
    };

    IrcRouter.prototype.enableTimeout = function(timeout) {
      this._timeoutInterval = timeout;
      this.client.on('ping', this.onPing.bind(this));
      this.client.on('registered', this.onConnect.bind(this));
      this.client.on('message', this.onMessage.bind(this));
      return this._timeoutId = setTimeout(this.onTimeout.bind(this), this._timeoutInterval);
    };

    IrcRouter.prototype.onPing = function() {
      clearTimeout(this._timeoutId);
      return this._timeoutId = setTimeout(this.onTimeout.bind(this), this._timeoutInterval);
    };

    IrcRouter.prototype.onMessage = IrcRouter.prototype.onConnect = IrcRouter.prototype.onPing;

    IrcRouter.prototype.onTimeout = function() {
      return this.reconnect();
    };

    IrcRouter.prototype.reconnect = function() {
      console.log('reseting client...');
      this.client.conn.destroy();
      this.client.conn.removeAllListeners();
      return this.client.connect();
    };

    IrcRouter.prototype._init = function() {
      if (!this.SASL) {
        this.client = new irc.Client(this.server, this.nick, {
          channels: this.channels,
          userName: 'replybot',
          realName: 'The Irc Reply Bot Project - http://goo.gl/fCPD4A'
        });
      } else {
        this.client = new irc.Client(this.server, this.nick, {
          channels: this.channels,
          userName: this.SASL.account,
          password: this.SASL.password,
          sasl: true,
          realName: 'The Irc Reply Bot Project - http://goo.gl/fCPD4A'
        });
      }
      this.client.on('join', (function(_this) {
        return function(channel, nick, message) {
          _this.setChannels(Object.keys(_this.client.chans));
          if (nick !== _this.nick) {
            _this.rplJoin(channel, nick);
          }
        };
      })(this));
      this.client.on('error', (function(_this) {
        return function(err) {
          console.log(err);
        };
      })(this));
      this.on('output', (function(_this) {
        return function(m, target) {
          var i, len, person;
          target = target || _this.channels;
          if ('string' === typeof target) {
            _this.client.say(target, m);
            console.log((new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + '*self* => ' + target + ': ' + m);
          } else if (Array.isArray(target)) {
            for (i = 0, len = target.length; i < len; i++) {
              person = target[i];
              _this.client.say(person, m);
              console.log((new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + '*self* => ' + person + ': ' + m);
            }
          }
        };
      })(this));
      this.on('whois', (function(_this) {
        return function(user, callback) {
          _this.client.whois(user, callback);
        };
      })(this));
      this.on('notice', (function(_this) {
        return function(user, message) {
          _this.client.send('NOTICE', user, message);
        };
      })(this));
      this.client.on('raw', (function(_this) {
        return function(e) {
          if (e.command === 'rpl_welcome') {
            _this.nick = e.args[0];
            _this.setSelfName(e.args[0]);
          }

          /*
          if e.command == 'JOIN' and @nick == e.nick
            #textRouter.output('bot connected');
            @emit 'connect'
            console.log "joined channel"
           */
          _this.rplRaw(e);
        };
      })(this));
      this.client.on('join', (function(_this) {
        return function(channel, nick, message) {
          if (_this.nick === nick) {
            _this.emit('connect');
            return console.log("joined channel " + channel);
          }
        };
      })(this));
      this.client.addListener('message', (function(_this) {
        return function(from, to, message) {
          console.log((new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + from + ' => ' + to + ': ' + message);
          _this.input(message, from, to, _this.channels);
        };
      })(this));
      this.client.addListener('action', (function(_this) {
        return function(from, to, message) {
          console.log((new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' (E) ' + from + ' => ' + to + ': ' + message);
          _this.inputMe(message, from, to, _this.channels);
          _this.input("\u0001ACTION " + message + " \u0001", from, to, _this.channels);
        };
      })(this));
      return (function(_this) {
        return function() {
          var waitingForChannel;
          waitingForChannel = [];
          _this.client.on('raw', function(e) {
            var channel, names;
            if (e.command === 'rpl_namreply') {
              channel = e.args[2];
              names = e.args[3].split(' ');
              waitingForChannel.forEach(function(item) {
                if (channel === item.channel) {
                  item.callback(names);
                }
              });
              waitingForChannel = waitingForChannel.filter(function(item) {
                return item.channel !== channel;
              });
            }
            if (e.command === 'rpl_endofnames') {
              waitingForChannel.forEach(function(item) {
                item.callback([]);
              });
              waitingForChannel = [];
            }
          });
          _this.on('names', function(channel, callback) {
            waitingForChannel.push({
              channel: channel,
              callback: callback
            });
            _this.client.send('NAMES', channel);
          });
        };
      })(this)();
    };

    IrcRouter.prototype.disconnect = function(msg, cb) {
      return this.client.disconnect(msg, cb);
    };

    IrcRouter.prototype.getIdentifier = function() {
      return this.identifier;
    };

    IrcRouter.prototype.getRouterIdentifier = function() {
      return this.routerIdentifier || '';
    };

    IrcRouter.prototype.isCommand = function(text) {
      return 0 === text.indexOf(this.identifier);
    };

    IrcRouter.prototype.parseArgs = function(text) {
      if (0 === text.indexOf(this.identifier)) {
        text = text.replace(this.identifier, '');
      }
      text = text.replace(/^\s+|\s+$/g, '');
      return text.split(/\s+/);
    };

    return IrcRouter;

  })(TextRouter);

  module.exports = IrcRouter;

}).call(this);
