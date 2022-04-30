var CommandReply, Icommand, URL, mcStatus;

Icommand = require('../icommand.js');

mcStatus = require('../mcstatus');

URL = require('url');

//mcStatus.setDebugMode true
CommandReply = class CommandReply extends Icommand {
  constructor() {
    super();
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
    var done, e, host, port, success;
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
        commandManager.send(sender, textRouter, `McStatus : unable to parse ${args[1]} !!!`);
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
          commandManager.send(sender, textRouter, `[${host}:${port}] Motd: \x02${res.description}\x0f Players: \x02${res.players.online}/${res.players.max}\x0f Version: \x02${res.version.name}\x0f`);
        } else {
          commandManager.send(sender, textRouter, `[${host}:${port}] Currently offline`);
        }
        //console.log res
        return done();
      });
    } catch (error) {
      e = error;
      commandManager.send(sender, textRouter, `McStatus : error during query status : ${e.toString()}`);
      done();
    }
    success = true;
    return success;
  }

  help(commandPrefix) {
    //console.log "add method to override this!"
    return ["make this bot to get status of minceraft server, Usage", `${commandPrefix} host [port]`];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager) {
    return true;
  }

};

module.exports = CommandReply;
