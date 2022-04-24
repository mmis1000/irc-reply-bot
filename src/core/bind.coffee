Imodule = require '../imodule.js'
BindHelper = require './bindhelper'
helper = new BindHelper
Q = require 'q'

escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"


class Bind extends Imodule
  constructor: ()->
    super()
    @name = 'bind'
  handleRaw: (sender, type, content, textRouter, commandManager, event)->
    if type == 'init'
      @storage = commandManager.getStorage()
      @manager = commandManager
      @_init()
    if type == 'before_iscommand'
      return if content.isCommand # don't try to parse already parsed command
      return if content.fromBinding  # don't reparse parsed command
      return if @_isIgnored sender
      return if event.cancelled # do nothing if already cacncelled
      event.cancelled = @_getBinding content.text, commandManager, sender, textRouter
      .then (result)->
        if result != false 
          content.text = result
          content.isCommand = true
          content.fromBinding = true
          event.cancelled = false
        false
      .then ((i)->i), (err)->
        console.error err.stack or err.toString()
        throw err
    null

  _getBinding: (original, commandManager, sender, router)->
    result = false 
    isCommand = null
    if router.isCommand?
      isCommand = router.isCommand original, sender, commandManager
    else
      isCommand = (original.search escapeRegex commandManager.identifier) == 0
    if not isCommand
      #handle keywords or none command here
      ###
      for keyword in @keywords
        newKeyword = helper.compileText keyword, sender, commandManager, router
        try
          if (original.search newKeyword) >= 0
            regex = new RegExp newKeyword
            replace = helper.compileText @keywordMap[keyword], sender, commandManager, router
            text = (regex.exec original)[0].replace regex, replace
            break
        catch e
          console.log e
      ###
      textPromise = Q.all @keywords.map (keyword)=>
        regex = null
        envs = []
        helper.compileText keyword, sender, commandManager, router
        .then (newKeyword)=>
          if (original.search newKeyword) >= 0
            regex = new RegExp newKeyword
          else
            throw new Error 'not match'
          envs = regex.exec original
          helper.compileText @keywordMap[keyword], sender, commandManager, router, envs
        .then (replace)->
          (regex.exec original)[0].replace regex, replace
        .then ((i)->i), (err)->
          if err.message isnt 'not match'
            console.error err.stack or err.toString()
          false
      .then (results)->
        results = results.filter (i)-> !!i
        results[0] || false
    return textPromise
  
  _getBindingInfos: (original, commandManager, sender, router)->
    results = [] 
    if (original.search escapeRegex commandManager.identifier) != 0
      #handle keywords or none command here
      for keyword in @keywords
        newKeyword = helper.compileText keyword, sender, commandManager, router
        try
          if (original.search newKeyword) >= 0
            regex = new RegExp newKeyword
            replace = helper.compileText @keywordMap[keyword], sender, commandManager, router
            text = (regex.exec original)[0].replace regex, replace
            results.push
              keyword : keyword
              keywordCompiled : newKeyword
              text : @keywordMap[keyword]
              textCompiled : replace
              resultCommand : text
              
        catch e
          console.log e
      
    return results
  
  _isIgnored: (sender)->
    if 0 <= (@storage.get 'bindingIgnoredChannel', []).indexOf sender.target
      return true
    false
  
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
    
    @registerCommand 'add', bindCommand, []
    
    bindAppendCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindAppend sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command append command text to keyword! usage : ",
          "#{commandPrefix} keyword commandText.."
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=> return not fromBinding
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'append', bindAppendCommand, []
    
    unbindCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandUnbind sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command unbind command from keyword! usage : ",
          "#{commandPrefix} keyword"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=> return not fromBinding
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'remove', unbindCommand, []
    
    bindListCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindList sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command show  keywords! usage : ",
          "#{commandPrefix}"
        ]
      hasPermission: => return true
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'list', bindListCommand, []
    
    bindSearchCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindSearch sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command find  keywords! usage : ",
          "#{commandPrefix} text to match..."
        ]
      hasPermission: => return true
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'search', bindSearchCommand, []
  
    bindShowCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandBindShow sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["command show keyword content! usage: ",
          "#{commandPrefix} keyword"
        ]
      hasPermission: => return true
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'show', bindShowCommand, []
    
    ignoreChannelCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandIgnoreChannel sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["ignore keyword in a channel! usage: ",
          "#{commandPrefix} <channel>"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'ignoreChannel', ignoreChannelCommand, []
    
    unignoreChannelCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandRemoveIgnoredChannel sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["unignore keyword in a channel! usage: ",
          "#{commandPrefix} <channel>"
        ]
      hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)=>
        if fromBinding
          return false
        return commandManager.isOp sender.sender
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'unignoreChannel', unignoreChannelCommand, []
    
    listignoreChannelCommand =
      handle: (sender ,text, args, storage, textRouter, commandManager)=>
        @_commandListIgnoredChannel sender ,text, args, storage, textRouter, commandManager
      help: (commandPrefix)->
        return ["list ignored channel! usage: ",
          "#{commandPrefix}"
        ]
      hasPermission: => return true
      handleRaw: (sender, type, content)->return false
    
    @registerCommand 'listIgnoreChannel', listignoreChannelCommand, []
    
  _commandBind: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length < 3
      return false
    
    keyword = args[1]
    
    if keyword.length < 1
      commandManager.send sender, textRouter, "\u000304you need to bind at least one word!"
      return true 
    if not @manager.isOp sender.sender
      keyword = helper.escapeRegex keyword
    
    text = args[2..].join " "
    
    if 0 > @keywords.indexOf keyword
      if @manager.isOp sender.sender
        @keywords.unshift keyword
      else
        @keywords.push keyword
    @keywordMap[keyword] = text
    
    @storage.set "keywords" ,@keywords
    @storage.set "keywordMap", @keywordMap
    
    commandManager.send sender, textRouter, "binded #{keyword} to #{text}"
    return true

  _commandBindAppend: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length < 3
      return false
    
    keyword = args[1]
    
    keyword = keyword.replace /\\s/g, " "
    
    if keyword.length < 1
      commandManager.send sender, textRouter, "\u000304you need to identify at least one word!"
      return true
    
    if (not @manager.isOp sender.sender) and ((keyword.search /\^/) != 0)
      keyword = "^" + keyword
    
    text = args[2..].join " "
    
    
    if 0 > @keywords.indexOf keyword
      commandManager.send sender, textRouter, "\u000304No such keyword!"
      return true
      
    @keywordMap[keyword] += text
    
    @storage.set "keywordMap", @keywordMap
    
    commandManager.send sender, textRouter, "appended #{text} to #{keyword}"
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
    
    commandManager.send sender, textRouter, "unbinded commands from #{keyword}"
    return true

  _commandBindList: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    commandManager.sendPv sender, textRouter, "all used keywords : #{@keywords.join ', '}"
    return true
    
  _commandBindSearch: (sender , text, args, storage, textRouter, commandManager)->
    if args.length == 1
      return false
    searchText = args[1..].join ' '
    bindings = @_getBindingInfos searchText, commandManager, sender, textRouter
    commandManager.sendPv sender, textRouter, "Total matched bindings : #{bindings.length}"
    for binding, index in bindings
      commandManager.sendPv sender, textRouter, "
        [Binding #{index}]
        keyword: #{binding.keyword}, 
        keywordCompiled: #{binding.keywordCompiled},
        text: #{binding.text}, 
        textCompiled: #{binding.text},
        resultCommand: #{binding.resultCommand}
      "
    return true

  _commandBindShow: (sender , text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    if @keywordMap[args[1]]
      commandManager.send sender, textRouter, "#Found result binding text: #{@keywordMap[args[1]]}"
    else
      commandManager.send sender, textRouter, "#Keyword not found."
    return true
    
  _commandIgnoreChannel: (sender , text, args, storage, textRouter, commandManager)->
    return false if args.length isnt 2
    currentList = @storage.get 'bindingIgnoredChannel', []
    
    if '#' isnt args[1].slice 0, 1
      commandManager.send sender, textRouter, "#{args[1]} isnt a valid channel"
      return true
    
    if 0 <= currentList.indexOf args[1]
      commandManager.send sender, textRouter, "This channel was already ignored"
      return true
    currentList.push args[1]
    @storage.set 'bindingIgnoredChannel', currentList
    commandManager.send sender, textRouter, "ignored channel #{args[1]}"
    true
  
  _commandRemoveIgnoredChannel: (sender , text, args, storage, textRouter, commandManager)->
    return false if args.length isnt 2
    currentList = @storage.get 'bindingIgnoredChannel', []
    
    if '#' isnt args[1].slice 0, 1
      commandManager.send sender, textRouter, "#{args[1]} isnt a valid channel"
      return true
      
    index = currentList.indexOf args[1]
    
    if 0 > index
      commandManager.send sender, textRouter, "This channel was not ignored"
      return true
    
    currentList.splice index, 1
    @storage.set 'bindingIgnoredChannel', currentList
    commandManager.send sender, textRouter, "unignored channel #{args[1]}"
    true
    
  _commandListIgnoredChannel: (sender , text, args, storage, textRouter, commandManager)->
    return false if args.length isnt 1
    currentList = @storage.get 'bindingIgnoredChannel', []
    commandManager.send sender, textRouter, "all ignored channel: #{ currentList.join ', ' }"
    true
    
module.exports = Bind