(function() {
  var CommandMail, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  CommandMail = (function(_super) {
    __extends(CommandMail, _super);

    function CommandMail(storage) {
      this.storage = storage;
    }

    CommandMail.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var account, accountRule, message, success;
      accountRule = /^[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*$/i;
      if (args.length < 3) {
        return false;
      }
      account = args[1].toLowerCase();
      message = args.slice(2).join(" ");
      if (!accountRule.test(account)) {
        textRouter.notice(sender.sender, "invalid account " + account);
        return false;
      }
      this.addMail(sender.sender, account, message);
      textRouter.notice(sender.sender, "already added nick to mailbox of " + account);
      success = true;
      return success;
    };

    CommandMail.prototype.help = function(commandPrefix) {
      return ["mail someone a message", "he will be recieved when he join this channel", "" + commandPrefix + " account messages.."];
    };

    CommandMail.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return !fromBinding;
    };

    CommandMail.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      if (type === 'join') {
        textRouter.whois(sender.sender, (function(_this) {
          return function(info) {
            var mails, messages;
            if (info.account) {
              mails = _this.getMails(info.account);
              _this.dropMails(info.account);
              if (mails.length > 0) {
                messages = mails.map(function(mail) {
                  return "[" + mail.from + "] " + mail.message;
                });
                return commandManager.sendPv(sender, textRouter, messages);
              }
            } else {
              mails = _this.getMails(sender.sender);
              if (mails.length > 0) {
                return textRouter.notice(sender.sender, "you have " + mails.length + " mails, login to view all mails");
              }
            }
          };
        })(this));
      }
      return true;
    };

    CommandMail.prototype.getMails = function(account) {
      var mailbox, mailboxs;
      account = account.toLowerCase();
      mailboxs = this.storage.get("mailboxs", {});
      mailbox = mailboxs[account];
      mailbox = mailbox || [];
      return mailbox;
    };

    CommandMail.prototype.dropMails = function(account) {
      var mailboxs;
      account = account.toLowerCase();
      mailboxs = this.storage.get("mailboxs", {});
      delete mailboxs[account];
      this.storage.set("mailboxs", mailboxs);
      return true;
    };

    CommandMail.prototype.addMail = function(from, account, message) {
      var mailboxs;
      account = account.toLowerCase();
      mailboxs = this.storage.get("mailboxs", {});
      mailboxs[account] = mailboxs[account] || [];
      mailboxs[account].push({
        from: from,
        message: message
      });
      this.storage.set("mailboxs", mailboxs);
      return true;
    };

    return CommandMail;

  })(Icommand);

  module.exports = CommandMail;

}).call(this);
