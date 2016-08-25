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
      return @emit 'error', err if err
      if @userPostFix
        @setSelfName res.username + '@' + @userPostFix
      else
        @setSelfName res.username
      @_botInfo = res
      
      @api.on 'message', (message)=>
        channelId = "#" + message.chat.id.toString()
        
        if message.from.username
          @nameMap[message.from.username] = message.from.id
          
        if @channelPostFix
          channelId += "@" + @channelPostFix
        userName = message.from.username
        userName = userName || "undefined_#{message.from.id}"
        if @userPostFix
          userName += "@" + @userPostFix
        
        
        clonedRouter = {}
        
        for key, value of @
          clonedRouter[key] = value
          if 'function' is typeof value
            if not value.toString().match /\[native code\]/
              clonedRouter.key = value.bind @
              
        message_id = message.message_id
        message_ = message
        clonedRouter.output = (message, to, _message_id, originalChannel, nobuffer, textFormat)=>
                
          channelName = "#" + message_.chat.id.toString()
          channelName += "@" + @channelPostFix if @channelPostFix
          
          _message_id = _message_id or message_id
          channelName = originalChannel or channelName
          
          @output message, to, _message_id, channelName, nobuffer, textFormat
        
        botMessage = createBotMessage message, @
        if botMessage
          if message.text
            console.log (new Date botMessage.meta.time).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + userName + ' => ' + channelId + ': ' + message.text.replace /\r?\n/g, '\r\n   | '
          
          if message.reply_to_message
            targetMessage = createBotMessage message.reply_to_message, @
            if targetMessage
              botMessage.replyTo = {};
              botMessage.replyTo.message = targetMessage
              botMessage.replyTo.sender = createSenderFromMessage message.reply_to_message, @
          if message.forward_from
            botMessage.forwardFrom = createSenderFromUser message.forward_from, @
            
          @inputMessage botMessage, userName, channelId, [], clonedRouter
          
        
      @on 'output', (m, target, replyId, textFormat)=>
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
        
        sendOptions = {}
        if textFormat is 'html'
          sendOptions.parse_mode = 'HTML'
        if replyId
          sendOptions.reply_to_message_id = replyId
        
        @api.sendMessage target, m, null, sendOptions
      
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
  
  output : (message, to, message_id, originalChannel, nobuffer, textFormat='raw')->
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
      @emit "output", message, to, message_id_temp, textFormat
    else
      for person in to
        @emit "output", message, person, message_id_temp, textFormat
  
  outputMessage: (message, to, message_id, originalChannel)->
    if message.medias.length > 0
      if not message.meta["_#{@getRouterIdentifier()}"]
        return TextRouter::outputMessage.call this, arguments...
      else
        originalInfo = message.meta["_#{@getRouterIdentifier()}"]
        if originalInfo.sticker
          promise = @api.sendSticker originalInfo.chat.id, originalInfo.sticker.file_id
        else if originalInfo.photo
          promise = @api.sendPhoto originalInfo.chat.id, originalInfo.photo[originalInfo.photo.length - 1].file_id
        else if originalInfo.audio
          promise = @api.sendAudio originalInfo.chat.id, originalInfo.audio.file_id
        else if originalInfo.video
          promise = @api.sendVideo originalInfo.chat.id, originalInfo.video.file_id
        
        if promise
          return promise.then (res)=>
            new_message = createBotMessage res, @
            new_target = "##{res.chat.id}"
            if @channelPostFix
              new_target = new_target + "@" + @channelPostFix
            return {
              message: new_message,
              target: new_target
            }
        else
          return TextRouter::outputMessage.call this, arguments...
    
    @output message.text, to, message_id, originalChannel, true, message.textFormat
    
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
  
  toDisplayName: (str)-> 
    if str.match /^@/
      str
    else
      "@#{str.replace /@.*/, ''}"
  
  fromDisplayName: (str)->
    if not str.match /^@/
      return str
    
    str = str.replace /^@/, ''
    if @userPostFix
      str + '@' + @userPostFix
    else
      str
  
  isCommand: (str, sender, manager)->
    
    if (not str.match /^\//) or ((str.match /@/) and not (str.match new RegExp "@#{@_botInfo.username}($|[\\r\\n\\s])"))
      return false
      
    temp = str.replace /^\//, ''
    .split /\u0020/g
    
    args = @parseArgs str
    
    if not manager.hasCommand args[0]
      return false
    
    if @requireTag
      if sender.target.match /#[^-]/
        return true
      
      if not temp[0].match /@/
        return false
      else
        return true
    else
      true

createBotMessage = (message, telegramRouter)->
  
  if message.text
    botMessage = new Message message.text, [], true, true
    
    botMessage.textFormat = 'html'
    botMessage.textFormated = TelegramText.toHTML message.text, message.entities
    console.log botMessage.textFormated
  
  if message.sticker
    file = new TelegramFile message.sticker.file_id, telegramRouter.api, {
      MIME: 'image/webp',
      length: message.sticker.file_size,
      photoSize: [message.sticker.width, message.sticker.height]
    }
    fileThumb = new TelegramFile message.sticker.thumb.file_id, telegramRouter.api, {
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
    botMessage = new Message (message.text or "((tg-sticker:#{message.sticker.file_id}))"), [media], true, false
  
  if message.photo
    files = message.photo.map (data)=>
      new TelegramFile data.file_id, telegramRouter.api, {
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
    botMessage = new Message (message.caption or "((tg-photo:#{message.photo[0].file_id}))"), [media], true, false, (!!message.caption)
    
  if message.video
    videoThumb = new TelegramFile message.video.thumb.file_id, telegramRouter.api, {
      length: message.video.thumb.file_size,
      photoSize: [message.video.thumb.width, message.video.thumb.height],
      isThumb: true
    }
    video = new TelegramFile message.video.file_id, telegramRouter.api, {
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
    botMessage = new Message (message.caption or "((tg-video:#{message.video.file_id}))"), [media], true, false, (!!message.caption)
  
  if message.audio
    audio = new TelegramFile message.audio.file_id, telegramRouter.api, {
      length: message.audio.file_size,
      duration: message.audio.duration,
      MIME: message.audio.mime_type
    }
    audio.meta = {overrides:{MIME: message.audio.mime_type}}
    media = new Media {
      id : "#{message.audio.file_id}@telegram-audio",
      role : 'audio',
      placeHolderText : '((audio))',
      files: [audio],
      meta : {
        performer: message.audio.performer
        title: message.audio.title
      }
    }
    botMessage = new Message (message.text or "((tg-audio:#{message.audio.file_id}))"), [media], true, false
  
  if message.voice
    voice = new TelegramFile message.voice.file_id, telegramRouter.api, {
      length: message.voice.file_size,
      duration: message.voice.duration,
      MIME: message.voice.mime_type,
    }
    voice.meta = {overrides:{MIME: message.voice.mime_type}}
    media = new Media {
      id : "#{message.voice.file_id}@telegram-voice",
      role : 'audio',
      placeHolderText : '((voice))',
      files: [voice]
    }
    botMessage = new Message (message.text or "((tg-voice:#{message.voice.file_id}))"), [media], true, false
  
  if botMessage
    botMessage.meta.time = new Date message.date * 1000
    botMessage.meta['_' + telegramRouter.getRouterIdentifier()] = message;
    
    if telegramRouter.channelPostFix
      botMessage.meta.message_id = message.message_id + '@' + telegramRouter.channelPostFix
    else
      botMessage.meta.message_id = message.message_id
  
  return botMessage

createSenderFromMessage = (message, telegramRouter)->
  channelId = "#" + message.chat.id.toString()
  if telegramRouter.channelPostFix
    channelId += "@" + telegramRouter.channelPostFix
  userName = message.from.username
  userName = userName || "undefined_#{message.from.id}"

  if telegramRouter.channelPostFix
    userName += "@" + telegramRouter.channelPostFix

  sender = new Senter userName, channelId, message, []
  sender

createSenderFromUser = (user, telegramRouter)->
  channelId = "#__unknown__"
  if telegramRouter.channelPostFix
    channelId += "@" + telegramRouter.channelPostFix

  userName = user.username
  userName = userName || "undefined_#{user.id}"

  if telegramRouter.channelPostFix
    userName += "@" + telegramRouter.channelPostFix

  sender = new Senter userName, channelId, null, []
  sender

class TelegramText
  @toHTML: (text, entities)->
    chars = text.split ''
    
    # remove special entities
    chars = chars.map (i)->
      switch i
        when '&' then '&amp;'
        when '<' then '&lt;'
        when '>' then '&gt;'
        when '"' then '&quot;'
        when '\n' then '<br/>'
        else i
    
    offset = 0
    
    if not entities
      return chars.join ''
    
    for entity in entities
      switch entity.type
          
        when 'code'
          realOffset = offset + entity.offset
          chars.splice realOffset, 0, '<code>'
          chars.splice realOffset + entity.length + 1, 0, '</code>'
          offset += 2
          
        when 'bold'
          realOffset = offset + entity.offset
          chars.splice realOffset, 0, '<b>'
          chars.splice realOffset + entity.length + 1, 0, '</b>'
          offset += 2
        
        when 'italic'
          realOffset = offset + entity.offset
          chars.splice realOffset, 0, '<i>'
          chars.splice realOffset + entity.length + 1, 0, '</i>'
          offset += 2
           
        when 'pre'
          realOffset = offset + entity.offset
          
          for i in [realOffset..realOffset + entity.length - 1]
            if chars[i] is '<br/>'
              chars[i] = '\n'
            
          chars.splice realOffset, 0, '<pre>'
          chars.splice realOffset + entity.length + 1, 0, '</pre>'
          offset += 2
        
        when 'mention'
          realOffset = offset + entity.offset
          
          name = chars.slice realOffset + 1, realOffset + entity.length
          .join ''
          
          url = "https://telegram.me/#{encodeURIComponent name}"
          chars.splice realOffset, 0, "
            <a 
              href=\"#{url}\"
              data-tg-type=\"mention\"
            >"
          chars.splice realOffset + entity.length + 1, 0, '</a>'
          offset += 2
        
        when 'text_mention'
          realOffset = offset + entity.offset
          
          name = chars.slice realOffset, realOffset + entity.length
          .join ''
          
          if entity.user.username
            url = "https://telegram.me/#{encodeURIComponent entity.user.username}"
          else
            url = "#"
            
          chars.splice realOffset, 0, "
            <a 
              href=\"#{url}\"
              data-tg-type=\"text_mention\"
              data-tg-id=\"#{entity.user.id}\"
              data-tg-first_name=\"#{entity.user.first_name or ''}\"
              data-tg-last_name=\"#{entity.user.last_name or ''}\"
            >"
          chars.splice realOffset + entity.length + 1, 0, '</a>'
          offset += 2
        
        when 'url', 'email', 'text_link', 'hashtag', 'bot_command'
          realOffset = offset + entity.offset
          
          if entity.type in ['url', 'text_link', 'email']
            url = chars.slice realOffset, realOffset + entity.length
            .join ''
            if (not (url.match /^https?:\/\//) ) and (entity.type in ['url', 'text_link'])
              url = 'http://' + url
          else
            url = '#'
            
          if entity.type is 'email'
            url = 'mailto://' + url
            
          url = entity.url or url
          
          chars.splice realOffset, 0, "
            <a 
              href=\"#{url}\"
              data-tg-type=\"#{entity.type}\"
            >"
          chars.splice realOffset + entity.length + 1, 0, '</a>'
          offset += 2
          
        
    chars.join ''

module.exports = TelegramRouter