Icommand = require '../icommand.js'
mongoose = require 'mongoose'
moment = require 'moment'
mubsub = require 'mubsub'
Grid = require 'gridfs-stream'
Q = require 'q'
LRU = require 'lru-cache'

escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"

class CommandLogs extends Icommand
  constructor: (@dbpath, @timezone = '+00:00', @locale = 'en', @collectionName = 'Messages', @gridFSCollectionName = 'FileContent')->
    @defaultPageShow = 10
    @pageShowMax = 15
    @Message = null
    
    @MessageChannel = null;
    
    @userInfoCache = LRU { max: 400, maxAge: 1000 * 60 * 60 * 2 }
    
    mongoose.connect @dbpath
    
    db = mongoose.connection;
    db.on 'error', @_onDbConnect.bind @
    db.once 'open', @_onDbConnect.bind @, null
    db.setMaxListeners(Infinity );
    
    console.log @dbpath, "#{@collectionName}Trigger"
    @MessageChannel = (mubsub @dbpath).channel "#{@collectionName}Trigger"
    
  _onDbConnect: (err, cb)=>
    if err
      console.error 'db error : '
      console.error err
      return
      
    @gfs = Grid mongoose.connection.db, mongoose.mongo
    
    fileSchemaFactory = require './log_modules/file_schema_factory'
    FileSchema = fileSchemaFactory mongoose
    @File =  mongoose.model 'File', FileSchema
    
    mediaSchemaFactory = require './log_modules/media_schema_factory'
    MediaSchema = mediaSchemaFactory mongoose, 'Files'
    @Media =  mongoose.model 'Media', MediaSchema
    
    messageSchemaFactory = require './log_modules/message_schema_factory'
    MessageSchema = messageSchemaFactory mongoose, @timezone, @locale, 'Medias'
    @Message =  mongoose.model 'Message', MessageSchema
    
    userSchemaFactory = require './log_modules/user_schema_factory'
    UserSchema = userSchemaFactory mongoose, 'Medias'
    @User =  mongoose.model 'User', UserSchema
    
  triggerDbUpdate: (obj)->
    #console.log('trigger %j', obj)
    
    clonedObj = {}
    
    clonedObj.from = obj.from
    clonedObj.to = obj.to
    clonedObj.time = obj.time
    clonedObj.isOnChannel = obj.isOnChannel
    clonedObj.message = obj.message
    clonedObj.medias = obj.medias
    clonedObj.meta = obj.meta
    clonedObj._id = obj._id
    
    @MessageChannel.publish('update', {'data' : clonedObj});
  
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length < 2
      return false
    
    if args[1] is "find"
      done = textRouter.async()
      @_findlog(sender ,text, args, storage, textRouter, commandManager, done)
    else
      false
  ###
  flagSet
    {
      '-s' : 1
      '-t' : 1
      '-m' : 1
      '-r' : 2
    }
  ###
  _extractFlags: (args, flagSet)->
    args = args[0..]
    flags = Object.keys flagSet
    find = (arr, list)->
      for item in list
        index = arr.indexOf item
        if index isnt -1
          return {
            index : index
            item : item
          }
      null
    
    flagResult = {}
    
    while result = find args, flags
      temp = args.splice result.index, flagSet[result.item] + 1
      flagResult[result.item] = temp[1..]
    
    {
      args : args
      flags : flagResult
    }
  _findlog: (sender ,text, args, storage, textRouter, commandManager, done)->
    {args, flags} = @_extractFlags args, {
      '-s' : 1
      '-t' : 1
      '-m' : 1
      '-r' : 2
      '-b' : 0
    }
    
    
    if args.length < 2 or args.length > 4
      done()
      return false 
    if args[1] isnt 'find'
      done()
      return false
    
    args[2] = parseInt args[2], 10 if args[2]?
    args[3] = parseInt args[3], 10 if args[3]?
    
    if args[2] and isNaN args[2]
      done()
      return false
    if args[3] and isNaN args[3]
      done()
      return false
    
    pageNumber = args[2] || 1
    pageSize = args[3] || @defaultPageShow
    pageSize = @pageShowMax if pageSize > @pageShowMax
    
    query = {}
    
    #prevent lag
    startDay = (moment()).subtract 1, 'M'
    .toDate()
    
    query.time = {
      $gte : startDay
    }
    
    if flags['-b']?
      query.isOnChannel = false
    
    if flags['-t']?
      regexSet = /^\/(.+)\/([gimy]*)/.exec flags['-t'][0]
      if regexSet
        query.to = {$regex: regexSet[1], $options: regexSet[2]}
      else
        query.to = {$regex: (escapeRegex flags['-t'][0])} 
    
    if flags['-s']?
      regexSet = /^\/(.+)\/([gimy]*)/.exec flags['-s'][0]
      if regexSet
        query.from = {$regex: regexSet[1], $options: regexSet[2]}
      else
        query.from = {$regex: (escapeRegex flags['-s'][0])} 
    
    if flags['-m']?
      regexSet = /^\/(.+)\/([gimy]*)/.exec flags['-m'][0]
      if regexSet
        query.message = {$regex: regexSet[1], $options: regexSet[2]}
      else
        query.message = {$regex: (escapeRegex flags['-m'][0])} 
    
    if flags['-r']?
      regex = /^(\d+)\/(\d+)(?:\/(\d+))?$/
      timeFrom = regex.exec flags['-r'][0]
      timeTo = regex.exec flags['-r'][1]
      if timeFrom and timeTo
        currentYear = (moment()).utcOffset @timezone
        .year();
        
        timeFrom[3] =  timeFrom[3] || currentYear
        timeTo[3] =  timeTo[3] || currentYear
        
        timeFrom = (moment "#{timeFrom[3]}/#{timeFrom[1]}/#{timeFrom[2]} #{@timezone}", "YYYY/MM/DD Z").toDate()
        timeTo = (moment "#{timeTo[3]}/#{timeTo[1]}/#{timeTo[2]} #{@timezone}", "YYYY/MM/DD Z").add 1, 'd'
        .toDate()
        
        if (moment timeTo).isBefore timeFrom
          [timeFrom, timeTo] = [timeTo, timeFrom]
          
        query.time = {
          $gte : timeFrom
          $lt : timeTo
        }
      else
        done()
        return false
    
    query = @Message.find query 
    
    query.count (err, count)=>
      console.log err if err?
      if err?
        done()
        return
      
      total = count
      
      maxPage = Math.ceil total / pageSize
      
      query.skip (pageNumber - 1) * pageSize
      
      # fix error during request last page of log
      if maxPage is pageNumber
        pageSize = total % pageSize
        
      query.limit pageSize
      
      .sort { 'time' : -1}
      query.find (err, messages)=>
        console.log err if err?
        return if err?
        
        #console.log messages
        messages.reverse()
        
        for message in messages
          commandManager.sendPv sender, textRouter, message.toString()
        
        commandManager.sendPv sender, textRouter, "Page #{pageNumber} of total #{maxPage} Pages. Time Zone is #{@timezone}"
        done()
  help: (commandPrefix)->
    return [
      "view recent talks, this command will force send to you instead of channel ",
      "Usage:", 
      "#{commandPrefix} find [-flags] [page, default to 1 if omit] [records per page, default to #{@defaultPageShow} if omit]",
      "flags :",
      "    -b : show message to the bot only"
      "    -s [senderRegex]: show message from sender only",
      "    -t [targetRegex]: show message to target only",
      "    -m [messageRegex] : show message matches specific regex only",
      "    -r [startTime] [endTime] : shoe message in range only",
      "example: #{commandPrefix} find -t channelName 1 10",
      "notes : if the regex field is not regex, it will be used as a string to do full match"
    ]
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true
  
  handleRaw: (sender, type, content, textRouter, commandManager)->
    return false  if not (type in ["message", "outputMessage"])
    
    if not @Message
      console.warn 'not able to connect to mongodb, throttle log writing'
      @db.once 'open', ()=>
        @handleRaw arguments...
      return
    
    if type is "message"
      @_saveUser sender.senderInfo, commandManager if sender.senderInfo
      @_saveUser sender.targetInfo, commandManager if sender.targetInfo
      @_saveUser sender.channelInfo, commandManager if sender.channelInfo
      
      
      onChannel = 0 is sender.target.search /#/
      date = content.meta.time or new Date
      
      if content.asText && content.medias.length is 0
        args = commandManager.parseArgs content.text
        
        return false if args[0] is "log"
        
        # message format v2
        if content.textFormated and content.textFormat
          message = new @Message {
            from : sender.sender
            to : sender.target
            message : content.text
            messageFormat : content.textFormat
            messageFormated : content.textFormated
            isOnChannel : onChannel
            time : date
            medias: []
            meta: content.meta
          }
        else
          message = new @Message {
            from : sender.sender
            to : sender.target
            message : content.text
            isOnChannel : onChannel
            time : date
            medias: []
            meta: content.meta
          }
      else if content.medias.length > 0
        if !@gfs
          mongoose.connection.setMaxListeners Infinity
          mongoose.connection.once 'open', ()=>
            @handleRaw sender, type, content, textRouter, commandManager
          return
        @_saveMediaMessage sender.sender, sender.target, content
        return
      else
        # should never goto here, if it is, it is a bug
        return
    if type is "outputMessage"
      
      textRouter.getSelfInfo()
      .then (user)=>
        @_saveUser user if user
      
      onChannel = 0 is content.target.search /#/
      date = content.message.meta.time or new Date
      
      if content.message.asText && content.message.medias.length is 0
        args = commandManager.parseArgs content.message.text
        return false if args[0] is "log"
      
        # message format v2
        if content.message.textFormated and content.message.textFormat
          message = new @Message {
            from : textRouter.getSelfName()
            to : content.target
            message : content.message.text
            messageFormat : content.message.textFormat
            messageFormated : content.message.textFormated
            isOnChannel : onChannel
            time : date
            medias: []
            meta: content.message.meta
          }
        else
          message = new @Message {
            from : textRouter.getSelfName()
            to : content.target
            message : content.message.text
            isOnChannel : onChannel
            time : date
            medias: []
            meta: content.message.meta
          }
      else
        @_saveMediaMessage textRouter.getSelfName(), content.target, content.message
        return
    message.save (err, remoteMessage)=>
      if err?
        return console.error "error during save message: #{err.toString()}"
      @triggerDbUpdate message
      null
      
    
    return true
  
  
  _saveFile: (file)->
    defered = Q.defer()
    @File.findOne {_id: file.UID}
    .then (doc)=>
      if doc
        console.log "file #{file.UID} existed. skipping..."
        defered.resolve doc
        throw new Error 'doc exist'
      writestream = @gfs.createWriteStream {
        filename: file.UID
        content_type: file.MIME
        root: @gridFSCollectionName
      }
      ###
      console.log {
        filename: file.UID
        content_type: file.MIME
        root: @gridFSCollectionName
      }
      ###
      stream = require 'stream'
      bufferStream = new stream.PassThrough()
      bufferStream.end new Buffer file.content
      bufferStream.pipe writestream
      
      writestream.on 'close', ()->
        console.log "file: #{file.UID} was writed to db"
      
      query = @File.findOneAndUpdate {
        _id: file.UID
      }, {
        _id: file.UID
        MIME: file.MIME
        length: file.length
        photoSize: file.photoSize
        isThumb: file.isThumb
        contentSource: 'db'
        contentSrc: file.UID
      }, {
        upsert: true
        new: true
      }
      query.exec()
    .then (file)->
      defered.resolve file
    .catch (err)->
      defered.reject err

    defered.promise
    
  _saveMedia: (media)->
    defered = Q.defer()
    @Media.findOne {_id: media.id}
    .then (doc)=>
      if doc
        console.log "media #{media.id} existed. skipping..."
        defered.resolve doc
        throw new Error 'doc exist'
      
      time = media.meta.time
      delete media.meta.time
      @Media.findOneAndUpdate {
        _id: media.id
      }, {
        _id: media.id
        files: (media.files.map (i)-> i.UID)
        role: media.role
        placeHolderText: media.placeHolderText
        time: time
        meta: media.meta
      }, {
        upsert: true
        new: true
      }
      .exec()
    .then (media)->
      defered.resolve media
    .catch (err)->
      defered.reject err

    defered.promise
  
  _saveMediaMessage: (from, to, message)->
    date = message.meta.time or new Date
    onChannel = 0 is to.search /#/
    
    (Q.all (message.medias.map (media)=>
      return media.getAllFiles())
    ).then (files)=>
      flattenFiles = [].concat.apply([], files);
      return flattenFiles.map (file)=>
        @_saveFile file
    .then ()=>
      console.log "all file infos was saved to db"
      Q.all message.medias.map (media)=>
        media.meta = media.meta or {}
        media.meta.time = media.meta.time or date
        @_saveMedia media
    .then ()=>
      console.log "all media infos was saved to db"
      mongoMessage = new @Message {
        from : from
        to : to
        message : message.text
        isOnChannel : onChannel
        time : date
        medias: (message.medias.map (i)-> i.id)
        meta: message.meta
      }
      mongoMessage.save()
    .then (message)=>
      @triggerDbUpdate message
      console.log "message was saved to db"
    .catch (err)->
      console.error err.stack
      
  _saveUser: (userInfo, manager)->
    if @userInfoCache.get userInfo.id
      # console.log "userInfo for #{userInfo.id} didn't be updated because it is in cache"
      if (@userInfoCache.get userInfo.id) is manager.userInfoCache.get userInfo.id
        return
    
    @userInfoCache.set userInfo.id, userInfo
    
    user = new @User {
      _id: userInfo.id
      images: []
      ids: [userInfo.id].concat userInfo.aliases
      nicknames: userInfo.nicknames
      
      firstName: userInfo.firstName
      midName: userInfo.midName
      lastName: userInfo.lastName
      
      profileUrl: userInfo.profileUrl
    }
    
    # console.log user
    
    mediasPromise = Q.all userInfo.images.map (media)=>
      date = new Date
      media.meta = media.meta or {}
      media.meta.time = media.meta.time or date
      @_saveMedia media
    
    mediasPromise.then (medias)=>
      user.images = medias.map (media)->
        # console.log media
        media._id
      @User.findOneAndUpdate {
        _id: user.id
      }, user, {
        upsert: true
        new: true
      }
      .exec()
    .then (user)=>
      console.log "userInfo for #{user._id} have been updated"
      @MessageChannel.publish('user-update', {'data' : user.toObject()});
    .catch (err)->
      console.error "error during update user info for #{userInfo.id}"
      console.error err
      console.error err.stack
      
    
module.exports = CommandLogs