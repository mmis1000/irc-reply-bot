(function() {
  var CommandGoogleCalender, Icommand, Moment, request;

  Icommand = require('../icommand.js');

  request = require('request');

  Moment = require('moment');

  CommandGoogleCalender = class CommandGoogleCalender extends Icommand {
    constructor() {
      super();
      this.APIPath = 'https://clients6.google.com/calendar/v3/calendars/@/events';
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
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
          timeMin: (new Date()).toJSON()
        }
      }, (error, response, body) => {
        var err, items;
        // console.log response
        if (error) {
          console.error(error);
        }
        if (response.statusCode !== 200) {
          console.log(response.statusCode); // Show the HTML for the Google homepage.
          console.log(body); // Show the HTML for the Google homepage.
        }
        if (!error && response.statusCode === 200) {
          try {
            // console.log(body) # Show the HTML for the Google homepage.
            body = JSON.parse(body);
          } catch (error1) {
            err = error1;
            return console.error(err);
          }
          items = body.items;
          items = items.map(function(item) {
            var date, displayDate;
            date = item.start.dateTime || item.start.date;
            displayDate = (Moment(date)).format('LL');
            // console.log date, displayDate
            return `${displayDate} ${item.summary}`;
          });
          return commandManager.send(sender, textRouter, items.join('\r\n'));
        }
      });
      
      // commandManager.send sender, textRouter, message
      return true;
    }

    help(commandPrefix) {
      //console.log "add method to override this!"
      return ["make this bot to say some message", "this command will send to you according to where you exec this command, Usage", `${commandPrefix} [-rj] messages..`, "flags:", "r: raw string, no line break", "j: full js format string"];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    }

  };

  module.exports = CommandGoogleCalender;

}).call(this);
