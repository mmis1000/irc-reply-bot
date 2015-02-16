Icommand = require '../icommand.js'

escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"


class Bind extends Icommand
  constructor: ()->
    
  handle: (senter ,text, args, storage, textRouter, commandManager)->
    textRouter.output "add method to compelete this!"
    success = false
    return success
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return [];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true
  
  handleRaw: (sender, type, content, textRouter, commandManager)->
    if type == 'init'
      @storage = commandManager.getStorage()
      @manager = commandManager
      @_init()
    if type == 'before_iscommand'
      result = @_getBinding content.text, commandManager
      if result != false 
        content.text = result
        content.isCommand = true
        content.fromBinding = true
        console.log result, '1 '
      console.log content
    return true
  
  _getBinding: (original, commandManager)->
    result = false 
    if (original.search escapeRegex commandManager.identifier) != 0
      #handle keywords or none command here
      for keyword in @keywords
        try
          if (original.search keyword) >= 0
            regex = new RegExp keyword
            text = (regex.exec original)[0].replace regex, @keywordMap[keyword]
            break
        catch e
          console.log e
    
    return text || false
    
  _init: ()->
    @keywords = @storage.get "keywords" ,[]
    @keywordMap = @storage.get "keywordMap", {}
    bindCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBind sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command bind command to keyword! usage : ",
          "#{commandPrefix} keyword commandText.."
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=> return not fromBinding
      handleRaw: (sender, type, content)->return false
    
    @manager.register 'bind', bindCommand, []
    
    bindAppendCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindAppend sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command append command text to keyword! usage : ",
          "#{commandPrefix} keyword commandText.."
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=> return not fromBinding
      handleRaw: (sender, type, content)->return false
    
    @manager.register 'bindappend', bindAppendCommand, []
    
    unbindCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandUnbind sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unbind command from keyword! usage : ",
          "#{commandPrefix} keyword"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=> return not fromBinding
      handleRaw: (sender, type, content)->return false
    
    @manager.register 'unbind', unbindCommand, []
    
    bindListCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindList sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command show  keywords! usage : ",
          "#{commandPrefix}"
        ]
      hasPermission: => return true
      handleRaw: (sender, type, content)->return false
    
    @manager.register 'bindlist', bindListCommand, []
  
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
    
    if not @manager.isOp sender.sender
      keyword = escapeRegex keyword
      
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
      if @manager.isOp sender.sender
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
    
    if (not @manager.isOp sender.sender) and ((keyword.search /\^/) != 0)
      keyword = "^" + keyword
    
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
    
    if (not @manager.isOp sender.sender) and ((keyword.search /\^/) != 0)
      keyword = "^" + keyword
    
    index = @keywords.indexOf keyword
    if 0 <= index
      @keywords.splice index, 1
      delete @keywordMap[keyword]
    else
      commandManager.send sender, textRouter, "keyword #{keyword} not found"
      return true
    
    @storage.set "keywords" ,@keywords
    @storage.set "keywordMap", @keywordMap
    
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "unbinded commands from #{keyword}"
    return true

  _commandBindList: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    textRouter.output("all used keywords : #{@keywords.join ', '}", sender.sender)
    return true

module.exports = Bind