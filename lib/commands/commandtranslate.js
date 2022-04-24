(function() {
  var CommandTranslate, Icommand, request;

  Icommand = require('../icommand.js');

  request = require('request');

  CommandTranslate = class CommandTranslate extends Icommand {
    constructor() {
      super();
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
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
        uri: `http://api.mymemory.translated.net/get?q=${encodeURIComponent(message)}&langpair=${encodeURIComponent(langPair)}`,
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
    }

    help(commandPrefix) {
      //console.log "add method to override this!"
      return ["make this bot to translate some message. the languagePair is ISO_639-1 language seperated by |", "Usage :", `${commandPrefix} (-l languagePair) messages..`, "For example:", "{commandPrefix} test", "{commandPrefix} -l en|ja test"];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    }

  };

  module.exports = CommandTranslate;

}).call(this);
