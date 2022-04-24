Icommand = require '../icommand.js'

class CommandRegex extends Icommand
  constructor: (@storage)->
    super()
    @record = 10
    @lastMessages = {}
    @locale = {
      preMean : '的'
      mean : '意思'
      postMean : '是：'
      think : '認為'
    }
    @maxLoop = 50
    @enabled = {}
    if @storage
      @enabled = @storage.get 'regexReplace', {}
      @enabled = {} if 'object' != typeof @enabled
      
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2 || 0 > ['on', 'off'].indexOf args[1]
      return false
    
    if args[1] is 'on'
      @enabled[sender.target] = true
      if @storage
        @storage.set 'regexReplace', @enabled
      commandManager.send sender, textRouter, "regex module has been enabled for #{sender.target}"
    else
      @enabled[sender.target] = false
      if @storage
        @storage.set 'regexReplace', @enabled
      commandManager.send sender, textRouter, "regex module has been disabled for #{sender.target}"

    success = true
    return success
  
  help: (commandPrefix)->
    return [
      "Use regex to replace words. ",
      "The regex and replacedBy are actully passed into js's replace method directly.",
      "Please see http://www.w3schools.com/jsref/jsref_replace.asp for more detail.",
      "only \\ and / in replacedBy need to be escaped",
      "Usage:",
      "#{commandPrefix} [on|off] #toggle this module",
      "s/regex/replacedBy[/modifiers] #replace words in the sentence you said",
      "{nick} , s/regex/replacedBy/modifiers #replace words in the sentence others said, Use : after nick is also accepted, the space next to , or : is also optional",
      "Example:",
      "s/[a-zA-Z]// #remove first english alphabet found in yours words",
      "jame: s/[a-zA-Z]/*/g #replace all english alphabet in jame's words with *"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return commandManager.isOp sender.sender

  handleRaw: (sender, type, content, textRouter, commandManager)->
    #console.log sender, @enabled
    if not sender or not @enabled[sender.target]
      return true
    if type isnt "message" or not content.text or content.medias.length > 0
      return true
    
    #console.log content
    if 0 != sender.target.search '#'
      #who really cares about those messages sent by private message?
      sender.target.search '#'
      return
    
    tags = (/^([a-zA-Z0-9_@]+)(?:\s?[,:]\s?|\s)(.+)$/).exec content.text
    
    maybeACommand = false
    if not tags
      result = @_parseCommand content.text
      maybeACommand = !!content.text.match /^s\//
      sayer = sender.sender
    else
      result = @_parseCommand tags[2]
      sayer = textRouter.fromDisplayName tags[1]
      maybeACommand = !!tags[2].match /^s\//
      referredBy = sender.sender
    
    if content.replyTo
      result = @_parseCommand content.text
      sayer = content.replyTo.sender.sender
      referredBy = sender.sender
    
    #console.log result, @lastMessages[sayer], maybeACommand
    
    if (not result || (not @lastMessages[sayer] and not content.replyTo) || commandManager.isBanned sender)
      if not maybeACommand
        @lastMessages[sender.sender] = @lastMessages[sender.sender] || []
        @lastMessages[sender.sender].unshift content.text
        @lastMessages[sender.sender] = @lastMessages[sender.sender][0..@record - 1]
      return true
    
    if content.replyTo
      if false != @_replaceText content.replyTo.message.text, result
        changesMessage = @_replaceText content.replyTo.message.text, result
        if sender.sender isnt content.replyTo.sender.sender
          commandManager.send sender, textRouter, "#{textRouter.toDisplayName referredBy} #{@locale.think} #{textRouter.toDisplayName content.replyTo.sender.sender} #{@locale.preMean}\u0002#{@locale.mean}\u000f#{@locale.postMean} \u001d#{changesMessage}"
        else
          commandManager.send sender, textRouter, "#{textRouter.toDisplayName sayer} #{@locale.preMean}\u0002#{@locale.mean}\u000f#{@locale.postMean} \u001d#{changesMessage}"

      return true
    
    for message, index in @lastMessages[sayer]
      #if message.match result.regex
      if false != @_replaceText message, result
        changesMessage = @_replaceText message, result
        @lastMessages[sayer][index] = changesMessage
        if not referredBy
          textRouter.output "#{textRouter.toDisplayName sayer} #{@locale.preMean}\u0002#{@locale.mean}\u000f#{@locale.postMean} \u001d#{changesMessage}", sender.target
        else
          textRouter.output "#{textRouter.toDisplayName referredBy} #{@locale.think} #{textRouter.toDisplayName sayer} #{@locale.preMean}\u0002#{@locale.mean}\u000f#{@locale.postMean} \u001d#{changesMessage}", sender.target
        break
    
    return true

  _parseCommand: (text)->
    line = text.match /(\\u....|\\x..|\\.|.)/g
    if line[0] != 's' || line[1] != '/'
      return false
      
    line = @_splitArray line[2..], '/'
    
    
    if line.length % 2 == 0
      line.push []
      
    #console.log line, line.length, line.length % 2 == 0
    
    if line.length < 3
      return false
      
    line = line.map (i)-> i.join ''
    
    
    modifiers = line[-1..][0]
    line = line[0..-2]
    
    regexPairs = []
    regexPairs.flags = modifiers
    
    for item, index in line
      if index % 2 != 0
        continue
      try
        regex = new RegExp line[index], modifiers
        replace = line[index + 1].replace /\\(\/|\\)/g, '$1'
        regexPairs.push {
          regex : regex
          replace : replace
        }
      catch e
        console.log e
    #console.log regexPairs
    
    if regexPairs.length == 0
      return false
    regexPairs
    
  _replaceText: (text, regexPairs)->
    useLoop = 0 <= regexPairs.flags.search 'g'
    useLoop = useLoop and (regexPairs.length > 1)
    maxLoop = if useLoop then @maxLoop else 1
    #console.log "max loop #{maxLoop}, useLoop #{useLoop}"
    originalText = ''
    
    looped = 0
    while maxLoop > looped++
      originalText = text
      for pair, index in regexPairs
        text = text.replace pair.regex, pair.replace
      if originalText != text
        modified = true
      if originalText == text
        break
    
    if modified
      return text
    false

  _splitArray: (arr, seperator)->
    temp = []
    i = 0
    while true
      newI = arr.indexOf seperator, i
      if newI == -1
        temp.push arr[i..arr.length - 1]
        break
      if newI - 1 >= 0
        temp.push arr[i..newI - 1]
      else
        temp.push []
      i = newI + 1
    temp
      
module.exports = CommandRegex