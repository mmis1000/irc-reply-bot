Icommand = require './icommand.js'

colors = [
    "\u00034",
    "\u00037",
    "\u00038",
    "\u00033",
    "\u000312",
    "\u00032",
    "\u00036",
]

class CommandSay extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"
    message = message.replace /\\s/g, " "
    
    temp = message.split ""
    
    i = temp.length - 1
    while i >= 0
      if !temp[i].match /\s/
        temp.splice i, 0, colors[i %% colors.length]
      i--
    
    message = temp.join ""
    
    textRouter.output message, sender.channal
    success = true
    return success
  
  help: (commandPrefix)->
    return ["make this bot to say some message, Usage", "#{commandPrefix} messages.."];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandSay