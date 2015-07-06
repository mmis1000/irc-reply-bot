Imodule = require '../imodule'

class Admin extends Imodule
  constructor: (@bot)->
    super
    @name = 'admin'
    
    exitCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_exit sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command exit the bot itself : ",
          "#{commandPrefix}"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'exit', exitCommand, []
    
    reloadCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_reload sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command reload this bot : ",
          "#{commandPrefix}"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'reload', reloadCommand, []
  
  _exit: (sender ,text, args, storage, textRouter, commandManager)->
    commandManager.send sender, textRouter, 'exiting the bot...'
    @bot.exit()
  
  _reload: (sender ,text, args, storage, textRouter, commandManager)->
    if not @bot.reload()
      commandManager.send sender, textRouter, 'it seems the bot can\'t reload itself'
    else
      commandManager.send sender, textRouter, 'reloading the bot...'
module.exports = Admin