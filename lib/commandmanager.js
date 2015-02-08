(function() {
  var CommandManager, EventEmitter, escapeRegex,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  EventEmitter = require('events').EventEmitter;

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  CommandManager = (function(_super) {
    __extends(CommandManager, _super);

    function CommandManager(storage, textRouter) {
      var banCommand, banListCommand, bindAppendCommand, bindCommand, bindListCommand, deopCommand, helpCommand, opCommand, opList, sudoCommand, unbanCommand, unbindCommand;
      this.storage = storage;
      this.identifier = "!";
      this.commandFormat = /^[a-zA-Z].*$/g;
      this.keywordPrefix = "^";
      this.reservedKeyWord = ["help", "op", "deop", "bind", "unbind", "bindlist", "ban", "unban"];
      this.sessionLength = 10 * 60 * 1000;
      this.sessionExpire = {};
      this.defaultOps = [];
      this.commands = [];
      this.commandMap = {};
      this.commandAliasMap = {};
      this.aliasMap = {};
      this.keywords = this.storage.get("keywords", []);
      this.keywordMap = this.storage.get("keywordMap", {});
      helpCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandHelp(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command for print out help message! usage : ", "" + commandPrefix + "    for all commands.", "" + commandPrefix + " [commandName]    for specified command!"];
        },
        hasPermission: function() {
          return true;
        },
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('help', helpCommand, ['?']);
      bindCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBind(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command bind command to keyword! usage : ", "" + commandPrefix + " keyword commandText.."];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            return !fromBinding;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('bind', bindCommand, []);
      bindAppendCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBindAppend(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command append command text to keyword! usage : ", "" + commandPrefix + " keyword commandText.."];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            return !fromBinding;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('bindappend', bindAppendCommand, []);
      unbindCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandUnbind(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command unbind command from keyword! usage : ", "" + commandPrefix + " keyword"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            return !fromBinding;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('unbind', unbindCommand, []);
      bindListCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBindList(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command show  keywords! usage : ", "" + commandPrefix];
        },
        hasPermission: (function(_this) {
          return function() {
            return true;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('bindlist', bindListCommand, []);
      opCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandOp(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command to op someone! usage : ", "" + commandPrefix + " nick"];
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
      this.register('op', opCommand, []);
      deopCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandDeop(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command to deop someone! usage : ", "" + commandPrefix + " nick"];
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
      this.register('deop', deopCommand, []);
      banCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBan(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command unbind command from keyword! usage : ", "" + commandPrefix + " nick"];
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
      this.register('ban', banCommand, []);
      unbanCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandUnban(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command unbind command from keyword! usage : ", "" + commandPrefix + " nick"];
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
      this.register('unban', unbanCommand, []);
      banListCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBanList(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command show banned user! usage : ", "" + commandPrefix];
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
      this.register('banlist', banListCommand, []);
      sudoCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandSudo(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["update current user session to op session! usage : ", "" + commandPrefix + " # login or log out", "" + commandPrefix + " <command text> # exec command as operator"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return true;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('sudo', sudoCommand, []);
      this.defaultRouter = textRouter;
      textRouter.on("input", (function(_this) {
        return function(message, sender) {
          _this.lastChannel = sender.channel;
          _this.lastSender = sender.channel;
          _this.handleRaw(sender, "text", message, textRouter);
          return _this.handleText(sender, message, textRouter);
        };
      })(this));
      textRouter.on("rpl_join", (function(_this) {
        return function(channel, sender) {
          return _this.handleRaw(sender, "join", channel, textRouter);
        };
      })(this));
      textRouter.on("rpl_raw", (function(_this) {
        return function(reply) {
          return _this.handleRaw(null, "raw", reply, textRouter);
        };
      })(this));
      opList = this.storage.get("ops", this.defaultOps);
      if (opList.length === 0) {
        textRouter.on('connect', function() {
          return textRouter.output("[Warning] no op setted, assume everyone has operator permission");
        });
      }
    }

    CommandManager.prototype.handleRaw = function(sender, type, contents, textRouter) {
      var command, event, _i, _len, _ref;
      event = {
        cancelled: false
      };
      _ref = this.commands;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        command = _ref[_i];
        this.commandMap[command].handleRaw(sender, type, contents, textRouter, this, event);
      }
      return event;
    };

    CommandManager.prototype.handleText = function(sender, text, textRouter, isCommand, fromBinding) {
      var args, argsText, command, commandManager, e, i, keyword, regex, result, _i, _j, _len, _len1, _ref, _ref1;
      if (isCommand == null) {
        isCommand = false;
      }
      if (fromBinding == null) {
        fromBinding = false;
      }
      commandManager = this;

      /*
      if sender.sender in @storage.get "banList", []
        return false
       */
      _ref = (this.storage.get("banList")) || [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        try {
          if (0 <= sender.sender.search(new RegExp(i, "gi"))) {
            return false;
          }
        } catch (_error) {}
      }
      result = false;
      if ((text.search(escapeRegex(this.identifier))) !== 0 && !isCommand) {
        fromBinding = true;
        _ref1 = this.keywords;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          keyword = _ref1[_j];
          try {
            if ((text.search(keyword)) >= 0) {
              regex = new RegExp(keyword);
              text = (regex.exec(text))[0].replace(regex, this.keywordMap[keyword]);
              result = true;
              break;
            }
          } catch (_error) {
            e = _error;
            console.log(e);
          }
        }
      } else {
        result = true;
      }
      if (!result) {
        return false;
      }
      if (0 === text.search(escapeRegex(this.identifier))) {
        argsText = text.replace(this.identifier, "");
      }
      argsText = argsText.replace(/^\s+/g, "");
      args = argsText.split(" ");
      command = args[0];
      if (!command.match(this.commandFormat)) {
        return false;
      }
      if ((this.commands.indexOf(command)) < 0) {
        if (this.aliasMap[command]) {
          command = this.aliasMap[command];
        } else {
          this._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "no such command : " + command + " \ntype '" + this.identifier + " help' for help!");
          return false;
        }
      }
      if ((this.handleRaw(sender, "before_permission", [sender, text, args, this.storage, textRouter, commandManager, fromBinding], textRouter)).cancelled) {
        return false;
      }
      if (this.commandMap[command].hasPermission(sender, text, args, this.storage, textRouter, commandManager, fromBinding)) {
        if ((this.handleRaw(sender, "before_command", [sender, text, args, this.storage, textRouter, commandManager, fromBinding], textRouter)).cancelled) {
          return false;
        }
        if (!this.commandMap[command].handle(sender, text, args, this.storage, textRouter, commandManager, fromBinding)) {
          return this._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, this.commandMap[command].help("" + this.identifier + " " + command));
        }
      } else {
        return this._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, 'Access Denied! You may have to login or this command was not allowed to be exec from keyword binding.');
      }
    };

    CommandManager.prototype.register = function(keyword, iCommand, aliasList) {
      var command, _i, _len, _results;
      this.commands.push(keyword);
      this.commandMap[keyword] = iCommand;
      this.commandAliasMap[keyword] = aliasList;
      _results = [];
      for (_i = 0, _len = aliasList.length; _i < _len; _i++) {
        command = aliasList[_i];
        _results.push(this.aliasMap[command] = keyword);
      }
      return _results;
    };

    CommandManager.prototype.isBanned = function(sender) {
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

    CommandManager.prototype.isOp = function(name, noSession) {
      var authed, opList;
      opList = this.storage.get("ops", this.defaultOps);
      if (opList.length === 0) {
        return true;
      }
      if (noSession) {
        return __indexOf.call(opList, name) >= 0;
      }
      authed = this.sessionExpire[name] && (this.sessionExpire[name] >= Date.now() || this.sessionExpire[name] === -1);
      if (this.sessionExpire[name] < Date.now() || this.sessionExpire[name] === -1) {
        delete this.sessionExpire[name];
      }
      return authed;
    };

    CommandManager.prototype.login = function(name, once) {
      if (once) {
        return this.sessionExpire[name] = -1;
      } else {
        return this.sessionExpire[name] = Date.now() + this.sessionLength;
      }
    };

    CommandManager.prototype.logout = function(name, once) {
      return delete this.sessionExpire[name];
    };

    CommandManager.prototype._sendToPlace = function(textRouter, from, to, channel, message) {
      if (0 === to.search(/^#/)) {
        return textRouter.output(message, to);
      } else {
        return textRouter.output(message, from);
      }
    };

    CommandManager.prototype.send = function(sender, router, text) {
      return this._sendToPlace(router, sender.sender, sender.target, sender.channel, text);
    };

    CommandManager.prototype.sendPv = function(sender, router, text) {
      return router.output(text, sender.sender);
    };

    CommandManager.prototype.sendChannel = function(sender, router, text) {
      return router.output(text, sender.channel);
    };

    CommandManager.prototype.parseArgs = function(text) {
      var args, argsText;
      argsText = 0 === (text.search(escapeRegex(this.identifier))) ? text.replace(escapeRegex(this.identifier), "") : text;
      argsText = argsText.replace(/^\s*/g, "");
      args = argsText.split(" ");
      return args;
    };

    CommandManager.prototype._commandHelp = function(sender, text, args, storage, textRouter, commandManager) {
      var command, index, message, _i, _len, _ref;
      if (args.length > 2) {
        return false;
      }
      if (args.length === 1) {
        message = "";
        _ref = this.commands;
        for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
          command = _ref[index];
          message += command;
          if (this.commandAliasMap[command].length > 0) {
            message += "[" + (this.commandAliasMap[command].join(', ')) + "]";
          }
          if (index !== this.commands.length - 1) {
            message += ", ";
          }
        }
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "all commands : " + message + "\nuse { " + this.identifier + "help [command] } to see usage of command");
      } else {
        if ((this.commands.indexOf(args[1])) < 0) {
          commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "no such command!");
        } else {
          commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, this.commandMap[args[1]].help("" + this.identifier + " " + args[1]));
        }
      }
      return true;
    };

    CommandManager.prototype._commandBind = function(sender, text, args, storage, textRouter, commandManager) {
      var atEnd, atHead, keyword, realLength;
      if (args.length < 3) {
        return false;
      }
      keyword = args[1];
      if (keyword.length < 1) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "\u000304you need to bind at least one word!");
        return true;
      }
      if (0 === keyword.search("\\^")) {
        atHead = true;
        keyword = keyword.slice(1);
      } else {
        atHead = false;
      }
      if (keyword.length - 1 === keyword.search("\\$")) {
        atEnd = true;
        keyword = keyword.slice(0, keyword.length - 1);
      } else {
        atEnd = false;
      }
      realLength = keyword.length;
      if (!this.isOp(sender.sender)) {
        keyword = keyword.replace(/\\/g, "\\\\");
        keyword = keyword.replace(/\./g, "\\.");
        keyword = keyword.replace(/\*/g, "\\*");
        keyword = keyword.replace(/\+/g, "\\+");
        keyword = keyword.replace(/\?/g, "\\?");
        keyword = keyword.replace(/\[/g, "\\[");
        keyword = keyword.replace(/\]/g, "\\]");
        keyword = keyword.replace(/\{/g, "\\{");
        keyword = keyword.replace(/\}/g, "\\}");
        keyword = keyword.replace(/\(/g, "\\(");
        keyword = keyword.replace(/\)/g, "\\)");
        keyword = keyword.replace(/\|/g, "\\|");
        keyword = keyword.replace(/\^/g, "\\^");
        keyword = keyword.replace(/\$/g, "\\$");
        keyword = keyword.replace(/\\\\\\s/g, "\\s");
        atHead = true;
        if (realLength < 3) {
          atEnd = true;
        }
      }
      text = args.slice(2).join(" ");
      if (atHead) {
        keyword = "^" + keyword;
      }
      if (atEnd) {
        keyword = "" + keyword + "$";
      }
      if (0 > this.keywords.indexOf(keyword)) {
        if (this.isOp(sender.sender)) {
          this.keywords.unshift(keyword);
        } else {
          this.keywords.push(keyword);
        }
      }
      this.keywordMap[keyword] = text;
      this.storage.set("keywords", this.keywords);
      this.storage.set("keywordMap", this.keywordMap);
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "binded " + keyword + " to " + text);
      return true;
    };

    CommandManager.prototype._commandBindAppend = function(sender, text, args, storage, textRouter, commandManager) {
      var keyword;
      if (args.length < 3) {
        return false;
      }
      keyword = args[1];
      keyword = keyword.replace(/\\s/g, " ");
      if (keyword.length < 1) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "\u000304you need to identify at least one word!");
        return true;
      }
      if ((!this.isOp(sender.sender)) && ((keyword.search("\\" + this.keywordPrefix)) !== 0)) {
        keyword = this.keywordPrefix + keyword;
      }
      text = args.slice(2).join(" ");
      if (0 > this.keywords.indexOf(keyword)) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "\u000304No such keyword!");
        return true;
      }
      this.keywordMap[keyword] += text;
      this.storage.set("keywordMap", this.keywordMap);
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "appended " + text + " to " + keyword);
      return true;
    };

    CommandManager.prototype._commandUnbind = function(sender, text, args, storage, textRouter, commandManager) {
      var index, keyword;
      if (null !== /^"(.+)"$/.exec(args.slice(1).join(" "))) {
        args[1] = (/^"(.+)"$/.exec(args.slice(1).join(" ")))[1];
        args = args.slice(0, 2);
      }
      if (args.length !== 2) {
        return false;
      }
      keyword = args[1];
      if ((!this.isOp(sender.sender)) && ((keyword.search("\\" + this.keywordPrefix)) !== 0)) {
        keyword = this.keywordPrefix + keyword;
      }
      index = this.keywords.indexOf(keyword);
      if (0 <= index) {
        this.keywords.splice(index, 1);
        delete this.keywordMap[keyword];
      }
      this.storage.set("keywords", this.keywords);
      this.storage.set("keywordMap", this.keywordMap);
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "unbinded commands from " + keyword);
      return true;
    };

    CommandManager.prototype._commandBindList = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 1) {
        return false;
      }
      textRouter.output("all used keywords : " + (this.keywords.join(', ')), sender.sender);
      return true;
    };

    CommandManager.prototype._commandOp = function(sender, text, args, storage, textRouter, commandManager) {
      var index, ops;
      if (args.length !== 2) {
        return false;
      }
      ops = this.storage.get("ops", this.defaultOps);
      index = ops.indexOf(args[1]);
      if (0 > index) {
        ops.push(args[1]);
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "oped " + args[1]);
      } else {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "" + args[1] + " is already op!");
      }
      this.storage.set("ops", ops);
      return true;
    };

    CommandManager.prototype._commandDeop = function(sender, text, args, storage, textRouter, commandManager) {
      var index, ops;
      if (args.length !== 2) {
        return false;
      }
      ops = this.storage.get("ops", this.defaultOps);
      index = ops.indexOf(args[1]);
      if (0 > index) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "" + args[1] + " is not op");
      } else {
        ops.splice(index, 1);
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "deoped " + args[1]);
      }
      this.storage.set("ops", ops);
      return true;
    };

    CommandManager.prototype._commandBan = function(sender, text, args, storage, textRouter, commandManager) {
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

    CommandManager.prototype._commandUnban = function(sender, text, args, storage, textRouter, commandManager) {
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

    CommandManager.prototype._commandBanList = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 1) {
        return false;
      }
      textRouter.output("all bannned user : " + (this.storage.get('banList')), sender.sender);
      return true;
    };

    CommandManager.prototype._commandSudo = function(sender, text, args, storage, textRouter, commandManager) {
      var command;
      if (args.length !== 1) {
        command = args.slice(1).join(' ');
      }
      if (command && (args[0] === (this.parseArgs(command))[0])) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "Sorry, but it does'nt make sence to exec " + args[0] + " from " + args[0] + ".");
        return true;
      }
      if (this.isOp(sender.sender)) {
        if (command) {
          this.handleText(sender, command, textRouter, true);
        } else {
          commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "logout successfully");
          this.logout(sender.sender);
        }
        return true;
      }
      textRouter.whois(sender.sender, (function(_this) {
        return function(info) {
          if (_this.isOp(info.account, true)) {
            if (command) {
              _this.login(sender.sender);
              _this.handleText(sender, command, textRouter, true);
              return _this.logout(sender.sender);
            } else {
              _this.login(sender.sender);
              return commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "login successfully");
            }
          } else {
            return commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "access denied");
          }
        };
      })(this));
      return true;
    };

    return CommandManager;

  })(EventEmitter);

  module.exports = CommandManager;

}).call(this);
