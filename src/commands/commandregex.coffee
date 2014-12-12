Icommand = require '../icommand.js'

class CommandRegex extends Icommand
  constructor: (@storage)->
    @record = 10
    @lastMessages = {}
    @locale = {
      preMean : '的'
      mean : '意思'
      postMean : '是：'
      think : '認為'
    }
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2 || 0 > ['on', 'off'].indexOf args[1]
      return false
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"
    textRouter.output message, sender.channel
    success = true
    return success
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return ["toggle this model, Usage", "#{commandPrefix} [on|off]"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return commandManager.isOp sender.sender

  handleRaw: (sender, type, content, textRouter, commandManager)->
    
    if type isnt "text"
      return false
    
    #console.log content
    if 0 != sender.target.search '#'
      #who really cares about those messages sent by private message?
      sender.target.search '#'
      return
    
    tags = (/^([a-zA-Z0-9]+)\s?[,:]\s?(.+)$/).exec content
    
    
    if not tags
      result = @_parseCommand content
      sayer = sender.sender
    else
      result = @_parseCommand tags[2]
      if result
        sayer = tags[1]
        referredBy = sender.sender
    
    if not result || not @lastMessages[sayer]
      @lastMessages[sender.sender] = @lastMessages[sender.sender] || []
      @lastMessages[sender.sender].unshift content
      @lastMessages[sender.sender] = @lastMessages[sender.sender][0..@record - 1]
      return true
    
    for message, index in @lastMessages[sayer]
      if message.match result.regex
        changesMessage = message.replace result.regex, result.replace
        @lastMessages[sayer][index] = changesMessage
        if not referredBy
          textRouter.output "#{sayer} #{@locale.preMean}\u0002#{@locale.mean}\u000f#{@locale.postMean} \u001d#{changesMessage}", sender.target
        else
          textRouter.output "#{referredBy} #{@locale.think} #{sayer} #{@locale.preMean}\u0002#{@locale.mean}\u000f#{@locale.postMean} \u001d#{changesMessage}", sender.target
          break
    
    return true

  _parseCommand: (text)->
    line = text.match /(\\u....|\\x..|\\.|.)/g
    if line[0] != 's' || line[1] != '/'
      return false
    
    slashs = (line.filter ((i)->return i=="/")).length
    if 2 == slashs
      line.push '/'
      slashs = 3
      #console.log JSON.stringify line
    if 3 != slashs
      return false
    
    slash2 = line.indexOf '/', 2
    
    regex = line[2..slash2 - 1].join ''
    #console.log regex
    if regex.length == 0
      return false
    
    slash3 = line.indexOf '/', slash2 + 1
    
    replace = (line[slash2 + 1..slash3 - 1].join '').replace /\\\//g, '/'
    #console.log replace
    
    flags = line[slash3 + 1..].join ''
    #console.log flags
    
    try
      regex = new RegExp regex, flags
      return {
        regex : regex
        replace : replace
      }
    catch e
      return false
module.exports = CommandRegex