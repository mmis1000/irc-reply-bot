{EventEmitter} = require 'events'
Bind = require './core/bind.js'
Ban = require './core/ban.js'
Icommand = require './icommand'
Message = require './models/message'
TraceRouter = require './router/tracerouter'
PipeRouter = require './router/piperouter'
Sender = require './senter'
LRU = require 'lru-cache'
co = require 'co'

escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"

class CommandManager extends EventEmitter
  constructor: (@storage, textRouter)->
    super()
    # @identifier = "!"
    @commandFormat = /^.*$/g
    # @keywordPrefix = "^"
    # these command is deeply hook into runtime thus cannot be implement seperately
    # @reservedKeyWord = ["help", "op", "deop", "bind", "unbind", "bindlist", "ban", "unban"];
    
    @sessionLength = 10 * 60 * 1000
    @sessionExpire = {}
    
    @userInfoCache = LRU { max: 400, maxAge: 1000 * 60 * 60 * 2 }
    
    @defaultOps = []
    
    @commands = []
    @commandMap = {}
    @commandAliasMap = {}
    
    #for multi command module
    @modules = []
    
    @aliasMap = {}
    @routers = []
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
      handle: (sender ,text, args, storage, textRouter, commandManager, fromBinding, originalMessage)=>
        @_commandSudo sender ,text, args, storage, textRouter, commandManager, originalMessage
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
    
    if textRouter
      @defaultRouter = textRouter
      
      @addRouter textRouter
      opList = @storage.get "ops", @defaultOps
      if opList.length == 0
        textRouter.on 'connect', ()->
          textRouter.output "[Warning] no op setted, assume everyone has operator permission"
      
      @currentRouter = textRouter
    
  handleRaw: (sender, type, contents, textRouter)->
    event = {cancelled : false}
    for command in @commands
      @commandMap[command].handleRaw sender, type, contents, textRouter, @, event
    
    for module in @modules
      module.handleRaw sender, type, contents, textRouter, @, event
    
    return event
  # handleText: (sender, text, textRouter, isCommand = false, fromBinding = false, originalMessage = null)->
  handleText: (sender, text, textRouter, opts = {}, originalMessage = null)->
    result = Object.create opts
    result.isCommand = result.isCommand or false
    result.fromBinding = result.fromBinding or false
    result.text = text
    # hold the router
    done = textRouter.async ""
    co.call @, ()->
      currentIdentifier = "(unknown identifier)"
      
      if textRouter.getIdentifier
        currentIdentifier = textRouter.getIdentifier()
      
      @currentRouter = textRouter
      
      commandManager = @

      result.isCommand = result.isCommand or textRouter.isCommand text, sender, @
      
      result.sender = sender
      result.text = text
      result.fromBinding = fromBinding or false
      
      if yield Promise.resolve ( @handleRaw sender, "before_iscommand", result, textRouter ).cancelled
        done()
        return false
       
      text = result.text
      fromBinding = result.fromBinding
      
      if not result.isCommand
        #it seems it isn't a command, so return at fast as possible
        done()
        return false
      
      args = opts.args or @parseArgs text
      
      command = args[0]
      
      if !fromBinding && !command.match @commandFormat
        done()
        return false
      
      if (@commands.indexOf command) < 0
        if @aliasMap[command]
          command = @aliasMap[command]
        else
          done()
          return false
  
      if ( yield Promise.resolve  @handleRaw sender, "before_permission", [sender ,text, args, @storage, textRouter, commandManager, fromBinding], textRouter ).cancelled
        done()
        return false
      if @commandMap[command].hasPermission(sender ,text, args, @storage, textRouter, commandManager, fromBinding)
        if ( yield Promise.resolve  @handleRaw sender, "before_command", [sender ,text, args, @storage, textRouter, commandManager, fromBinding], textRouter ).cancelled
          done()
          return false
        if not @commandMap[command].handle(sender ,text, args, @storage, textRouter, commandManager, fromBinding, originalMessage)
          @_sendToPlace textRouter, sender.sender, sender.target, sender.channel, @commandMap[command].help "#{currentIdentifier} #{command}"
        done()
      else
        @_sendToPlace textRouter, sender.sender, sender.target, sender.channel, 'Access Denied! You may have to login or this command was not allowed to be exec from keyword binding.'
        done()
    .catch (err)->
      console.error err.stack or err.toString()
      done()
  register: (keyword, iCommand, aliasList)->
    if not (iCommand instanceof Icommand)
      iCommand = Icommand.__createAsInstance__ iCommand
    
    @commands.push keyword
    @commandMap[keyword] = iCommand
    @commandAliasMap[keyword] = aliasList
    #generate reverse map for fast access
    for command in aliasList
      @aliasMap[command] = keyword

  load: (moudle)->
    @modules.push moudle
    moudle.handleRaw null, 'init', null, null, @
    @register moudle.name, moudle, [] if moudle.name isnt null
  
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
  
  ###
   * @method
   * private
  ###
  login: (name, once)->
    if once
      @sessionExpire[name] = -1
    else
      @sessionExpire[name] = Date.now() + @sessionLength

  ###
   * @method
   * private
  ###
  logout: (name, once)->
    delete @sessionExpire[name]

  ###
   * @method
   * @deprecated
  ###
  _sendToPlace: (textRouter, from, to, channel, text)->
    if 0 == to.search /^#/
      target = to
    else
      target = from
    # textRouter.output(message, target)
    
    if Array.isArray text
      text = text.join '\n'
    
    sender = new Sender from, to, text, []
    message = new Message text, [], true, true, true
    
    console.warn (new Error '[deprcated] _sendToPlace').stack
    
    @sendMessage sender, textRouter, message, target
  
  send: (sender, router, text)->
    message = new Message text, [], true, true, true
    @sendMessage sender, router, message
    
  sendPv: (sender, router, text)->
    message = new Message text, [], true, true, true
    @sendMessage sender, router, message, sender.sender
    
  sendChannel: (sender, router, text)->
    
    message = new Message text, [], true, true, true
    
    if not Array.isArray sender.channel
      targets = [sender.channel]
    else
      targets = sender.channel
    
    for target in targets
      @sendMessage sender, router, message, target
  
  ###*
   * test if we can send message to target through this router. 
   * If can't, return the correct one.
  ###
  selectRouter: (target, currentRouter)->
    return currentRouter if (currentRouter instanceof PipeRouter)
    return currentRouter if (currentRouter instanceof TraceRouter)
    
    target = target.split /@/g
    
    if not target[1]
      targetId = ''
    else
      targetId = target[target.length - 1]
    
    routerId = currentRouter.getRouterIdentifier() or ''
    
    if targetId is routerId
      return currentRouter
    
    for router in @routers
      routerId = router.getRouterIdentifier() or ''
      if targetId is routerId
        return router
    # if we were unable to handle it, just return
    console.warn "unable to find target router #{targetId}"
    currentRouter
    
    
  sendMessage: (sender, router, message, target)->
    if not target
      if 0 == sender.target.search /^#/
        target = sender.target
      else
        target = sender.sender
    
    router = @selectRouter target, router
    
    res = router.outputMessage message, target
    
    if res? and 'function' is typeof res.then
      res
      .then (temp)=>
        @emitMessageEvent sender, temp.message, temp.target, router
      .catch (err)=>
        console.error (err.message or err.stack or err)
      return
    else if res is true or 'boolean' isnt typeof res
      @emitMessageEvent sender, message, target, router
    else
      console.error 'fail to send message from ' + sender.sender + ' to ' + target
      
  ###
   * @method
   * @private
  ###
  emitMessageEvent: (sender, message, target, router)->
    @handleRaw sender, 'outputMessage', {
      message: message,
      target: target
    }, router
    @handleRaw sender, 'output', {
      message: message.text,
      target: target
    }, router
  
  parseArgs: (text)->
    if @currentRouter.parseArgs
      return @currentRouter.parseArgs text
    
    argsText =  if 0 == (text.search escapeRegex @identifier) then (text.replace (escapeRegex @identifier), "") else text
    argsText = argsText.replace /^\s*/g, ""
    args = argsText.split(" ")
    return args

  _commandHelp: (sender ,text, args, storage, textRouter, commandManager)->
    
    currentIdentifier = "(unknown identifier)"
    if textRouter.getIdentifier
      currentIdentifier = textRouter.getIdentifier()
    
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
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "all commands : #{message}\nuse { #{currentIdentifier}help [command] } to see usage of command"
    else
      if (@commands.indexOf args[1]) < 0
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "no such command!"
      else
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, @commandMap[args[1]].help "#{currentIdentifier}#{args[1]}"
    return true
  
  _commandOp: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
      
    newOp = textRouter.fromDisplayName args[1]
    
    ops = @storage.get "ops", @defaultOps
    index = ops.indexOf newOp
    
    if 0 > index
      ops.push newOp
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "oped #{newOp}"
    else
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "#{newOp} is already op!"
    
    @storage.set "ops", ops
    return true

  _commandDeop: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
      
    removeOp = textRouter.fromDisplayName args[1]
    
    ops = @storage.get "ops", @defaultOps
    
    index = ops.indexOf removeOp
    if 0 > index
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "#{removeOp} is not op"
    else
      ops.splice index, 1
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "deoped #{removeOp}"
    @storage.set "ops", ops
    return true

  _commandSudo: (sender ,text, args, storage, textRouter, commandManager, originalMessage)->
    if args.length != 1
      command = args[1..].join ' '
    
    if command and (args[0] is (@parseArgs command)[0])
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Sorry, but it does'nt make sence to exec #{args[0]} from #{args[0]}."
      return true
    
    if @isOp sender.sender
      if command
        @handleText sender, command, textRouter, {fromBinding: false, isCommand: true, args: args[1..]}
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
          
          # trace the command status, finish command, then log out
          trace = new TraceRouter textRouter
          @handleText sender, command, trace, {fromBinding: false, isCommand: true, args: args[1..]}
          trace.forceCheck()
          trace.promise.then ()=>
            @logout sender.sender
          .catch (err)->
            console.error err.stack or err.toString()
            @logout sender.sender
            
        else
          @login sender.sender
          commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "login successfully"
        
      else
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "access denied"
    return true

  addRouter: (textRouter)->
    @routers.push textRouter
    if not @defaultRouter
      @defaultRouter = textRouter
    if not @currentRouter
      @currentRouter = textRouter
    
    textRouter.on "input", (message, sender, router = textRouter)=>
      
      @lastChannel = sender.channel
      @lastSender = sender.channel
      
      messageModel = (new Message message, [], true, true)
      
      @handleRaw sender, "text", message, router
      @handleRaw sender, "message", messageModel, router
      @handleText sender, message, router, {fromBinding: false, isCommand: false}, messageModel
      
    textRouter.on "message", (message, sender, router = textRouter)=>
      
      @lastChannel = sender.channel
      @lastSender = sender.channel
      
      @handleRaw sender, "message", message, router
      
      if message.asText
        @handleRaw sender, "text", message.text, router
      
      # for binding to detect stickers or other...
      # if message.asCommand
      @handleText sender, message.text, router, {fromBinding: false, isCommand: false}, message
      
    textRouter.on "rpl_join", (channel, sender, router = textRouter)=>
      @handleRaw sender, "join", channel, router
    
    textRouter.on "rpl_raw", (reply, router = textRouter)=>
      @handleRaw null, "raw", reply, router
    
    textRouter.emit 'manager_register', @
    
  toDisplayName: (sender)->
    if sender and 'object' is typeof sender
      sender = sender.sender
    
    if 'string' isnt typeof sender
      return '' + sender
    
    router = /@(.*)$/.exec sender
    
    if router
      router = router[1]
    else
      router = ''
    
    router = @routers.find (messageRouter)->
      return router is messageRouter.getRouterIdentifier()
    
    if not router
      return '' + sender
    
    router.toDisplayName sender
  
  hasCommand: (command)->
    if !command.match @commandFormat
      return false
    if (@commands.indexOf command) >= 0
      return true
    if @aliasMap[command]
      return true
    false
    
module.exports = CommandManager