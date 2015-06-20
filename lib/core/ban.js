(function() {
  var Ban, Imodule,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Imodule = require('../imodule.js');

  Ban = (function(_super) {
    __extends(Ban, _super);

    function Ban() {
      Ban.__super__.constructor.apply(this, arguments);
      this.name = 'ban';
    }

    Ban.prototype.handleRaw = function(sender, type, content, textRouter, commandManager, event) {
      if (type === 'init') {
        this.storage = commandManager.getStorage();
        this.manager = commandManager;
        this._init();
      }
      if (type === 'before_iscommand') {
        if (this.isBanned(sender)) {
          event.cancelled = true;
        }
      }
      return true;
    };

    Ban.prototype._init = function() {
      var banCommand, banListCommand, unbanCommand;
      banCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBan(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command ban a user! usage : ", "" + commandPrefix + " nick"];
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
          return ["command unban a user! usage : ", "" + commandPrefix + " nick"];
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
      return this.manager.isBanned = this.isBanned.bind(this);
    };

    Ban.prototype.isBanned = function(sender) {
      var i, _i, _len, _ref;
      _ref = (this.storage.get("banList")) || [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        try {
          if (0 <= sender.sender.search(new RegExp(i, "gi"))) {
            return true;
          }
        } catch (_error) {}
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
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "" + args[1] + " is already banned");
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
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "" + args[1] + " is not banned");
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

    return Ban;

  })(Imodule);

  module.exports = Ban;

}).call(this);
