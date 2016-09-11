Imodule = require '../imodule.js'

class Ban extends Imodule
  constructor: ()->
    super
    @name = 'ban'
  
  handleRaw: (sender, type, content, textRouter, commandManager, event)->
    if type == 'init'
      @storage = commandManager.getStorage()
      @manager = commandManager
      @_init()
    
    if type == 'before_iscommand'
      text = content.text
      args = commandManager.parseArgs text
      
      isSudo = args[0] is 'sudo'
      isOp = commandManager.isOp sender
      
      if isSudo or isOp
        return
      
      if @isBanned sender
        event.cancelled = true
      if @isChannelIgnored sender
        event.cancelled = true
    
    return true
  
  _init: ()->
      
    banCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBan sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command ban a user! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'add', banCommand, []
    
    unbanCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandUnban sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unban a user! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'remove', unbanCommand, []
    
    banListCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBanList sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command show banned users! usage : ",
          "#{commandPrefix}"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        #console.log 'per miss ', sender.sender, commandManager.isOp sender.sender
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'list', banListCommand, []
    
    banChannelCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBanChannel sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command ignore a channel! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'add-channel', banChannelCommand, []
    
    unbanChannelCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandUnbanChannel sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unignore a channel! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'remove-channel', unbanChannelCommand, []
    
    banChannelListCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBanChannelList sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command show ignored channel list! usage : ",
          "#{commandPrefix}"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        #console.log 'per miss ', sender.sender, commandManager.isOp sender.sender
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'list-channel', banChannelListCommand, []
    
    @manager.isBanned = @isBanned.bind @
    
    
  isBanned: (sender)->
    for i in (@storage.get "banList") || []
      try
        if 0 <= sender.sender.search new RegExp i, "gi"
          return true
    return false
  
  isChannelIgnored: (sender)->
    if sender.target.match /^[^#]/
      return false
    for i in (@storage.get "banChannelList") || []
      try
        if 0 <= sender.target.search new RegExp i, "gi"
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
    textRouter.output("all bannned user : #{@storage.get 'banList', []}", sender.sender)
    return true
  
  _commandBanChannel:(sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    
    banList = @storage.get "banChannelList", []
    
    index = banList.indexOf args[1]
    
    if 0 > index
      banList.push args[1]
      commandManager.send sender, textRouter, "command at channel #{args[1]} is now ignored"
    else
      commandManager.send sender, textRouter, "command channel #{args[1]} is already ignored"
    
    @storage.set "banChannelList", banList
    
    return true
  
  _commandUnbanChannel: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    
    banList = @storage.get "banChannelList", []
    index = banList.indexOf args[1]
    
    if 0 > index
      commandManager.send sender, textRouter, "channel #{args[1]} is not unignored"
    else
      banList.splice index, 1
      commandManager.send sender, textRouter, "unignored channel #{args[1]}"
    
    @storage.set "banChannelList", banList
    return true
  
  _commandBanChannelList: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    commandManager.send sender, textRouter, "all ignored Channel List : #{ (@storage.get 'banChannelList', []).join ', ' }"
    return true 
    
  
module.exports = Ban