Icommand = require '../icommand.js'

class CommandSay extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    
    broadcast = true
    target = null
        
    if sender.target.match /^#+[a-z]+/i
      broadcast = false
    else if args[1].match /^#+[a-z]+/i
      broadcast = false
      target = args[1]
      sender.target = args[1]
      args = [args[0], args[2..]...]
    else if fromBinding == true
      broadcast = false
    
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
    
    if sender.target.match /^#+[a-z]+/i
      commandManager.send sender, textRouter, message
    else
      if not broadcast
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
      "#{commandPrefix} #channel_name [-rj] messages..",
      "#{commandPrefix} [-rj] messages..",
      "flags:",
      "r: raw string, no line break",
      "j: full js format string"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandSay