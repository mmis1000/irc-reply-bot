(function() {
  var CommandTranslate, Icommand, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  request = require('request');

  CommandTranslate = (function(_super) {
    __extends(CommandTranslate, _super);

    function CommandTranslate() {}

    CommandTranslate.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var done, langPair, message, options, success;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      langPair = 'en|zh';
      if (args[1] === '-l') {
        langPair = args[2];
        message = args.slice(3).join(" ");
      } else {
        message = args.slice(1).join(" ");
      }
      options = {
        timeout: 10000,
        uri: "http://api.mymemory.translated.net/get?q=" + (encodeURIComponent(message)) + "&langpair=" + (encodeURIComponent(langPair)),
        json: true
      };
      done = textRouter.async();
      request(options, function(error, res, body) {
        if (error) {
          commandManager.send(sender, textRouter, 'translate: ' + error.toString());
        } else {
          commandManager.send(sender, textRouter, 'translate: ' + body.responseData.translatedText);
        }
        return done();
      });
      success = true;
      return success;
    };

    CommandTranslate.prototype.help = function(commandPrefix) {
      return ["make this bot to translate some message. the languagePair is ISO_639-1 language seperated by |", "Usage :", "" + commandPrefix + " (-l languagePair) messages..", "For example:", "{commandPrefix} test", "{commandPrefix} -l en|ja test"];
    };

    CommandTranslate.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandTranslate;

  })(Icommand);

  module.exports = CommandTranslate;

}).call(this);
