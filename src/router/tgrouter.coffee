TextRouter = require './textrouter'
Telegram = require '../tgapi'
class TelegramRouter extends TextRouter
  constructor: (@token, @channelPostFix = 'tg', @userPostFix = 'tg')->
    super
    @nameMap = {}
    @_init()
    
  _init: ()->
    console.log "initing telegram with token #{@token}"
    @api = new Telegram @token
    @api.startPolling 40
    
    @api.on 'message', (message)=>
      console.log(message)
      
      channelId = "#" + message.chat.id.toString()
      
      if message.from.username
        @nameMap[message.from.username] = message.from.id
        
      if @channelPostFix
        channelId += "@" + @channelPostFix
      userName = message.from.username
      if @userPostFix
        userName += "@" + @channelPostFix
      text = message.text
      return if not text
      @input text, userName, channelId, []
    
    @on 'output', (m, target)=>
      target = target.replace /@.*$/, ''
      
      if target.match /^#/
        # a channel id
        target = target.replace /^#/, ''
        target = parseInt target, 10
      else if @nameMap[target]
        # a user name
        target = @nameMap[target]
      else
        return console.error "unknown username #{target}"
      
      @api.sendMessage target, m
      
    @on 'whois', (nick, cb)->
      process.nextTick ()->
        cb {account: nick}
    
  disconnect: (msg, cb)->
    @client.disconnect msg, cb
  
  getRouterIdentifier : ()->
    return "telegram.com"
  
  parseArgs: (cmd)->
    temp = cmd.replace /^\//, ''
    .split /\s/g
    temp[0] = temp[0].replace /@.*/, ''
    temp
    
  getIdentifier : ()-> '/'
  
module.exports = TelegramRouter