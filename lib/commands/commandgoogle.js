(function() {
  var CommandGoogle, Icommand, google,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  google = require('google');

  CommandGoogle = (function(_super) {
    __extends(CommandGoogle, _super);

    function CommandGoogle(options) {
      options = options || {};
      if (options.tld) {
        google.tld = options.tld;
      }
      if (options.lang) {
        google.lang = options.lang;
      }
      if (options.nextText) {
        google.nextText = options.nextText;
      }
    }

    CommandGoogle.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var done, searchText;
      if (args.length === 1 || /^\s+$/.test(args.slice(1).join(' '))) {
        return false;
      }
      done = textRouter.async();
      searchText = args.slice(1).join(' ');
      google(searchText, function(err, next, links) {
        done();
        if (err) {
          commandManager.send(sender, textRouter, err.toString());
          return;
        }
        return commandManager.send(sender, textRouter, links.filter(function(link) {
          return link.link !== null;
        }).slice(0, 3).map(function(link) {
          return "[" + link.title + "] " + link.link + "\r\n" + (link.description.replace(/\r?\n/g, ''));
        }).join("\r\n\r\n"));
      });
      return true;
    };

    CommandGoogle.prototype.help = function(commandPrefix) {
      return ["make this bot to say some message", "this command will send to you according to where you exec this command, Usage", "" + commandPrefix + " [-rj] messages..", "flags:", "r: raw string, no line break", "j: full js format string"];
    };

    CommandGoogle.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandGoogle;

  })(Icommand);

  module.exports = CommandGoogle;

}).call(this);
