(function() {
  var CommandSay, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandSay = (function(superClass) {
    extend(CommandSay, superClass);

    function CommandSay(storage1) {
      this.storage = storage1;
      this.maxRecord = 500;
      this.defaultPageShow = 10;
      this.userPageShowMax = 20;
      this.logs = this.storage.get("talks", []);
    }

    CommandSay.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var list;
      if (args.length < 2) {
        return false;
      }
      list = this.logs;
      if (!commandManager.isOp(sender.sender)) {
        list = list.filter(function(obj) {
          return !obj["private"];
        });
      }
      switch (args[1]) {
        case "show":
          return this._showlog(sender, text, args, storage, textRouter, commandManager, list);
        case "find":
          return this._findlog(sender, text, args, storage, textRouter, commandManager, list);
        default:
          return false;
      }
    };

    CommandSay.prototype._showlog = function(sender, text, args, storage, textRouter, commandManager, list) {
      var date, j, len, pageNumber, record, recordsPerPage, ref, replys, result;
      if (args.length > 4) {
        return false;
      }
      pageNumber = args[2] ? parseInt(args[2]) : 1;
      recordsPerPage = args[3] ? parseInt(args[3]) : this.defaultPageShow;
      if (isNaN(pageNumber)) {
        return false;
      }
      if (isNaN(recordsPerPage)) {
        return false;
      }
      if (!commandManager.isOp(sender.sender)) {
        if (recordsPerPage > this.userPageShowMax) {
          recordsPerPage = this.userPageShowMax;
        }
      }
      result = this._pagelog(list, recordsPerPage, pageNumber);
      replys = [];
      ref = result.list;
      for (j = 0, len = ref.length; j < len; j++) {
        record = ref[j];
        date = new Date(record.time);
        replys.push((date.getFullYear()) + "/" + (date.getMonth() + 1) + "/" + (date.getDate()) + "-" + (date.getHours()) + ":" + (date.getMinutes()) + ":" + (date.getSeconds()) + " " + record.from + " => " + record.to + " : " + record.message);
      }
      replys.push("page " + result.pageNumber + " of " + result.allPage);
      textRouter.output(replys, sender.sender);
      return true;
    };

    CommandSay.prototype._findlog = function(sender, text, args, storage, textRouter, commandManager, list) {
      var error, pageNumber, recordsPerPage, regex;
      if (args.length > 6 || args.length < 4) {
        return false;
      }
      if (0 > ["sender", "text", "target"].indexOf(args[2])) {
        return false;
      }
      pageNumber = args[4] ? parseInt(args[4]) : 1;
      recordsPerPage = args[5] ? parseInt(args[5]) : this.defaultPageShow;
      if (isNaN(pageNumber)) {
        return false;
      }
      if (isNaN(recordsPerPage)) {
        return false;
      }
      try {
        regex = new RegExp(args[3]);
      } catch (error) {
        textRouter.output("\u000304invalid regex", sender.sender);
        return true;
      }
      switch (args[2]) {
        case "sender":
          list = list.filter(function(obj) {
            return 0 <= obj.from.search(regex);
          });
          break;
        case "text":
          list = list.filter(function(obj) {
            return 0 <= obj.message.search(regex);
          });
          break;
        case "target":
          list = list.filter(function(obj) {
            return 0 <= obj.to.search(regex);
          });
      }
      return this._showlog(sender, text, [args[0], "show", args[4], args[5]], storage, textRouter, commandManager, list);
    };

    CommandSay.prototype._pagelog = function(list, itemPerPage, pageNumber) {
      var filteredList, i, indexEnd, indexStart, newList, totalPage;
      totalPage = Math.ceil(list.length / itemPerPage);
      indexStart = list.length - pageNumber * itemPerPage;
      indexEnd = indexStart + itemPerPage;
      indexStart = indexStart >= 0 ? indexStart : 0;
      indexEnd = indexEnd >= 0 ? indexEnd : 0;
      indexStart = indexStart <= list.length ? indexStart : list.length;
      indexEnd = indexEnd <= list.length ? indexEnd : list.length;
      newList = [];
      i = indexStart;
      while (i < indexEnd) {
        newList.push(list[i]);
        i++;
      }
      filteredList = {
        list: newList,
        pageNumber: pageNumber,
        allPage: totalPage
      };
      return filteredList;
    };

    CommandSay.prototype.help = function(commandPrefix) {
      return ["view recent talks, this command will force send to you instead of channel ", "Usage:", commandPrefix + " show [page, default to 1 if omit] [records per page, default to " + this.defaultPageShow + " if omit]", commandPrefix + " find [sender/text/target] [regex] [page, default to 1 if omit] [records per page, default to " + this.defaultPageShow + " if omit]"];
    };

    CommandSay.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    CommandSay.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      var args, isPrivate;
      if (type !== "text") {
        return false;
      }
      args = commandManager.parseArgs(content);
      if (args[0] === "log") {
        return false;
      }
      isPrivate = 0 !== (sender.target.search(/#/));
      this.logs.push({
        time: Date.now(),
        from: sender.sender,
        to: sender.target,
        "private": isPrivate,
        message: content
      });
      this.storage.set("talks", this.logs);
      return true;
    };

    return CommandSay;

  })(Icommand);

  module.exports = CommandSay;

}).call(this);
