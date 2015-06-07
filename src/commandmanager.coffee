{EventEmitter} = require 'events'
Bind = require './core/bind.js'
Ban = require './core/ban.js'


escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"

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
    
    #for multi command module
    @modules = []
    
    @aliasMap = {}
    
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
    
    
    @load new Bind
    @load new Ban
    #bind input stream
    @defaultRouter = textRouter
    
    textRouter.on "input", (message, sender)=>
      
      @lastChannel = sender.channel
      @lastSender = sender.channel
      
      @handleRaw sender, "text", message, textRouter
      @handleText sender, message, textRouter
    
    textRouter.on "rpl_join", (channel, sender)=>
      @handleRaw sender, "join", channel, textRouter
    
    textRouter.on "rpl_raw", (reply)=>
      @handleRaw null, "raw", reply, textRouter
    
    opList = @storage.get "ops", @defaultOps
    if opList.length == 0
      textRouter.on 'connect', ()->
        textRouter.output "[Warning] no op setted, assume everyone has operator permission"

  handleRaw: (sender, type, contents, textRouter)->
    event = {cancelled : false}
    for command in @commands
      @commandMap[command].handleRaw sender, type, contents, textRouter, @, event
    
    for module in @modules
      module.handleRaw sender, type, contents, textRouter, @, event
    
    return event
    
  handleText: (sender, text, textRouter, isCommand = false, fromBinding = false)->
    result = {}
    commandManager = @
    
    result.isCommand = isCommand || (text.search escapeRegex @identifier) == 0
    result.sender = sender
    result.text = text
    result.fromBinding = false
    
    if ( @handleRaw sender, "before_iscommand", result, textRouter ).cancelled
     return false
     
    text = result.text
    fromBinding = result.fromBinding
    
    if not result.isCommand
      #it seems it isn't a command, so return at fast as possible
      return false
    
    identifierRegex = escapeRegex @identifier
    
    if 0 == text.search identifierRegex
      argsText = text.replace @identifier, ""
    else
      argsText = text
    
    argsText = argsText.replace /^\s+/g, ""
    
    args = argsText.split(" ")
    
    command = args[0]
    
    if !fromBinding && !command.match @commandFormat
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

  load: (moudle)->
    @modules.push moudle
    moudle.handleRaw null, 'init', null, null, @
    @register moudle.name, moudle, []
  
  getStorage: ()->
    @storage
  
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
    if 0 == to.search /^#/
      textRouter.output(message, to)
    else
      textRouter.output(message, from)
  
  send: (sender, router, text)->
    @_sendToPlace router, sender.sender, sender.target, sender.channel, text
    
  sendPv: (sender, router, text)->
    router.output text, sender.sender

  sendChannel: (sender, router, text)->
    router.output text, sender.channel

  parseArgs: (text)->
    argsText =  if 0 == (text.search escapeRegex @identifier) then (text.replace (escapeRegex @identifier), "") else text
    argsText = argsText.replace /^\s*/g, ""
    args = argsText.split(" ")
    return args

  _commandHelp: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length > 2
      return false
    if args.length == 1
      message = ""
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