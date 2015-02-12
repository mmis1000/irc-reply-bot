Icommand = require '../icommand.js'

class CommandNotifyAll extends Icommand
  constructor: ()->
    @cd_min = 10
    @lockUntil = Date.now()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    
    if Date.now() > @lockUntil or commandManager.isOp sender.sender
      channel = sender.channel
      textRouter.names channel, (names)=>
        textRouter.output "Hello All! #{names.join(' ')}", sender.channel
      if not commandManager.isOp sender.sender
        @lockUntil = Date.now() + @cd_min * 60 * 1000
    else
      textRouter.output "This command is temporarily locked until #{new Date @lockUntil}", sender.channel
    return true
  
  help: (commandPrefix)->
    return ["notify everyone on this channel, Usage", "#{commandPrefix}"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    commandManager.isOp sender.sender

module.exports = CommandNotifyAll