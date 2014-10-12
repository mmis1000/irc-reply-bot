Icommand = require './icommand.js'

colors = [
    "\u000304",
    "\u000307",
    "\u000308",
    "\u000309",
    "\u000312",
    "\u000302",
    "\u000306",
]

class CommandSay extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"
    
    temp = message.split ""
    
    i = temp.length - 1
    while i >= 0
      if !temp[i].match /\s/
        temp.splice i, 0, colors[i %% colors.length]
      i--
    
    message = temp.join ""
    
    textRouter.output message, sender.channel
    success = true
    return success
  
  help: (commandPrefix)->
    return ["make this bot to say some message, Usage", "#{commandPrefix} messages.."];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandSay