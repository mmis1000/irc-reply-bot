{EventEmitter} = require 'events'

class CommandManager extends EventEmitter
  constructor: (@storage, textRouter)->
    @identifier = "!"
    @keywordPrefix = "^"
    #these command is deeply hook into runtime thus cannot be implement seperately
    @reservedKeyWord = ["help", "op", "deop", "bind", "unbind", "bindlist", "ban", "unban"];
    
    @defaultOps = ["mmis1000", "mmis1000_m"]
    
    @commands = []
    @commandMap = {}
    
    @aliasMap = {}
    
    @keywords = @storage.get "keywords" ,[]
    @keywordMap = @storage.get "keywordMap", {}
    
    #bind default commands
    
    helpCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandHelp sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command for print out help message! usage : ",
          "#{commandPrefix}    for all commands.",
          "#{commandPrefix} [commandName]    for specified command!"
        ]
      hasPermission: -> return true
    
    @register 'help', helpCommand, ['?']
    
    bindCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBind sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command bind command to keyword! usage : ",
          "#{commandPrefix} keyword commandText.."
        ]
      hasPermission: -> return true
    
    @register 'bind', bindCommand, []
    
    unbindCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandUnbind sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unbind command from keyword! usage : ",
          "#{commandPrefix} keyword"
        ]
      hasPermission: -> return true
    
    @register 'unbind', unbindCommand, []
    
    bindListCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindList sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command show  keywords! usage : ",
          "#{commandPrefix}"
        ]
      hasPermission: -> return true
    
    @register 'bindlist', bindListCommand, []
    
    opCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandOp sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command to op someone! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager)=>
        return commandManager.isOp sender.sender
    
    @register 'op', opCommand, []
    
    deopCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandDeop sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command to deop someone! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager)=>
        return commandManager.isOp sender.sender
    
    @register 'deop', deopCommand, []
    
    banCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBan sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unbind command from keyword! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager)=>
        return commandManager.isOp sender.sender
    
    @register 'ban', banCommand, []
    
    unbanCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandUnban sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unbind command from keyword! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager)=>
        return commandManager.isOp sender.sender
    
    @register 'unban', unbanCommand, []
    
    #bind input stream
    textRouter.on "input", (message, sender)=>
      @handle sender, message, textRouter
    
  handle: (sender, text, textRouter)->
    if sender.sender in @storage.get "banList", []
      return false
    
    result = false 
    if (text.search @identifier) != 0
      #handle keywords or none command here
      for keyword in @keywords
        try
          if (text.search keyword) >= 0
            text = @keywordMap[keyword]
            result = true
            break
    else
      result = true
    
    if not result
      #it seems it isn't indentified by a identifier and none a keyword, so return at fast as possible
      return false
    
    argsText = text.replace @identifier, ""
    argsText = argsText.replace /^ /g, ""
    
    args = argsText.split(" ")
    
    command = args[0]
    
    if (@commands.indexOf command) < 0
      if @aliasMap[command]
        command = @aliasMap[command]
      else
        @_sendToPlace textRouter, sender.sender, sender.target, sender.channal, "no such command : #{command} \ntype '#{@identifier} help' for help!"
        return false
    
    if @commandMap[command].hasPermission(sender ,text, args, @storage, textRouter, commandManager)
      if not @commandMap[command].handle(sender ,text, args, @storage, textRouter, commandManager)
        @_sendToPlace textRouter, sender.sender, sender.target, sender.channal, @commandMap[command].help "#{@identifier} #{command}"
    else
      @_sendToPlace textRouter, sender.sender, sender.target, sender.channal, 'access denied!'

  register: (keyword, iCommand, aliasList)->
    @commands.push keyword
    @commandMap[keyword] = iCommand
    
    #generate reverse map for fast access
    for command in aliasList
      @aliasMap[command] = keyword

  isOp: (name)->
    opList = @storage.get "ops", @defaultOps
    return name in opList

  _sendToPlace: (textRouter, from, to, channal, message)->
    if to == channal
      textRouter.output(message, channal)
    else
      textRouter.output(message, from)

  _commandHelp: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length > 2
      return false
    if args.length == 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "all commands : #{@commands.join ', '}"
    else
      if (@commands.indexOf args[1]) < 0
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "no such command!"
      else
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, @commandMap[args[1]].help "#{@identifier} #{args[1]}"
    return true

  _commandBind: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length < 3
      return false
    
    keyword = args[1]
    
    keyword = keyword.replace /\\s/g, " "
    
    if not @isOp sender.sender
      keyword = @keywordPrefix + keyword
      keyword = keyword.replace /\\/g, "\\\\"
      keyword = keyword.replace /\./g, "\\."
      keyword = keyword.replace /\*/g, "\\*"
      keyword = keyword.replace /\+/g, "\\+"
      keyword = keyword.replace /\?/g, "\\?"
      keyword = keyword.replace /,\}/g, ",5}"
    text = args[2..].join " "
    
    
    if 0 > @keywords.indexOf keyword
      if @isOp sender.sender
        @keywords.unshift keyword
      else
        @keywords.push keyword
    @keywordMap[keyword] = text
    
    @storage.set "keywords" ,@keywords
    @storage.set "keywordMap", @keywordMap
    
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "binded #{keyword} to #{text}"
    return true

  _commandUnbind: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
      
    keyword = args[1]
    keyword = keyword.replace /\\s/g, " "
    
    if (not @isOp sender.sender) and (keyword.search "\\#{@keywordPrefix}" != 0)
      keyword = @keywordPrefix + keyword
    
    index = @keywords.indexOf keyword
    if 0 <= index
      @keywords.splice index, 1
      delete @keywordMap[keyword]
    ###
    if @isOp sender.sender
      keyword = @keywordPrefix + keyword
      index = @keywords.indexOf keyword
      if 0 <= index
        @keywords.splice index, 1
        delete @keywordMap[keyword]
    ###
    @storage.set "keywords" ,@keywords
    @storage.set "keywordMap", @keywordMap
    
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "unbinded commands from #{keyword}"
    return true

  _commandBindList: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "all used keywords : #{@keywords.join ', '}"
    return true

  _commandOp: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    ops = @storage.get "ops", @defaultOps
    index = ops.indexOf args[1]
    if 0 > index
      ops.push args[1]
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "oped #{args[1]}"
    else
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "#{args[1]} is already op!"
    @storage.set "ops", ops
    return true

  _commandDeop: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    ops = @storage.get "ops", @defaultOps
    index = ops.indexOf args[1]
    if 0 > index
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "#{args[1]} is not op"
    else
      ops.splice index, 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "deoped #{args[1]}"
    @storage.set "ops", ops
    return true

  _commandBan: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    banList = @storage.get "banList", []
    index = banList.indexOf args[1]
    if 0 > index
      banList.push args[1]
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "banned #{args[1]}"
    else
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "#{args[1]} is already banned"
    @storage.set "banList", banList
    return true

  _commandUnban: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    banList = @storage.get "banList", []
    index = banList.indexOf args[1]
    if 0 > index
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "#{args[1]} is not banned"
    else
      banList.splice index, 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channal, "unbanned #{args[1]}"
    @storage.set "banList", banList
    return true

module.exports = CommandManager