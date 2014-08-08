Icommand = require './icommand.js'

class CommandSay extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"
    message = message.replace /\\s/g, " "
    textRouter.output message, sender.channal
    success = true
    return success
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return ["make this bot to say some message, Usage", "#{commandPrefix} messages.."];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandSay