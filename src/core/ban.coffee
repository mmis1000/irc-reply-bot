Imodule = require '../imodule.js'

class Ban extends Imodule
  constructor: ()->
  
  handleRaw: (sender, type, content, textRouter, commandManager, event)->
    if type == 'init'
      @storage = commandManager.getStorage()
      @manager = commandManager
      @_init()
    if type == 'before_iscommand'
      if @isBanned sender
        event.cancelled = true
    return true
  
  _init: ()->
      
    banCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBan sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unbind command from keyword! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @manager.register 'ban', banCommand, []
    
    unbanCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandUnban sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unbind command from keyword! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @manager.register 'unban', unbanCommand, []
    
    banListCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBanList sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command show banned user! usage : ",
          "#{commandPrefix}"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @manager.register 'banlist', banListCommand, []
  
  isBanned: (sender)->
    for i in (@storage.get "banList") || []
      try
        if 0 <= sender.sender.search new RegExp i, "gi"
          return true
    return false

  _commandBan: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    banList = @storage.get "banList", []
    index = banList.indexOf args[1]
    if 0 > index
      banList.push args[1]
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "banned #{args[1]}"
    else
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "#{args[1]} is already banned"
    @storage.set "banList", banList
    return true

  _commandUnban: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    banList = @storage.get "banList", []
    index = banList.indexOf args[1]
    if 0 > index
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "#{args[1]} is not banned"
    else
      banList.splice index, 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "unbanned #{args[1]}"
    @storage.set "banList", banList
    return true
  
  _commandBanList: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    textRouter.output("all bannned user : #{@storage.get 'banList'}", sender.sender)
    return true
    
module.exports = Ban