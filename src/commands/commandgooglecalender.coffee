Icommand = require '../icommand.js'
request = require 'request'
Moment = require 'moment'

class CommandGoogleCalender extends Icommand
  constructor: ()->
    @APIPath = 'https://clients6.google.com/calendar/v3/calendars/@/events'
  
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    
    calenderId = args[1]
    
    request.get {
      url: @APIPath,
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
    }, (error, response, body)=>
      # console.log response
      if error
        console.error error
      if response.statusCode != 200
        console.log(response.statusCode) # Show the HTML for the Google homepage.
        console.log(body) # Show the HTML for the Google homepage.
      if !error && response.statusCode == 200
        # console.log(body) # Show the HTML for the Google homepage.
        try
          body = JSON.parse body
        catch err
          return console.error err
        
        items = body.items
        
        items = items.map (item)->
          date = item.start.dateTime or item.start.date
          displayDate = (Moment date).format 'LL'
          # console.log date, displayDate
          return "#{displayDate} #{item.summary}"
        
        commandManager.send sender, textRouter, items.join '\r\n'
        
        
    # commandManager.send sender, textRouter, message
    
    return true
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["make this bot to say some message", 
      "this command will send to you according to where you exec this command, Usage", 
      "#{commandPrefix} [-rj] messages..",
      "flags:",
      "r: raw string, no line break",
      "j: full js format string"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandGoogleCalender