Icommand = require '../icommand.js'
Message = require '../models/message'

class CommandReply extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    
    if args[1] == '-r'
      message = args[2..].join " "
    else if args[1] == '-j'
      message = args[2..].join " "
      message = '"' + message + '"'
      try
        message = JSON.parse message
        message = message.toString()
      catch e
        console.log e
        message = args[2..].join " "
    else
      message = args[1..].join " "
      message = message.replace /\\n/g, "\n"
    
    if message.match /^\s*$/g 
      return false
    
    messageModel = new Message message, null, true
    messageModel.textFormat = 'html'
    
    commandManager.sendMessage sender, textRouter, messageModel
    
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

module.exports = CommandReply