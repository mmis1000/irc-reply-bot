Icommand = require '../icommand.js'

class CommandSay extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"
    
    commandManager.sendChannel sender, textRouter, message
    
    success = true
    return success
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return ["make this bot to say some message, Usage", "#{commandPrefix} messages.."];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandSay