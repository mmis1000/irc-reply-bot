(function() {
  var CommandVote, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('./icommand.js');

  CommandVote = (function(_super) {
    __extends(CommandVote, _super);

    function CommandVote(storage, options) {
      this.storage = storage;
      this.options = options;
      this.options = this.options || {};
      this.maxCampaignPerPerson = this.options.maxCampaignPerPerson || 3;
    }

    CommandVote.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var message, success;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(" ");
      message = message.replace(/\\n/g, "\n");
      textRouter.output(message, sender.channal);
      success = true;
      return success;
    };

    CommandVote.prototype.help = function(commandPrefix) {
      console.log("add method to override this!");
      return ["create campaign or vote for campaign, ", "one person can create " + this.maxCampaignPerPerson + " campaign at same time Usage", "" + commandPrefix + " vote [number, campaign number] //view all question", "" + commandPrefix + " vote [number, campaign number] [number, answer] //vote for specified campaign", "" + commandPrefix + " [number, answer]  // vote for newest campaign", "" + commandPrefix + " result [campaign number] //view the campaign result", "" + commandPrefix + " list // show all exist campaign", "#format of answer is something like '12304' one number for one question, 0 for skip", "" + commandPrefix + " create [string,campaign number] [number, duration second, default to 3600, 0 for unlimited] [true, if anonymous]", "" + commandPrefix + " add [number, campaign number] [question] | [answer1] | [answer2] | [answer3]..... ", "//add question, campaign owner only, will remove exist vote", "" + commandPrefix + " delete [campaign number] //delete the campaign, campaign owner only"];
    };

    CommandVote.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return !fromBinding;
    };

    return CommandVote;

  })(Icommand);

  module.exports = CommandVote;

}).call(this);
