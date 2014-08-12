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
      handleRaw: (sender, type, content)->return false
    
    @register 'help', helpCommand, ['?']
    
    bindCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBind sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command bind command to keyword! usage : ",
          "#{commandPrefix} keyword commandText.."
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=> return not fromBinding
      handleRaw: (sender, type, content)->return false
    
    @register 'bind', bindCommand, []
    
    unbindCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandUnbind sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unbind command from keyword! usage : ",
          "#{commandPrefix} keyword"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=> return not fromBinding
      handleRaw: (sender, type, content)->return false
    
    @register 'unbind', unbindCommand, []
    
    bindListCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindList sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command show  keywords! usage : ",
          "#{commandPrefix}"
        ]
      hasPermission: => return true
      handleRaw: (sender, type, content)->return false
    
    @register 'bindlist', bindListCommand, []
    
    opCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandOp sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command to op someone! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @register 'op', opCommand, []
    
    deopCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandDeop sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command to deop someone! usage : ",
          "#{commandPrefix} nick"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @register 'deop', deopCommand, []
    
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
    
    @register 'ban', banCommand, []
    
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
    
    @register 'unban', unbanCommand, []
    
    #bind input stream
    textRouter.on "input", (message, sender)=>
      @handleRaw sender, "text", message, textRouter
      @handleText sender, message, textRouter

  handleRaw: (sender, type, contents, textRouter)->
    
    
    for command in @commands
      @commandMap[command].handleRaw sender, type, contents, textRouter, @

  handleText: (sender, text, textRouter)->
    commandmanager = @
    
    if sender.sender in @storage.get "banList", []
      return false
    
    result = false 
    if (text.search @identifier) != 0
      #handle keywords or none command here
      fromBinding = true
      for keyword in @keywords
        try
          if (text.search keyword) >= 0
            text = @keywordMap[keyword]
            result = true
            break
    else
      fromBinding = false
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
        @_sendToPlace textRouter, sender.sender, sender.target, sender.channel, "no such command : #{command} \ntype '#{@identifier} help' for help!"
        return false
    
    if @commandMap[command].hasPermission(sender ,text, args, @storage, textRouter, commandManager, fromBinding)
      if not @commandMap[command].handle(sender ,text, args, @storage, textRouter, commandManager)
        @_sendToPlace textRouter, sender.sender, sender.target, sender.channel, @commandMap[command].help "#{@identifier} #{command}"
    else
      @_sendToPlace textRouter, sender.sender, sender.target, sender.channel, 'access denied!'

  register: (keyword, iCommand, aliasList)->
    @commands.push keyword
    @commandMap[keyword] = iCommand
    
    #generate reverse map for fast access
    for command in aliasList
      @aliasMap[command] = keyword

  isOp: (name)->
    opList = @storage.get "ops", @defaultOps
    return name in opList

  _sendToPlace: (textRouter, from, to, channel, message)->
    if to == channel
      textRouter.output(message, channel)
    else
      textRouter.output(message, from)

  parseArgs: (text)->
    argsText = text.replace @identifier, ""
    argsText = argsText.replace /^ /g, ""
    args = argsText.split(" ")
    return args

  _commandHelp: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length > 2
      return false
    if args.length == 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "all commands : #{@commands.join ', '}"
    else
      if (@commands.indexOf args[1]) < 0
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "no such command!"
      else
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, @commandMap[args[1]].help "#{@identifier} #{args[1]}"
    return true

  _commandBind: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length < 3
      return false
    
    keyword = args[1]
    
    keyword = keyword.replace /\\s/g, " "
    
    if keyword.length < 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "\u000304you need to bind at least one word!"
      return true
    
    if not @isOp sender.sender
      keyword = keyword.replace /\\/g, "\\\\"
      keyword = keyword.replace /\./g, "\\."
      keyword = keyword.replace /\*/g, "\\*"
      keyword = keyword.replace /\+/g, "\\+"
      keyword = keyword.replace /\?/g, "\\?"
      keyword = keyword.replace /\[/g, "\\["
      keyword = keyword.replace /\]/g, "\\]"
      keyword = keyword.replace /\{/g, "\\{"
      keyword = keyword.replace /\}/g, "\\}"
      keyword = keyword.replace /\(/g, "\\)"
      keyword = keyword.replace /\(/g, "\\)"
      keyword = keyword.replace /\|/g, "\\|"
      keyword = keyword.replace /\^/g, "\\^"
      keyword = keyword.replace /\$/g, "\\$"
      
      keyword = @keywordPrefix + keyword
      if keyword.length < 3
        keyword = keyword + "$"
    
    text = args[2..].join " "
    
    
    if 0 > @keywords.indexOf keyword
      if @isOp sender.sender
        @keywords.unshift keyword
      else
        @keywords.push keyword
    @keywordMap[keyword] = text
    
    @storage.set "keywords" ,@keywords
    @storage.set "keywordMap", @keywordMap
    
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "binded #{keyword} to #{text}"
    return true

  _commandUnbind: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
      
    keyword = args[1]
    keyword = keyword.replace /\\s/g, " "
    
    if (not @isOp sender.sender) and ((keyword.search "\\#{@keywordPrefix}") != 0)
      keyword = @keywordPrefix + keyword
    
    index = @keywords.indexOf keyword
    if 0 <= index
      @keywords.splice index, 1
      delete @keywordMap[keyword]
    
    @storage.set "keywords" ,@keywords
    @storage.set "keywordMap", @keywordMap
    
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "unbinded commands from #{keyword}"
    return true

  _commandBindList: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "all used keywords : #{@keywords.join ', '}"
    return true

  _commandOp: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    ops = @storage.get "ops", @defaultOps
    index = ops.indexOf args[1]
    if 0 > index
      ops.push args[1]
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "oped #{args[1]}"
    else
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "#{args[1]} is already op!"
    @storage.set "ops", ops
    return true

  _commandDeop: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    ops = @storage.get "ops", @defaultOps
    index = ops.indexOf args[1]
    if 0 > index
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "#{args[1]} is not op"
    else
      ops.splice index, 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "deoped #{args[1]}"
    @storage.set "ops", ops
    return true

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

module.exports = CommandManager