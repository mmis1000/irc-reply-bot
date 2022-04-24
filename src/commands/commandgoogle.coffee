Icommand = require '../icommand.js'
google = require 'google'

class CommandGoogle extends Icommand
  constructor: (options)->
    super()
    options = options || {}
    google.tld = options.tld if options.tld
    google.lang = options.lang if options.lang
    google.nextText = options.nextText if options.nextText
  
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (/^\s+$/).test args[1..].join ' '
      return false
    
    done = textRouter.async()
    searchText = args[1..].join ' '
    google searchText, (err, next, links)->
      done()
      
      if err
        commandManager.send sender, textRouter, err.toString()
        return
      
      commandManager.send sender, textRouter, (links
      .filter (link)-> link.link isnt null
      .slice 0, 3
      .map (link)->
        "[#{link.title}] #{link.link}\r\n#{link.description.replace /\r?\n/g, ''}"
      .join "\r\n\r\n")
      
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

module.exports = CommandGoogle