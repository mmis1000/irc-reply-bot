(function() {
  var CommandMail, Icommand;

  Icommand = require('../icommand.js');

  CommandMail = class CommandMail extends Icommand {
    constructor(storage1) {
      super();
      this.storage = storage1;
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
      var account, accountRule, message, success;
      accountRule = /^[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*$/i;
      if (args.length < 3) {
        return false;
      }
      account = args[1].toLowerCase();
      message = args.slice(2).join(" ");
      if (!accountRule.test(account)) {
        textRouter.notice(sender.sender, `invalid account ${account}`);
        return false;
      }
      this.addMail(sender.sender, account, message);
      textRouter.notice(sender.sender, `already added nick to mailbox of ${account}`);
      success = true;
      return success;
    }

    help(commandPrefix) {
      //console.log "add method to override this!"
      return ["mail someone a message", "he will be recieved when he join this channel", `${commandPrefix} account messages..`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return !fromBinding;
    }

    handleRaw(sender, type, content, textRouter, commandManager) {
      if (type === 'join') {
        textRouter.whois(sender.sender, (info) => {
          var mails, messages;
          if (info.account) {
            mails = this.getMails(info.account);
            this.dropMails(info.account);
            if (mails.length > 0) {
              messages = mails.map(function(mail) {
                return `[${mail.from}] ${mail.message}`;
              });
              return commandManager.sendPv(sender, textRouter, messages);
            }
          } else {
            mails = this.getMails(sender.sender);
            if (mails.length > 0) {
              return textRouter.notice(sender.sender, `you have ${mails.length} mails, login to view all mails`);
            }
          }
        });
      }
      return true;
    }

    getMails(account) {
      var mailbox, mailboxs;
      account = account.toLowerCase();
      mailboxs = this.storage.get("mailboxs", {});
      mailbox = mailboxs[account];
      mailbox = mailbox || [];
      return mailbox;
    }

    dropMails(account) {
      var mailboxs;
      account = account.toLowerCase();
      mailboxs = this.storage.get("mailboxs", {});
      delete mailboxs[account];
      this.storage.set("mailboxs", mailboxs);
      return true;
    }

    addMail(from, account, message) {
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
    }

  };

  module.exports = CommandMail;

}).call(this);
