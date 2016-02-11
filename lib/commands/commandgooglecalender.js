(function() {
  var CommandGoogleCalender, Icommand, Moment, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  request = require('request');

  Moment = require('moment');

  CommandGoogleCalender = (function(_super) {
    __extends(CommandGoogleCalender, _super);

    function CommandGoogleCalender() {
      this.APIPath = 'https://clients6.google.com/calendar/v3/calendars/@/events';
    }

    CommandGoogleCalender.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var calenderId;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      calenderId = args[1];
      request.get({
        url: this.APIPath,
        qs: {
          calendarId: calenderId,
          maxResults: 20,
          singleEvents: true,
          key: 'AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs',
          maxAttendees: 1,
          timeZone: 'Asia/Taipei',
          sanitizeHtml: true,
          orderBy: 'startTime',
          timeMin: (new Date).toJSON()
        }
      }, (function(_this) {
        return function(error, response, body) {
          var err, items;
          if (error) {
            console.error(error);
          }
          if (response.statusCode !== 200) {
            console.log(response.statusCode);
            console.log(body);
          }
          if (!error && response.statusCode === 200) {
            try {
              body = JSON.parse(body);
            } catch (_error) {
              err = _error;
              return console.error(err);
            }
            items = body.items;
            items = items.map(function(item) {
              var date, displayDate;
              date = item.start.dateTime || item.start.date;
              displayDate = (Moment(date)).format('LL');
              return "" + displayDate + " " + item.summary;
            });
            return commandManager.send(sender, textRouter, items.join('\r\n'));
          }
        };
      })(this));
      return true;
    };

    CommandGoogleCalender.prototype.help = function(commandPrefix) {
      return ["make this bot to say some message", "this command will send to you according to where you exec this command, Usage", "" + commandPrefix + " [-rj] messages..", "flags:", "r: raw string, no line break", "j: full js format string"];
    };

    CommandGoogleCalender.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandGoogleCalender;

  })(Icommand);

  module.exports = CommandGoogleCalender;

}).call(this);
