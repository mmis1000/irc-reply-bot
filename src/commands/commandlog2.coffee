Icommand = require '../icommand.js'
mongoose = require 'mongoose'
moment = require 'moment'
mubsub = require 'mubsub'
Grid = require 'gridfs-stream'
Q = require 'q'

escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"

class CommandLogs extends Icommand
  constructor: (@dbpath, @timezone = '+00:00', @locale = 'en', @collectionName = 'Messages', @gridFSCollectionName = 'FileContent')->
    @defaultPageShow = 10
    @pageShowMax = 15
    @Message = null
    
    @MessageChannel = null;
    
    mongoose.connect @dbpath
    
    db = mongoose.connection;
    db.on 'error', @_onDbConnect.bind @
    db.once 'open', @_onDbConnect.bind @, null
    
    console.log @dbpath, "#{@collectionName}Trigger"
    @MessageChannel = (mubsub @dbpath).channel "#{@collectionName}Trigger"
    
  _onDbConnect: (err, cb)=>
    @gfs = Grid mongoose.connection.db, mongoose.mongo
    
    if err
      console.error 'db error : '
      console.error err
      return
    
    fileSchemaFactory = require './log_modules/file_schema_factory'
    FileSchema = fileSchemaFactory mongoose
    @File =  mongoose.model 'File', FileSchema
    
    mediaSchemaFactory = require './log_modules/media_schema_factory'
    MediaSchema = mediaSchemaFactory mongoose, 'Files'
    @Media =  mongoose.model 'Media', MediaSchema
    
    messageSchemaFactory = require './log_modules/message_schema_factory'
    MessageSchema = messageSchemaFactory mongoose, @timezone, @locale, 'Medias'
    @Message =  mongoose.model 'Message', MessageSchema
    
  triggerDbUpdate: (obj)->
    #console.log('trigger %j', obj)
    
    clonedObj = {}
    
    clonedObj.from = obj.from
    clonedObj.to = obj.to
    clonedObj.time = obj.time
    clonedObj.isOnChannel = obj.isOnChannel
    clonedObj.message = obj.message
    clonedObj._id = obj._id
    
    #@MessageChannel.publish('update', {'command' : 'test'});
    @MessageChannel.publish('update', {'data' : clonedObj});
  
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length < 2
      return false
    
    if args[1] is "find"
      @_findlog(sender ,text, args, storage, textRouter, commandManager)
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
  _findlog: (sender ,text, args, storage, textRouter, commandManager)->
    {args, flags} = @_extractFlags args, {
      '-s' : 1
      '-t' : 1
      '-m' : 1
      '-r' : 2
      '-b' : 0
    }
    
    
    return false if args.length < 2 or args.length > 4

    return false if args[1] isnt 'find'
    
    args[2] = parseInt args[2], 10 if args[2]?
    args[3] = parseInt args[3], 10 if args[3]?
    
    return false if args[2] and isNaN args[2]
    return false if args[3] and isNaN args[3]
    
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
        return false
    
    
    ###
    if flags['-t']?
      if flags['']
    ###
    
    query = @Message.find query 
    
    query.count (err, count)=>
      console.log err if err?
      return if err?
      
      total = count
      
      #console.log count
      #console.log (pageNumber - 1) * pageSize
      #console.log pageSize
      
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
    return false  if not (type in ["message", "output"])
    
    if type is "message"
    
      onChannel = 0 is sender.target.search /#/
      date = content.meta.time or new Date
      
      if content.asText && content.medias.length is 0
        args = commandManager.parseArgs content.text
        
        return false if args[0] is "log"
        
        message = new @Message {
          from : sender.sender
          to : sender.target
          message : content.text
          isOnChannel : onChannel
          time : date
          medias: []
        }
      
      else if content.medias.length > 0
        if !@gfs
          mongoose.connection.once 'open', ()=>
            @handleRaw sender, type, content, textRouter, commandManager
          return
        
        (Q.all (content.medias.map (media)=>
          return media.getAllFiles())
        ).then (files)=>
          flattenFiles = [].concat.apply([], files);
          return flattenFiles.map (file)=>
            writestream = @gfs.createWriteStream {
              filename: 'file.UID'
              content_type: file.MIME
              root: @gridFSCollectionName
            }
            if not writestream.write file.content
              console.log 'waiting for file write finished'
              writestream.on 'drain', ()->
                writestream.end();
            
            writestream.on 'close', ()->
              console.log "file: #{file.UID} was writed to db"
            
            mongoFile = new @File {
              _id: file.UID
              MIME: file.MIME
              length: file.length
              photoSize: file.photoSize
              isThumb: file.isThumb
              contentSource: 'db'
              contentSrc: file.UID
            }
            mongoFile.save()
        .then ()=>
          console.log "all file infos was saved to db"
          Q.all content.medias.map (media)=>
            mongoMedia = new @Media {
              _id: media.id
              files: (media.files.map (i)-> i.UID)
              role: media.role
              placeHolderText: media.placeHolderText
              meta: media.meta
            }
            mongoMedia.save()
        .then ()=>
          console.log "all media infos was saved to db"
          mongoMessage = new @Message {
            from : sender.sender
            to : sender.target
            message : content.text
            isOnChannel : onChannel
            time : date
            medias: (content.medias.map (i)-> i.id)
          }
        .then ()=>
          console.log "message was saved to db"
        .catch (err)->
          console.error err.stack
        return
      else
        # should never goto here, if it is, it is a bug
        return
    if type is "output"
      
      onChannel = 0 is content.target.search /#/
      
      message = new @Message {
        from : textRouter.getSelfName()
        to : content.target
        message : content.message
        isOnChannel : onChannel
        time : new Date
      }
    
    message.save (err, remoteMessage)=>
      if err?
        console.error "error during save message: #{err.toString()}"
      #console.log 'save complete!'
      @triggerDbUpdate message
      null
      
    
    return true

module.exports = CommandLogs