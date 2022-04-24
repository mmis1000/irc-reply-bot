Icommand = require '../icommand.js'

class CommandReply extends Icommand
  constructor: ()->
    super()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"
    message = message.split /[\r\n]+/g
    .map (item)-> "\u0001ACTION #{item} \u0001"
    .join "\n"
    
    commandManager.sendChannel sender, textRouter, message
    
    success = true
    return success
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["make this bot to say some message", 
      "this command will send to you according to where you exec this command, Usage", 
      "#{commandPrefix} messages.."];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandReply