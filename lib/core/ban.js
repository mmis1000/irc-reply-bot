(function() {
  var Ban, Imodule,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Imodule = require('../imodule.js');

  Ban = (function(superClass) {
    extend(Ban, superClass);

    function Ban() {
      Ban.__super__.constructor.apply(this, arguments);
      this.name = 'ban';
    }

    Ban.prototype.handleRaw = function(sender, type, content, textRouter, commandManager, event) {
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
    };

    Ban.prototype._init = function() {
      var banChannelCommand, banChannelListCommand, banCommand, banListCommand, unbanChannelCommand, unbanCommand;
      banCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBan(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command ban a user! usage : ", commandPrefix + " nick"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return commandManager.isOp(sender.sender);
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('add', banCommand, []);
      unbanCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandUnban(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command unban a user! usage : ", commandPrefix + " nick"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return commandManager.isOp(sender.sender);
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('remove', unbanCommand, []);
      banListCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBanList(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command show banned users! usage : ", "" + commandPrefix];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return commandManager.isOp(sender.sender);
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('list', banListCommand, []);
      banChannelCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBanChannel(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command ignore a channel! usage : ", commandPrefix + " nick"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return commandManager.isOp(sender.sender);
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('add-channel', banChannelCommand, []);
      unbanChannelCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandUnbanChannel(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command unignore a channel! usage : ", commandPrefix + " nick"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return commandManager.isOp(sender.sender);
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('remove-channel', unbanChannelCommand, []);
      banChannelListCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBanChannelList(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command show ignored channel list! usage : ", "" + commandPrefix];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return commandManager.isOp(sender.sender);
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('list-channel', banChannelListCommand, []);
      return this.manager.isBanned = this.isBanned.bind(this);
    };

    Ban.prototype.isBanned = function(sender) {
      var i, j, len, ref;
      ref = (this.storage.get("banList")) || [];
      for (j = 0, len = ref.length; j < len; j++) {
        i = ref[j];
        try {
          if (0 <= sender.sender.search(new RegExp(i, "gi"))) {
            return true;
          }
        } catch (undefined) {}
      }
      return false;
    };

    Ban.prototype.isChannelIgnored = function(sender) {
      var i, j, len, ref;
      if (sender.target.match(/^[^#]/)) {
        return false;
      }
      ref = (this.storage.get("banChannelList")) || [];
      for (j = 0, len = ref.length; j < len; j++) {
        i = ref[j];
        try {
          if (0 <= sender.target.search(new RegExp(i, "gi"))) {
            return true;
          }
        } catch (undefined) {}
      }
      return false;
    };

    Ban.prototype._commandBan = function(sender, text, args, storage, textRouter, commandManager) {
      var banList, index;
      if (args.length !== 2) {
        return false;
      }
      banList = this.storage.get("banList", []);
      index = banList.indexOf(args[1]);
      if (0 > index) {
        banList.push(args[1]);
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "banned " + args[1]);
      } else {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, args[1] + " is already banned");
      }
      this.storage.set("banList", banList);
      return true;
    };

    Ban.prototype._commandUnban = function(sender, text, args, storage, textRouter, commandManager) {
      var banList, index;
      if (args.length !== 2) {
        return false;
      }
      banList = this.storage.get("banList", []);
      index = banList.indexOf(args[1]);
      if (0 > index) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, args[1] + " is not banned");
      } else {
        banList.splice(index, 1);
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "unbanned " + args[1]);
      }
      this.storage.set("banList", banList);
      return true;
    };

    Ban.prototype._commandBanList = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 1) {
        return false;
      }
      textRouter.output("all bannned user : " + (this.storage.get('banList', [])), sender.sender);
      return true;
    };

    Ban.prototype._commandBanChannel = function(sender, text, args, storage, textRouter, commandManager) {
      var banList, index;
      if (args.length !== 2) {
        return false;
      }
      banList = this.storage.get("banChannelList", []);
      index = banList.indexOf(args[1]);
      if (0 > index) {
        banList.push(args[1]);
        commandManager.send(sender, textRouter, "command at channel " + args[1] + " is now ignored");
      } else {
        commandManager.send(sender, textRouter, "command channel " + args[1] + " is already ignored");
      }
      this.storage.set("banChannelList", banList);
      return true;
    };

    Ban.prototype._commandUnbanChannel = function(sender, text, args, storage, textRouter, commandManager) {
      var banList, index;
      if (args.length !== 2) {
        return false;
      }
      banList = this.storage.get("banChannelList", []);
      index = banList.indexOf(args[1]);
      if (0 > index) {
        commandManager.send(sender, textRouter, "channel " + args[1] + " is not unignored");
      } else {
        banList.splice(index, 1);
        commandManager.send(sender, textRouter, "unignored channel " + args[1]);
      }
      this.storage.set("banChannelList", banList);
      return true;
    };

    Ban.prototype._commandBanChannelList = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 1) {
        return false;
      }
      commandManager.send(sender, textRouter, "all ignored Channel List : " + ((this.storage.get('banChannelList', [])).join(', ')));
      return true;
    };

    return Ban;

  })(Imodule);

  module.exports = Ban;

}).call(this);
