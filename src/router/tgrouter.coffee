TextRouter = require './textrouter'
Telegram = require '../tgapi'
Senter = require '../senter.js'
{UTF8LengthSplit} = require '../util.js'
Message = require '../models/message'
Media = require '../models/media'
TelegramFile = require '../models/telegram_file'

class TelegramRouter extends TextRouter
  constructor: (@token, @channelPostFix = 'tg', @userPostFix = 'tg', @requireTag = false)->
    super
    @nameMap = {}
    @_selfName = null
    @_init()
    @messageBuffer = {}
    @bufferTimeout = 1000
    @bufferTimeoutId = null
    
  _init: ()->
    console.log "initing telegram with token #{@token}"
    @api = new Telegram @token
    @api.startPolling 40
    @api.getMe (err, res)=>
      return @emit err if err
      @setSelfName res.username
      
      ###
      @api.on 'message', (message)=>
        
        console.log JSON.stringify message, 0, 4
        
        channelId = "#" + message.chat.id.toString()
        
        if message.from.username
          @nameMap[message.from.username] = message.from.id
          
        if @channelPostFix
          channelId += "@" + @channelPostFix
        userName = message.from.username
        userName = userName || "undefined_#{message.from.id}"
        if @userPostFix
          userName += "@" + @channelPostFix
        text = message.text
        return if not text
        
        clonedRouter = {}
        
        for key, value of @
          clonedRouter[key] = value
          if 'function' is typeof value
            if not value.toString().match /\[native code\]/
              clonedRouter.key = value.bind @
              
        message_id = message.message_id
        message_ = message
        clonedRouter.output = (message, to)=>
                
          channelName = "#" + message_.chat.id.toString()
          channelName += "@" + @channelPostFix if @channelPostFix
          @output message, to, message_id, channelName
        console.log (new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + userName + ' => ' + channelId + ': ' + text.replace /\r?\n/g, '\r\n   | '
        @input text, userName, channelId, [], clonedRouter
      ###
      @api.on 'message', (message)=>
        channelId = "#" + message.chat.id.toString()
        
        if message.from.username
          @nameMap[message.from.username] = message.from.id
          
        if @channelPostFix
          channelId += "@" + @channelPostFix
        userName = message.from.username
        userName = userName || "undefined_#{message.from.id}"
        if @userPostFix
          userName += "@" + @channelPostFix
        
        
        clonedRouter = {}
        
        for key, value of @
          clonedRouter[key] = value
          if 'function' is typeof value
            if not value.toString().match /\[native code\]/
              clonedRouter.key = value.bind @
              
        message_id = message.message_id
        message_ = message
        clonedRouter.output = (message, to)=>
                
          channelName = "#" + message_.chat.id.toString()
          channelName += "@" + @channelPostFix if @channelPostFix
          @output message, to, message_id, channelName
        
        if message.sticker
          file = new TelegramFile message.sticker.file_id, @api, {
            MIME: 'image/webp',
            length: message.sticker.file_size,
            photoSize: [message.sticker.width, message.sticker.height]
          }
          fileThumb = new TelegramFile message.sticker.thumb.file_id, @api, {
            MIME: 'image/webp',
            length: message.sticker.thumb.file_size,
            photoSize: [message.sticker.thumb.width, message.sticker.thumb.height],
            isThumb: true
          }
          fileThumb.meta = {overrides:{MIME: 'image/webp'}}
          
          media = new Media {
            id : "#{message.sticker.file_id}@telegram-sticker",
            role : 'sticker',
            placeHolderText : '((sticker))',
            files: [file, fileThumb]
          }
          botMessage = new Message '((sticker))', [media], true, false
          botMessage.meta.time = new Date message.date * 1000
          
          # console.log botMessage
          
          @inputMessage botMessage, userName, channelId, [], clonedRouter
          
          ###
          media.getAllFiles().then (files)->
            console.log files
          .catch (err)->
            console.error err
          ###
        if message.photo
          files = message.photo.map (data)=>
            new TelegramFile data.file_id, @api, {
              length: data.file_size,
              photoSize: [data.width, data.height]
            }
          files[0].isThumb = true;
          console.log files
          
          media = new Media {
            id : "#{message.photo[0].file_id}@telegram-photo",
            role : 'photo',
            placeHolderText : '((photo))',
            files: files
          }
          botMessage = new Message '((photo))', [media], true, false
          botMessage.meta.time = new Date message.date * 1000
          
          @inputMessage botMessage, userName, channelId, [], clonedRouter
          
        if message.video
          videoThumb = new TelegramFile message.video.thumb.file_id, @api, {
            length: message.video.thumb.file_size,
            photoSize: [message.video.thumb.width, message.video.thumb.height],
            isThumb: true
          }
          video = new TelegramFile message.video.file_id, @api, {
            length: message.video.file_size,
            photoSize: [message.video.width, message.video.height],
            duration: message.video.duration
          }
          media = new Media {
            id : "#{message.video.file_id}@telegram-video",
            role : 'video',
            placeHolderText : '((video))',
            files: [video, videoThumb]
          }
          botMessage = new Message '((video))', [media], true, false
          botMessage.meta.time = new Date message.date * 1000
          
          # console.log botMessage
          
          @inputMessage botMessage, userName, channelId, [], clonedRouter
        
        if message.text
          botMessage = new Message message.text, [], true, true
          botMessage.meta.time = new Date message.date * 1000
          console.log (new Date botMessage.meta.time).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + userName + ' => ' + channelId + ': ' + message.text.replace /\r?\n/g, '\r\n   | '
          # console.log botMessage
          
          @inputMessage botMessage, userName, channelId, [], clonedRouter
          
        
      @on 'output', (m, target, replyId)=>
        console.log (new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + @getSelfName() + ' => ' + target + ': ' + m.replace /\r?\n/g, '\r\n   | '
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
        
        
        if replyId
          @api.sendMessage target, m, null, {
            reply_to_message_id: replyId
          }
        else
          @api.sendMessage target, m
      
    @on 'whois', (nick, cb)->
      process.nextTick ()->
        cb {account: nick}
    
  disconnect: (msg, cb)->
    @client.disconnect msg, cb
  
  getRouterIdentifier : ()->
    return @_routerIndetifier or "tg"
  
  parseArgs: (cmd)->
    temp = cmd.replace /^\//, ''
    .split /\u0020/g
    temp[0] = temp[0].replace /@.*/, ''
    temp
    
  getIdentifier : ()-> '/'
  
  input : (message, from, to, channal, router)->
    sender = new Senter from, to, message, channal
    @emit "input", message, sender, router
  
  inputMessage : (message, from, to, channal, router)->
    sender = new Senter from, to, message, channal
    @emit "message", message, sender, router
  
  output : (message, to, message_id, originalChannel, nobuffer)->
    message_id_temp = message_id
    
    if originalChannel and to isnt originalChannel
      message_id_temp = undefined
    
    if Array.isArray message
      message = message.join "\r\n"
      
    if (not nobuffer) and @bufferTimeout > 0
      if Array.isArray to
        to.forEach (to)=>
          @messageBuffer[to + '\u0000' + message_id_temp] = @messageBuffer[to + '\u0000' + message_id_temp] || []
          @messageBuffer[to + '\u0000' + message_id_temp].push message
          @bufferTimeoutId = setTimeout (@flushOutput.bind @), @bufferTimeout if not @bufferTimeoutId
      else
        @messageBuffer[to + '\u0000' + message_id_temp] = @messageBuffer[to + '\u0000' + message_id_temp] || []
        @messageBuffer[to + '\u0000' + message_id_temp].push message
        @bufferTimeoutId = setTimeout (@flushOutput.bind @), @bufferTimeout if not @bufferTimeoutId
      return
    
    if ('string' == typeof to) || not to?
      @emit "output", message, to, message_id_temp
    else
      for person in to
        @emit "output", message, person, message_id_temp
  
  flushOutput: ()->
    @bufferTimeoutId = null
    for key, value of @messageBuffer
      channel = (key.split '\u0000')[0]
      id = (key.split '\u0000')[1]
      channelTemp = parseInt channel, 10
      channel = channelTemp || channel
      id = parseInt id, 10
      if isNaN id
        id = null
      
      value = value.join "\r\n"
      @output value, channel, id, null, true
    @messageBuffer = {}
  
  toDisplayName: (str)-> "@#{str.replace /@.*/, ''}"

  isCommand: (str, sender)->
    if not str.match /^\//
      return false
    
    temp = str.replace /^\//, ''
    .split /\u0020/g
    
    if @requireTag
      
      if sender.target.match /#[^-]/
        return true
      
      if not temp[0].match /@/
        return false
      else
        return true
    else
      true

module.exports = TelegramRouter