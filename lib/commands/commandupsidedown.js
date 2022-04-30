var CommandUpsideDown, Icommand;

Icommand = require('../icommand.js');

CommandUpsideDown = class CommandUpsideDown extends Icommand {
  constructor() {
    super();
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
    var froms, map, message, tos;
    if (args.length === 1 || (args.length === 2 && args[1] === "")) {
      return false;
    }
    message = args.slice(1).join(" ");
    if (message.match(/^\s*$/g)) {
      return false;
    }
    froms = "abcdefghijklmopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZɐqɔpǝɟƃɥᴉɾʞlɯodbɹsʇnʌʍxʎz∀qƆpƎℲפHIſʞ˥WNOԀQɹS┴∩ΛMX⅄Z¯_><".split("");
    tos = "ɐqɔpǝɟƃɥᴉɾʞlɯodbɹsʇnʌʍxʎz∀qƆpƎℲפHIſʞ˥WNOԀQɹS┴∩ΛMX⅄ZabcdefghijklmopqrstuvwxyzAbCdEFGHIJkLMNOPQrSTUVWXYZ_¯<>".split("");
    map = froms.reduce(function(all, key, i) {
      all[key] = tos[i];
      return all;
    }, {});
    message = message.split('').map(function(ch) {
      return map[ch] || ch;
    }).reverse().join('');
    commandManager.send(sender, textRouter, message);
    return true;
  }

  help(commandPrefix) {
    //console.log "add method to override this!"
    return ["make this bot to say some message", "this command will send to you according to where you exec this command, Usage", `${commandPrefix} [-rj] messages..`, "flags:", "r: raw string, no line break", "j: full js format string"];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
    return true;
  }

};

module.exports = CommandUpsideDown;
