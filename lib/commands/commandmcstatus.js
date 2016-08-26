(function() {
  var CommandReply, Icommand, URL, mcStatus,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  mcStatus = require('../mcstatus');

  URL = require('url');

  CommandReply = (function(superClass) {
    extend(CommandReply, superClass);

    function CommandReply() {}

    CommandReply.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var done, e, error, host, port, success;
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
      if (0 <= host.search(/\//)) {
        host = URL.parse(host, false, true);
        if (!host.hostname) {
          commandManager.send(sender, textRouter, "McStatus : unable to parse " + args[1] + " !!!");
          return false;
        }
        if (host.port) {
          port = host.port;
        }
        host = host.hostname;
      }
      if (0 <= host.search(/:/)) {
        host = host.split(':');
        port = host[1];
        host = host[0];
      }
      done = textRouter.async();
      try {
        mcStatus.status(host, port, function(res) {
          if (res.online) {
            commandManager.send(sender, textRouter, "[" + host + ":" + port + "] Motd: \x02" + res.description + "\x0f Players: \x02" + res.players.online + "/" + res.players.max + "\x0f Version: \x02" + res.version.name + "\x0f");
          } else {
            commandManager.send(sender, textRouter, "[" + host + ":" + port + "] Currently offline");
          }
          return done();
        });
      } catch (error) {
        e = error;
        commandManager.send(sender, textRouter, "McStatus : error during query status : " + (e.toString()));
        done();
      }
      success = true;
      return success;
    };

    CommandReply.prototype.help = function(commandPrefix) {
      return ["make this bot to get status of minceraft server, Usage", commandPrefix + " host [port]"];
    };

    CommandReply.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandReply;

  })(Icommand);

  module.exports = CommandReply;

}).call(this);
