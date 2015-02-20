(function() {
  var CommandReply, Icommand, mcStatus,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  mcStatus = require('../mcstatus');

  CommandReply = (function(_super) {
    __extends(CommandReply, _super);

    function CommandReply() {}

    CommandReply.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var e, host, port, success;
      if (args.length !== 3 && args.length !== 2) {
        return false;
      }
      if (args.length === 3) {
        port = parseInt(args[2]);
        if (port <= 0 || isNaN(port)) {
          return false;
        }
      }
      host = args[1];
      port = port || 25565;
      try {
        mcStatus.status(host, port, function(res) {
          if (res.online) {
            return commandManager.send(sender, textRouter, "[" + host + ":" + port + "] Motd: \x02" + res.description + "\x0f Players: \x02" + res.players.online + "/" + res.players.max + "\x0f Version: \x02" + res.version.name + "\x0f");
          } else {
            return commandManager.send(sender, textRouter, "[" + host + ":" + port + "] Currently offline");
          }
        });
      } catch (_error) {
        e = _error;
        commandManager.send(sender, textRouter, "McStatus : error during query status : " + (e.toString()));
      }
      success = true;
      return success;
    };

    CommandReply.prototype.help = function(commandPrefix) {
      return ["make this bot to get status of minceraft server, Usage", "" + commandPrefix + " host [port]"];
    };

    CommandReply.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandReply;

  })(Icommand);

  module.exports = CommandReply;

}).call(this);
