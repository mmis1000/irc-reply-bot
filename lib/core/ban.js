var Ban, Imodule;

Imodule = require('../imodule.js');

Ban = class Ban extends Imodule {
  constructor() {
    super();
    this.name = 'ban';
  }

  handleRaw(sender, type, content, textRouter, commandManager, event) {
    var args, isOp, isSudo, text;
    if (type === 'init') {
      this.storage = commandManager.getStorage();
      this.manager = commandManager;
      this._init();
    }
    if (type === 'before_iscommand') {
      text = content.text;
      args = commandManager.parseArgs(text);
      isSudo = args[0] === 'sudo';
      isOp = commandManager.isOp(sender);
      if (isSudo || isOp) {
        return;
      }
      if (this.isBanned(sender)) {
        event.cancelled = true;
      }
      if (this.isChannelIgnored(sender)) {
        event.cancelled = true;
      }
    }
    return true;
  }

  _init() {
    var banChannelCommand, banChannelListCommand, banCommand, banListCommand, unbanChannelCommand, unbanCommand;
    banCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandBan(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command ban a user! usage : ", `${commandPrefix} nick`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.registerCommand('add', banCommand, []);
    unbanCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandUnban(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command unban a user! usage : ", `${commandPrefix} nick`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.registerCommand('remove', unbanCommand, []);
    banListCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandBanList(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command show banned users! usage : ", `${commandPrefix}`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        //console.log 'per miss ', sender.sender, commandManager.isOp sender.sender
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.registerCommand('list', banListCommand, []);
    banChannelCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandBanChannel(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command ignore a channel! usage : ", `${commandPrefix} nick`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.registerCommand('add-channel', banChannelCommand, []);
    unbanChannelCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandUnbanChannel(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command unignore a channel! usage : ", `${commandPrefix} nick`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.registerCommand('remove-channel', unbanChannelCommand, []);
    banChannelListCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandBanChannelList(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command show ignored channel list! usage : ", `${commandPrefix}`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        //console.log 'per miss ', sender.sender, commandManager.isOp sender.sender
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.registerCommand('list-channel', banChannelListCommand, []);
    return this.manager.isBanned = this.isBanned.bind(this);
  }

  isBanned(sender) {
    var i, ref;
    ref = (this.storage.get("banList")) || [];
    for (i of ref) {
      try {
        if (0 <= sender.sender.search(new RegExp(i, "gi"))) {
          return true;
        }
      } catch (error) {}
    }
    return false;
  }

  isChannelIgnored(sender) {
    var i, ref;
    if (sender.target.match(/^[^#]/)) {
      return false;
    }
    ref = (this.storage.get("banChannelList")) || [];
    for (i of ref) {
      try {
        if (0 <= sender.target.search(new RegExp(i, "gi"))) {
          return true;
        }
      } catch (error) {}
    }
    return false;
  }

  _commandBan(sender, text, args, storage, textRouter, commandManager) {
    var banList, index;
    if (args.length !== 2) {
      return false;
    }
    banList = this.storage.get("banList", []);
    index = banList.indexOf(args[1]);
    if (0 > index) {
      banList.push(args[1]);
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `banned ${args[1]}`);
    } else {
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `${args[1]} is already banned`);
    }
    this.storage.set("banList", banList);
    return true;
  }

  _commandUnban(sender, text, args, storage, textRouter, commandManager) {
    var banList, index;
    if (args.length !== 2) {
      return false;
    }
    banList = this.storage.get("banList", []);
    index = banList.indexOf(args[1]);
    if (0 > index) {
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `${args[1]} is not banned`);
    } else {
      banList.splice(index, 1);
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `unbanned ${args[1]}`);
    }
    this.storage.set("banList", banList);
    return true;
  }

  _commandBanList(sender, text, args, storage, textRouter, commandManager) {
    if (args.length !== 1) {
      return false;
    }
    textRouter.output(`all bannned user : ${this.storage.get('banList', [])}`, sender.sender);
    return true;
  }

  _commandBanChannel(sender, text, args, storage, textRouter, commandManager) {
    var banList, index;
    if (args.length !== 2) {
      return false;
    }
    banList = this.storage.get("banChannelList", []);
    index = banList.indexOf(args[1]);
    if (0 > index) {
      banList.push(args[1]);
      commandManager.send(sender, textRouter, `command at channel ${args[1]} is now ignored`);
    } else {
      commandManager.send(sender, textRouter, `command channel ${args[1]} is already ignored`);
    }
    this.storage.set("banChannelList", banList);
    return true;
  }

  _commandUnbanChannel(sender, text, args, storage, textRouter, commandManager) {
    var banList, index;
    if (args.length !== 2) {
      return false;
    }
    banList = this.storage.get("banChannelList", []);
    index = banList.indexOf(args[1]);
    if (0 > index) {
      commandManager.send(sender, textRouter, `channel ${args[1]} is not unignored`);
    } else {
      banList.splice(index, 1);
      commandManager.send(sender, textRouter, `unignored channel ${args[1]}`);
    }
    this.storage.set("banChannelList", banList);
    return true;
  }

  _commandBanChannelList(sender, text, args, storage, textRouter, commandManager) {
    if (args.length !== 1) {
      return false;
    }
    commandManager.send(sender, textRouter, `all ignored Channel List : ${(this.storage.get('banChannelList', [])).join(', ')}`);
    return true;
  }

};

module.exports = Ban;
