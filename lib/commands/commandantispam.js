(function() {
  var CommandAntiSpam, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  CommandAntiSpam = (function(_super) {
    __extends(CommandAntiSpam, _super);

    function CommandAntiSpam() {
      this.defaultData = {
        mode: {
          channelSpam: true,
          commandSpam: true
        },
        config: {
          channelSpam: {
            autoSilent: true,
            silentTimeSecond: 600,
            timeRangeSecond: 10,
            warningLevel: 10,
            maxLevel: 15,
            notify: true
          },
          channelSpam: {
            throttle: true,
            timeRangeSecond: 60,
            maxLevel: 15,
            notify: true
          }
        },
        ignore: [],
        notify: []
      };
    }

    CommandAntiSpam.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var message, success;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(" ");
      message = message.replace(/\\n/g, "\n");
      commandManager.send(sender, textRouter, message);
      success = true;
      return success;
    };

    CommandAntiSpam.prototype.help = function(commandPrefix) {
      return ["anti spam feature , Usage", "" + commandPrefix + " mode #get all current feature status", "" + commandPrefix + " mode set {feature} [on/off] #toggle feature", "" + commandPrefix + " ignore #get all ignored users", "" + commandPrefix + " ignore add {nick} #ignore some user", "" + commandPrefix + " ignore remove {nick} #don't ignore some user", "" + commandPrefix + " ignore drop # drop ignored users list", "" + commandPrefix + " config #get all configs", "" + commandPrefix + " config set {settingName} {value} #set config", "" + commandPrefix + " notify #get all users to notify", "" + commandPrefix + " notify add {nick} #add user to notify", "" + commandPrefix + " notify remove {nick} #remove user to notify", "" + commandPrefix + " notify drop #drop users to notify"];
    };

    CommandAntiSpam.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return commandManager.isOp(sender.sender);
    };

    CommandAntiSpam.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      if (type !== "text") {
        return false;
      }
    };

    return CommandAntiSpam;

  })(Icommand);

  module.exports = CommandAntiSpam;

}).call(this);
