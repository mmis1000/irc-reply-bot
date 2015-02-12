(function() {
  var CommandPing, Icommand, dns, patch_ping, ping, punycode,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  dns = require('dns');

  ping = require('net-ping');

  punycode = require('punycode');

  patch_ping = require('../net-ping-hrtime-patch.js');

  patch_ping(ping.Session);

  CommandPing = (function(_super) {
    __extends(CommandPing, _super);

    function CommandPing() {
      this.session = ping.createSession();
    }

    CommandPing.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 2) {
        return false;
      }
      dns.lookup(punycode.toASCII(args[1]), (function(_this) {
        return function(err, address, family) {
          if (err) {
            commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "Ping : fail to find " + args[1] + " due to " + (err.toString()));
            return;
          }
          commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "Ping : solved server! " + args[1] + " is " + address + ". Start to ping server");
          return _this.session.pingHost(address, function(error, target, sent, rcvd, sent_hr, rcvd_hr) {
            var ms;
            console.log(arguments);
            sent_hr = sent_hr[0] * 1000 + sent_hr[1] / 1000000;
            rcvd_hr = rcvd_hr[0] * 1000 + rcvd_hr[1] / 1000000;
            ms = (rcvd_hr - sent_hr).toFixed(3);
            if (error) {
              commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "Ping : fail to ping " + target + " due to " + (error.toString()));
              return;
            }
            return commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "Ping : " + target + " replied in " + ms + " ms");
          });
        };
      })(this));
      return true;
    };

    CommandPing.prototype.help = function(commandPrefix) {
      console.log("add method to override this!");
      return ["make this bot to ping a server, Usage", "" + commandPrefix + " server"];
    };

    CommandPing.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandPing;

  })(Icommand);

  module.exports = CommandPing;

}).call(this);
