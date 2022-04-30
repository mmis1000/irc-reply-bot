var CommandRegex, Icommand;

Icommand = require('../icommand.js');

CommandRegex = class CommandRegex extends Icommand {
  constructor(storage1) {
    super();
    this.storage = storage1;
    this.record = 10;
    this.lastMessages = {};
    this.locale = {
      preMean: '的',
      mean: '意思',
      postMean: '是：',
      think: '認為'
    };
    this.maxLoop = 50;
    this.enabled = {};
    if (this.storage) {
      this.enabled = this.storage.get('regexReplace', {});
      if ('object' !== typeof this.enabled) {
        this.enabled = {};
      }
    }
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
    var success;
    if (args.length !== 2 || 0 > ['on', 'off'].indexOf(args[1])) {
      return false;
    }
    if (args[1] === 'on') {
      this.enabled[sender.target] = true;
      if (this.storage) {
        this.storage.set('regexReplace', this.enabled);
      }
      commandManager.send(sender, textRouter, `regex module has been enabled for ${sender.target}`);
    } else {
      this.enabled[sender.target] = false;
      if (this.storage) {
        this.storage.set('regexReplace', this.enabled);
      }
      commandManager.send(sender, textRouter, `regex module has been disabled for ${sender.target}`);
    }
    success = true;
    return success;
  }

  help(commandPrefix) {
    return ["Use regex to replace words. ", "The regex and replacedBy are actully passed into js's replace method directly.", "Please see http://www.w3schools.com/jsref/jsref_replace.asp for more detail.", "only \\ and / in replacedBy need to be escaped", "Usage:", `${commandPrefix} [on|off] #toggle this module`, "s/regex/replacedBy[/modifiers] #replace words in the sentence you said", "{nick} , s/regex/replacedBy/modifiers #replace words in the sentence others said, Use : after nick is also accepted, the space next to , or : is also optional", "Example:", "s/[a-zA-Z]// #remove first english alphabet found in yours words", "jame: s/[a-zA-Z]/*/g #replace all english alphabet in jame's words with *"];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager) {
    return commandManager.isOp(sender.sender);
  }

  handleRaw(sender, type, content, textRouter, commandManager) {
    var changesMessage, index, j, len, maybeACommand, message, ref, referredBy, result, sayer, tags;
    //console.log sender, @enabled
    if (!sender || !this.enabled[sender.target]) {
      return true;
    }
    if (type !== "message" || !content.text || content.medias.length > 0) {
      return true;
    }
    
    //console.log content
    if (0 !== sender.target.search('#')) {
      //who really cares about those messages sent by private message?
      sender.target.search('#');
      return;
    }
    tags = /^([a-zA-Z0-9_@]+)(?:\s?[,:]\s?|\s)(.+)$/.exec(content.text);
    maybeACommand = false;
    if (!tags) {
      result = this._parseCommand(content.text);
      maybeACommand = !!content.text.match(/^s\//);
      sayer = sender.sender;
    } else {
      result = this._parseCommand(tags[2]);
      sayer = textRouter.fromDisplayName(tags[1]);
      maybeACommand = !!tags[2].match(/^s\//);
      referredBy = sender.sender;
    }
    if (content.replyTo) {
      result = this._parseCommand(content.text);
      sayer = content.replyTo.sender.sender;
      referredBy = sender.sender;
    }
    
    //console.log result, @lastMessages[sayer], maybeACommand
    if (!result || (!this.lastMessages[sayer] && !content.replyTo) || commandManager.isBanned(sender)) {
      if (!maybeACommand) {
        this.lastMessages[sender.sender] = this.lastMessages[sender.sender] || [];
        this.lastMessages[sender.sender].unshift(content.text);
        this.lastMessages[sender.sender] = this.lastMessages[sender.sender].slice(0, +(this.record - 1) + 1 || 9e9);
      }
      return true;
    }
    if (content.replyTo) {
      if (false !== this._replaceText(content.replyTo.message.text, result)) {
        changesMessage = this._replaceText(content.replyTo.message.text, result);
        if (sender.sender !== content.replyTo.sender.sender) {
          commandManager.send(sender, textRouter, `${textRouter.toDisplayName(referredBy)} ${this.locale.think} ${textRouter.toDisplayName(content.replyTo.sender.sender)} ${this.locale.preMean}\u0002${this.locale.mean}\u000f${this.locale.postMean} \u001d${changesMessage}`);
        } else {
          commandManager.send(sender, textRouter, `${textRouter.toDisplayName(sayer)} ${this.locale.preMean}\u0002${this.locale.mean}\u000f${this.locale.postMean} \u001d${changesMessage}`);
        }
      }
      return true;
    }
    ref = this.lastMessages[sayer];
    for (index = j = 0, len = ref.length; j < len; index = ++j) {
      message = ref[index];
      //if message.match result.regex
      if (false !== this._replaceText(message, result)) {
        changesMessage = this._replaceText(message, result);
        this.lastMessages[sayer][index] = changesMessage;
        if (!referredBy) {
          textRouter.output(`${textRouter.toDisplayName(sayer)} ${this.locale.preMean}\u0002${this.locale.mean}\u000f${this.locale.postMean} \u001d${changesMessage}`, sender.target);
        } else {
          textRouter.output(`${textRouter.toDisplayName(referredBy)} ${this.locale.think} ${textRouter.toDisplayName(sayer)} ${this.locale.preMean}\u0002${this.locale.mean}\u000f${this.locale.postMean} \u001d${changesMessage}`, sender.target);
        }
        break;
      }
    }
    return true;
  }

  _parseCommand(text) {
    var e, index, item, j, len, line, modifiers, regex, regexPairs, replace;
    line = text.match(/(\\u....|\\x..|\\.|.)/g);
    if (line[0] !== 's' || line[1] !== '/') {
      return false;
    }
    line = this._splitArray(line.slice(2), '/');
    if (line.length % 2 === 0) {
      line.push([]);
    }
    
    //console.log line, line.length, line.length % 2 == 0
    if (line.length < 3) {
      return false;
    }
    line = line.map(function(i) {
      return i.join('');
    });
    modifiers = line.slice(-1)[0];
    line = line.slice(0, -1);
    regexPairs = [];
    regexPairs.flags = modifiers;
    for (index = j = 0, len = line.length; j < len; index = ++j) {
      item = line[index];
      if (index % 2 !== 0) {
        continue;
      }
      try {
        regex = new RegExp(line[index], modifiers);
        replace = line[index + 1].replace(/\\(\/|\\)/g, '$1');
        regexPairs.push({
          regex: regex,
          replace: replace
        });
      } catch (error) {
        e = error;
        console.log(e);
      }
    }
    //console.log regexPairs
    if (regexPairs.length === 0) {
      return false;
    }
    return regexPairs;
  }

  _replaceText(text, regexPairs) {
    var index, j, len, looped, maxLoop, modified, originalText, pair, useLoop;
    useLoop = 0 <= regexPairs.flags.search('g');
    useLoop = useLoop && (regexPairs.length > 1);
    maxLoop = useLoop ? this.maxLoop : 1;
    //console.log "max loop #{maxLoop}, useLoop #{useLoop}"
    originalText = '';
    looped = 0;
    while (maxLoop > looped++) {
      originalText = text;
      for (index = j = 0, len = regexPairs.length; j < len; index = ++j) {
        pair = regexPairs[index];
        text = text.replace(pair.regex, pair.replace);
      }
      if (originalText !== text) {
        modified = true;
      }
      if (originalText === text) {
        break;
      }
    }
    if (modified) {
      return text;
    }
    return false;
  }

  _splitArray(arr, seperator) {
    var i, newI, temp;
    temp = [];
    i = 0;
    while (true) {
      newI = arr.indexOf(seperator, i);
      if (newI === -1) {
        temp.push(arr.slice(i, +(arr.length - 1) + 1 || 9e9));
        break;
      }
      if (newI - 1 >= 0) {
        temp.push(arr.slice(i, +(newI - 1) + 1 || 9e9));
      } else {
        temp.push([]);
      }
      i = newI + 1;
    }
    return temp;
  }

};

module.exports = CommandRegex;
