{EventEmitter} = require 'events'

class CommandManager extends EventEmitter
  constructor: (@storage, textRouter)->
    @identifier = "!"
    @commandFormat = /^[a-zA-Z].*$/g
    @keywordPrefix = "^"
    #these command is deeply hook into runtime thus cannot be implement seperately
    @reservedKeyWord = ["help", "op", "deop", "bind", "unbind", "bindlist", "ban", "unban"];
    
    @sessionLength = 10 * 60 * 1000
    @sessionExpire = {}
    
    @defaultOps = []
    
    @commands = []
    @commandMap = {}
    @commandAliasMap = {}
    
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
    
    bindAppendCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindAppend sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command append command text to keyword! usage : ",
          "#{commandPrefix} keyword commandText.."
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=> return not fromBinding
      handleRaw: (sender, type, content)->return false
    
    @register 'bindappend', bindAppendCommand, []
    
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
    
    @register 'banlist', banListCommand, []
    
    sudoCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandSudo sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return [
          "update current user session to op session! usage : ",
          "#{commandPrefix} # login or log out",
          "#{commandPrefix} <command text> # exec command as operator"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return true
      handleRaw: (sender, type, content)->return false
    
    @register 'sudo', sudoCommand, []
    
    #bind input stream
    @defaultRouter = textRouter
    
    textRouter.on "input", (message, sender)=>
      
      @lastChannel = sender.channel
      @lastSender = sender.channel
      
      @handleRaw sender, "text", message, textRouter
      @handleText sender, message, textRouter
    
    opList = @storage.get "ops", @defaultOps
    if opList.length == 0
      textRouter.output "[Warning] no op setted, assume everyone has operator permission"

  handleRaw: (sender, type, contents, textRouter)->
    event = {cancelled : false}
    for command in @commands
      @commandMap[command].handleRaw sender, type, contents, textRouter, @, event
    return event
    
  handleText: (sender, text, textRouter, isCommand = false, fromBinding = false)->
    commandmanager = @
    
    ###
    if sender.sender in @storage.get "banList", []
      return false
    ###
    
    for i in (@storage.get "banList") || []
      try
        if 0 <= sender.sender.search new RegExp i, "gi"
          return false
    
    result = false 
    if (text.search @identifier) != 0 and !isCommand
      #handle keywords or none command here
      fromBinding = true
      for keyword in @keywords
        try
          if (text.search keyword) >= 0
            regex = new RegExp keyword
            text = (regex.exec text)[0].replace regex, @keywordMap[keyword]
            result = true
            break
        catch e
          console.log e
    else
      result = true
    
    if not result
      #it seems it isn't indentified by a identifier and nor a keyword, so return at fast as possible
      return false
    if text.search @identifier == 0
      argsText = text.replace @identifier, ""
    
    argsText = argsText.replace /^\s+/g, ""
    
    args = argsText.split(" ")
    
    command = args[0]
    
    if !command.match @commandFormat
      return false
    
    if (@commands.indexOf command) < 0
      if @aliasMap[command]
        command = @aliasMap[command]
      else
        @_sendToPlace textRouter, sender.sender, sender.target, sender.channel, "no such command : #{command} \ntype '#{@identifier} help' for help!"
        return false

    if ( @handleRaw sender, "before_permission", [sender ,text, args, @storage, textRouter, commandManager, fromBinding], textRouter ).cancelled
      return false
    if @commandMap[command].hasPermission(sender ,text, args, @storage, textRouter, commandManager, fromBinding)
      if ( @handleRaw sender, "before_command", [sender ,text, args, @storage, textRouter, commandManager, fromBinding], textRouter ).cancelled
        return false
      if not @commandMap[command].handle(sender ,text, args, @storage, textRouter, commandManager, fromBinding)
        @_sendToPlace textRouter, sender.sender, sender.target, sender.channel, @commandMap[command].help "#{@identifier} #{command}"
    else
      @_sendToPlace textRouter, sender.sender, sender.target, sender.channel, 'Access Denied! You may have to login or this command was not allowed to be exec from keyword binding.'

  register: (keyword, iCommand, aliasList)->
    @commands.push keyword
    @commandMap[keyword] = iCommand
    @commandAliasMap[keyword] = aliasList
    #generate reverse map for fast access
    for command in aliasList
      @aliasMap[command] = keyword

  isOp: (name, noSession)->
    opList = @storage.get "ops", @defaultOps
    if opList.length is 0
      return true
    
    if noSession
      return name in opList
    
    #console.log(@sessionExpire)
    
    authed = @sessionExpire[name] && (@sessionExpire[name] >= Date.now() or @sessionExpire[name] is -1)
    if (@sessionExpire[name] < Date.now() or @sessionExpire[name] is -1)
      delete @sessionExpire[name]
    
    return authed

  login: (name, once)->
    if once
      @sessionExpire[name] = -1
    else
      @sessionExpire[name] = Date.now() + @sessionLength

  logout: (name, once)->
    delete @sessionExpire[name]

  _sendToPlace: (textRouter, from, to, channel, message)->
    if to == channel
      textRouter.output(message, channel)
    else
      textRouter.output(message, from)
  
  send: (sender, router, text)->
    @_sendToPlace router, sender.sender, sender.target, sender.channel, text
    
  sendPv: (sender, router, text)->
    router.output text, sender.sender
    
  parseArgs: (text)->
    argsText =  if 0 == (text.search @identifier) then (text.replace @identifier, "") else text
    argsText = argsText.replace /^\s*/g, ""
    args = argsText.split(" ")
    return args

  _commandHelp: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length > 2
      return false
    if args.length == 1
      message = "all commands : "
      for command, index in @commands
        message += command
        if @commandAliasMap[command].length > 0
          message += "[#{@commandAliasMap[command].join ', '}]"
        if index != @commands.length - 1
          message += ", "
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "all commands : #{message}\nuse { #{@identifier}help [command] } to see usage of command"
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
    
    #keyword = keyword.replace /\\s/g, " "
    
    if keyword.length < 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "\u000304you need to bind at least one word!"
      return true
    
    if  0 == keyword.search "\\^"
      atHead = true
      keyword = keyword.slice 1
    else
      atHead = false
    
    
    if keyword.length - 1 == keyword.search "\\$" 
      atEnd = true
      keyword = keyword.slice 0, keyword.length - 1
    else
      atEnd = false
    
    realLength = keyword.length
    
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
      keyword = keyword.replace /\(/g, "\\("
      keyword = keyword.replace /\)/g, "\\)"
      keyword = keyword.replace /\|/g, "\\|"
      keyword = keyword.replace /\^/g, "\\^"
      keyword = keyword.replace /\$/g, "\\$"
      
      keyword = keyword.replace /\\\\\\s/g, "\\s"
      atHead = true
      if realLength < 3
        atEnd = true
    
    text = args[2..].join " "
    
    if atHead
      keyword = "^#{keyword}"
    
    if atEnd
      keyword = "#{keyword}$"
    
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

  _commandBindAppend: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length < 3
      return false
    
    keyword = args[1]
    
    keyword = keyword.replace /\\s/g, " "
    
    if keyword.length < 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "\u000304you need to identify at least one word!"
      return true
    
    if (not @isOp sender.sender) and ((keyword.search "\\#{@keywordPrefix}") != 0)
      keyword = @keywordPrefix + keyword
    
    text = args[2..].join " "
    
    
    if 0 > @keywords.indexOf keyword
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "\u000304No such keyword!"
      return true
      
    @keywordMap[keyword] += text
    
    @storage.set "keywordMap", @keywordMap
    
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "appended #{text} to #{keyword}"
    return true

  _commandUnbind: (sender ,text, args, storage, textRouter, commandManager)->
    if null != (/^"(.+)"$/).exec args[1..].join " "
      args[1] = ( (/^"(.+)"$/).exec args[1..].join " " )[1]
      args = args[0..1]
    #console.log args, (/^"(.+)"$/).exec args[1..].join " "
    if args.length != 2
      return false
      
    keyword = args[1]
    #keyword = keyword.replace /\\s/g, " "
    
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
    textRouter.output("all used keywords : #{@keywords.join ', '}", sender.sender)
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
  
  _commandBanList: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    textRouter.output("all bannned user : #{@storage.get 'banList'}", sender.sender)
    return true

  _commandSudo: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      command = args[1..].join ' '
    
    if command and (args[0] is (@parseArgs command)[0])
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Sorry, but it does'nt make sence to exec #{args[0]} from #{args[0]}."
      return true
    
    if @isOp sender.sender
      if command
        @handleText sender, command, textRouter, true
      else
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "logout successfully"
        @logout sender.sender
      return true

    #textRouter.output "test", sender.channel
    textRouter.whois sender.sender, (info)=>
      #textRouter.output "test#{JSON.stringify info}", sender.channel
      if @isOp info.account, true
        if command
          @login sender.sender
          #commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "exec as operator #{JSON.stringify [sender, command]}"
          @handleText sender, command, textRouter, true
          @logout sender.sender
        else
          @login sender.sender
          commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "login successfully"
        
      else
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "access denied"
    return true

module.exports = CommandManager