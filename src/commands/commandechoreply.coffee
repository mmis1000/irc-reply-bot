Icommand = require '../icommand.js'

class CommandEchoReply extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager, formBinding, originalMessage)->
    if args.length > 2
      return false
    
    
      
    
    if originalMessage.replyTo
      if args.length is 2
        if not args[1].match /^#.+/i
          return false
        target = args[1]
        sender.target = target
      commandManager.sendMessage sender, textRouter, originalMessage.replyTo.message
    else
      commandManager.send sender, textRouter, "you didn't reply to a message yet"
    
    return true
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return [
      "reply the message you reply to", 
      "this command will send to you according to where you exec this command, Usage", 
      "#{commandPrefix} [-rj] messages.."
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandEchoReply