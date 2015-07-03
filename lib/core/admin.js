(function() {
  var Admin, Imodule,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Imodule = require('../imodule');

  Admin = (function(_super) {
    __extends(Admin, _super);

    function Admin(bot) {
      var exitCommand, reloadCommand;
      this.bot = bot;
      Admin.__super__.constructor.apply(this, arguments);
      this.name = 'admin';
      exitCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._exit(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command exit the bot itself : ", "" + commandPrefix];
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
      this.registerCommand('exit', exitCommand, []);
      reloadCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._reload(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command reload this bot : ", "" + commandPrefix];
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
      this.registerCommand('reload', reloadCommand, []);
    }

    Admin.prototype._exit = function(sender, text, args, storage, textRouter, commandManager) {
      commandManager.send(sender, textRouter, 'exiting the bot...');
      return this.bot.exit();
    };

    Admin.prototype._reload = function(sender, text, args, storage, textRouter, commandManager) {
      if (!this.bot.reload()) {
        return commandManager.send(sender, textRouter, 'it seems the bot can\'t reload itself');
      } else {
        return commandManager.send(sender, textRouter, 'reloading the bot...');
      }
    };

    return Admin;

  })(Imodule);

  module.exports = Admin;

}).call(this);
