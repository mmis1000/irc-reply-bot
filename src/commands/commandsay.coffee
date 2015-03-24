Icommand = require '../icommand.js'

class CommandSay extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"  
    
    if sender.target.match /^#+[a-z]+/i
      commandManager.send sender, textRouter, message
    else
      if args[1].match /^#+[a-z]+/i
        target = args[1]
        message = args[2..].join " "
        message = message.replace /\\n/g, "\n"
        sender.target = target
        commandManager.send sender, textRouter, message
      else
        if not commandManager.isOp sender.sender
          commandManager.send sender, textRouter, "Global broadcast is admin Only!"
        else
          commandManager.sendChannel sender, textRouter, message
        
    success = true
    return success
  
  help: (commandPrefix)->
    return [
      "make this bot to say some message, Usage", 
      "#{commandPrefix} #channel_name messages..",
      "#{commandPrefix} messages.."
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandSay