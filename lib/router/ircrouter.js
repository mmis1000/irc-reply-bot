(function() {
  var IrcRouter, TextRouter, irc;

  TextRouter = require('./textrouter');

  irc = require('irc');

  IrcRouter = (function() {
    class IrcRouter extends TextRouter {
      constructor(server, nick1 = 'irc-bot', channels = [], port = null, SASL = null, identifier = '*') {
        super();
        this.server = server;
        this.nick = nick1;
        this.channels = channels;
        this.port = port;
        this.SASL = SASL;
        this.identifier = identifier;
        this._timeoutId = null;
        this._timeoutInterval = null;
        this._init();
        this.routerIdentifier = '';
      }

      enableFloodProtection(floodProtection) {
        return this.client.activateFloodProtection(floodProtection);
      }

      enableTimeout(timeout) {
        this._timeoutInterval = timeout;
        this.client.on('ping', this.onPing.bind(this));
        this.client.on('registered', this.onConnect.bind(this));
        this.client.on('message', this.onMessage.bind(this));
        return this._timeoutId = setTimeout(this.onTimeout.bind(this), this._timeoutInterval);
      }

      onPing() {
        clearTimeout(this._timeoutId);
        return this._timeoutId = setTimeout(this.onTimeout.bind(this), this._timeoutInterval);
      }

      onTimeout() {
        return this.reconnect();
      }

      reconnect() {
        console.log('reseting client...');
        this.client.conn.destroy();
        this.client.conn.removeAllListeners();
        return this.client.connect();
      }

      _init() {
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
        this.client.on('join', (channel, nick, message) => {
          //console.log Object.keys @client.chans
          this.setChannels(Object.keys(this.client.chans));
          if (nick !== this.nick) {
            this.rplJoin(channel, nick);
          }
        });
        this.client.on('error', (err) => {
          console.log(err);
        });
        this.on('output', (m, target) => {
          var i, len, person;
          target = target || this.channels;
          if ('string' === typeof target) {
            this.client.say(target, m);
            console.log((new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + '*self* => ' + target + ': ' + m);
          } else if (Array.isArray(target)) {
            for (i = 0, len = target.length; i < len; i++) {
              person = target[i];
              this.client.say(person, m);
              console.log((new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + '*self* => ' + person + ': ' + m);
            }
          }
        });
        this.on('whois', (user, callback) => {
          this.client.whois(user, callback);
        });
        this.on('notice', (user, message) => {
          this.client.send('NOTICE', user, message);
        });
        this.client.on('raw', (e) => {
          if (e.command === 'rpl_welcome') {
            this.nick = e.args[0];
            this.setSelfName(e.args[0]);
          }
          /*
          if e.command == 'JOIN' and @nick == e.nick
            #textRouter.output('bot connected');
            @emit 'connect'
            console.log "joined channel"
           */
          //console.log(e);
          this.rplRaw(e);
        });
        this.client.on('join', (channel, nick, message) => {
          if (this.nick === nick) {
            this.emit('connect');
            return console.log(`joined channel ${channel}`);
          }
        });
        this.client.addListener('message', (from, to, message) => {
          console.log((new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + from + ' => ' + to + ': ' + message);
          this.input(message, from, to, this.channels);
        });
        this.client.addListener('action', (from, to, message) => {
          console.log((new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' (E) ' + from + ' => ' + to + ': ' + message);
          this.inputMe(message, from, to, this.channels);
          // also route the message as text
          this.input(`\u0001ACTION ${message} \u0001`, from, to, this.channels);
        });
        return (() => {          
          //name list query
          var waitingForChannel;
          waitingForChannel = [];
          this.client.on('raw', function(e) {
            var channel, names;
            if (e.command === 'rpl_namreply') {
              channel = e.args[2];
              names = e.args[3].split(' ');
              //console.log('debug', channel, names);
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
          this.on('names', (channel, callback) => {
            waitingForChannel.push({
              channel: channel,
              callback: callback
            });
            this.client.send('NAMES', channel);
          });
        })();
      }

      disconnect(msg, cb) {
        return this.client.disconnect(msg, cb);
      }

      getIdentifier() {
        return this.identifier;
      }

      getRouterIdentifier() {
        return this.routerIdentifier || '';
      }

      isCommand(text) {
        return 0 === text.indexOf(this.identifier);
      }

      parseArgs(text) {
        if (0 === text.indexOf(this.identifier)) {
          text = text.replace(this.identifier, '');
        }
        text = text.replace(/^\s+|\s+$/g, '');
        return text.split(/\s+/);
      }

    };

    IrcRouter.prototype.onMessage = IrcRouter.prototype.onConnect = IrcRouter.prototype.onPing;

    return IrcRouter;

  }).call(this);

  module.exports = IrcRouter;

}).call(this);
