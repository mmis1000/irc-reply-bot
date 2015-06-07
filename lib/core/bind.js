(function() {
  var Bind, BindHelper, Imodule, escapeRegex, helper,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Imodule = require('../imodule.js');

  BindHelper = require('./bindhelper');

  helper = new BindHelper;

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  Bind = (function(_super) {
    __extends(Bind, _super);

    function Bind() {
      Bind.__super__.constructor.apply(this, arguments);
      this.name = 'bind';
    }

    Bind.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      var result;
      if (type === 'init') {
        this.storage = commandManager.getStorage();
        this.manager = commandManager;
        this._init();
      }
      if (type === 'before_iscommand') {
        result = this._getBinding(content.text, commandManager, sender, textRouter);
        if (result !== false) {
          content.text = result;
          content.isCommand = true;
          content.fromBinding = true;
        }
      }
      return true;
    };

    Bind.prototype._getBinding = function(original, commandManager, sender, router) {
      var e, keyword, newKeyword, regex, replace, result, text, _i, _len, _ref;
      result = false;
      if ((original.search(escapeRegex(commandManager.identifier))) !== 0) {
        _ref = this.keywords;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          keyword = _ref[_i];
          newKeyword = helper.compileText(keyword, sender, commandManager, router);
          try {
            if ((original.search(newKeyword)) >= 0) {
              regex = new RegExp(newKeyword);
              replace = helper.compileText(this.keywordMap[keyword], sender, commandManager, router);
              text = (regex.exec(original))[0].replace(regex, replace);
              break;
            }
          } catch (_error) {
            e = _error;
            console.log(e);
          }
        }
      }
      return text || false;
    };

    Bind.prototype._init = function() {
      var bindAppendCommand, bindCommand, bindListCommand, unbindCommand;
      this.keywords = this.storage.get("keywords", []);
      this.keywordMap = this.storage.get("keywordMap", {});
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
      this.registerCommand('add', bindCommand, []);
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
      this.registerCommand('append', bindAppendCommand, []);
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
      this.registerCommand('remove', unbindCommand, []);
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
      return this.registerCommand('list', bindListCommand, []);
    };

    Bind.prototype._commandBind = function(sender, text, args, storage, textRouter, commandManager) {
      var keyword;
      if (args.length < 3) {
        return false;
      }
      keyword = args[1];
      if (keyword.length < 1) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "\u000304you need to bind at least one word!");
        return true;
      }

      /*
      if  0 == keyword.search "\\^"
        atHead = true
        keyword = keyword.slice 1
      else
        atHead = false
      
      
      if keyword.length - 1 == keyword.search "\\$" 
        atEnd = true
        keyword = keyword.slice 0, keyword.length - 1
      else
        atEnd = false
      realLength = keyword.length
      
      if not @manager.isOp sender.sender
        keyword = escapeRegex keyword
        
        keyword = keyword.replace /\\\\\\s/g, "\\s"
        atHead = true
        if realLength < 3
          atEnd = true
      
      text = args[2..].join " "
      
      if atHead
        keyword = "^#{keyword}"
      
      if atEnd
        keyword = "#{keyword}$"
       */
      if (!this.manager.isOp(sender.sender)) {
        keyword = helper.escapeRegex(keyword);
      }
      text = args.slice(2).join(" ");
      if (0 > this.keywords.indexOf(keyword)) {
        if (this.manager.isOp(sender.sender)) {
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

    Bind.prototype._commandBindAppend = function(sender, text, args, storage, textRouter, commandManager) {
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
      if ((!this.manager.isOp(sender.sender)) && ((keyword.search(/\^/)) !== 0)) {
        keyword = "^" + keyword;
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

    Bind.prototype._commandUnbind = function(sender, text, args, storage, textRouter, commandManager) {
      var index, keyword;
      if (null !== /^"(.+)"$/.exec(args.slice(1).join(" "))) {
        args[1] = (/^"(.+)"$/.exec(args.slice(1).join(" ")))[1];
        args = args.slice(0, 2);
      }
      if (args.length !== 2) {
        return false;
      }
      keyword = args[1];
      if ((!this.manager.isOp(sender.sender)) && ((keyword.search(/\^/)) !== 0)) {
        keyword = "^" + keyword;
      }
      index = this.keywords.indexOf(keyword);
      if (0 <= index) {
        this.keywords.splice(index, 1);
        delete this.keywordMap[keyword];
      } else {
        commandManager.send(sender, textRouter, "keyword " + keyword + " not found");
        return true;
      }
      this.storage.set("keywords", this.keywords);
      this.storage.set("keywordMap", this.keywordMap);
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "unbinded commands from " + keyword);
      return true;
    };

    Bind.prototype._commandBindList = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 1) {
        return false;
      }
      textRouter.output("all used keywords : " + (this.keywords.join(', ')), sender.sender);
      return true;
    };

    return Bind;

  })(Imodule);

  module.exports = Bind;

}).call(this);
