(function() {
  var CommandTrace, Icommand, dns, options, ping, punycode,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  dns = require('dns');

  ping = require('net-ping');

  punycode = require('punycode');

  options = {
    networkProtocol: ping.NetworkProtocol.IPv4,
    packetSize: 16,
    retries: 1,
    sessionId: process.pid % 65535,
    timeout: 2000,
    ttl: 128
  };

  CommandTrace = (function(superClass) {
    extend(CommandTrace, superClass);

    function CommandTrace() {
      this.session = ping.createSession(options);
      this.TTL_LIMIT = 30;
    }

    CommandTrace.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var done;
      if (args.length !== 2) {
        return false;
      }
      done = textRouter.async();
      dns.lookup(punycode.toASCII(args[1]), (function(_this) {
        return function(err, address, family) {
          var doneCb, feedCb;
          if (err) {
            commandManager.sendPv(sender, textRouter, "Trace : fail to find " + args[1] + " due to " + (err.toString()));
            return;
          }
          commandManager.sendPv(sender, textRouter, "Trace : solved server! " + args[1] + " is " + address + ". Start to trace server");
          doneCb = function(error, target) {
            if ((!error) || error instanceof ping.TimeExceededError) {
              commandManager.sendPv(sender, textRouter, "Trace : " + target + ", Done!");
            } else {
              commandManager.sendPv(sender, textRouter, "Trace : " + target + ", Terminated! " + (error.toString()));
            }
            done();
          };
          feedCb = function(error, target, ttl, sent, rcvd) {
            var ms;
            ms = rcvd - sent;
            if (error) {
              if (error instanceof ping.TimeExceededError) {
                commandManager.sendPv(sender, textRouter, "Trace : " + error.source + " (ttl = " + ttl + ", ms = " + ms + ")");
              } else {
                commandManager.sendPv(sender, textRouter, "Trace : " + (error.toString()) + " (ttl = " + ttl + ", ms = " + ms + ")");
              }
            }
          };
          return _this.session.traceRoute(address, _this.TTL_LIMIT, feedCb, doneCb);
        };
      })(this));
      return true;
    };

    CommandTrace.prototype.help = function(commandPrefix) {
      return ["make this bot to trace a server, will send with private message. Usage", commandPrefix + " server"];
    };

    CommandTrace.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandTrace;

  })(Icommand);

  module.exports = CommandTrace;

}).call(this);
