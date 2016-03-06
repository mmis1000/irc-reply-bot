Icommand = require '../icommand.js'
mongoose = require 'mongoose'
moment = require 'moment'
mubsub = require 'mubsub'

escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"

class CommandLogs extends Icommand
  constructor: (@dbpath, @timezone = '+00:00', @locale = 'en', @collectionName = 'Messages')->
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
    #@MessageChannel.subscribe 'update', (obj)->
    #  console.log '#obj: %j', obj 
    #@MessageChannel.publish('update', {'command' : 'test'});
  _onDbConnect: (err, cb)=>
    if err
      console.error 'db error : '
      console.error err
      return
    ###
    MessageSchema = mongoose.Schema {
      from : String
      to : String
      message : String
      isOnChannel : Boolean
      time : { type : Date, index : true }
    }, { collection : @collectionName }
    
    self = @
    MessageSchema.methods.toString = ()->
      timeStamp = moment @time
      .utcOffset self.timezone
      .locale self.locale
      .format 'YYYY-MM-DD hh:mm:ss a'
      
      "#{timeStamp} #{@from} => #{@to}: #{@message}"
    ###
    
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
    
  ###
  _showlog: (sender ,text, args, storage, textRouter, commandManager, list)->
    if args.length > 4
      return false
    
    pageNumber = if args[2] then (parseInt args[2]) else 1
    recordsPerPage = if args[3] then (parseInt args[3]) else @defaultPageShow
    
    if isNaN pageNumber
      return false
    if isNaN recordsPerPage
      return false
    
    if not commandManager.isOp sender.sender
      if recordsPerPage > @userPageShowMax
        recordsPerPage = @userPageShowMax
    
    result = @_pagelog list, recordsPerPage, pageNumber
    
    replys = []
    
    for record in result.list
      date = new Date record.time
      replys.push "#{date.getFullYear()}/\
        #{date.getMonth() + 1}/\
        #{date.getDate()}-\
        #{date.getHours()}:\
        #{date.getMinutes()}:\
        #{date.getSeconds()}
        #{record.from} =>
        #{record.to} :
        #{record.message}"
    
    replys.push "page #{result.pageNumber} of #{result.allPage}"
    textRouter.output replys, sender.sender
    return true
    
  _findlog: (sender ,text, args, storage, textRouter, commandManager, list)->
    
    
    if args.length > 6 || args.length < 4
      return false
    if 0 > ["sender", "text", "target"].indexOf args[2]
      return false
    
    pageNumber = if args[4] then (parseInt args[4]) else 1
    recordsPerPage = if args[5] then (parseInt args[5]) else @defaultPageShow
    
    if isNaN pageNumber
      return false
    if isNaN recordsPerPage
      return false
    
    
    try 
      regex = new RegExp args[3]
    catch
      textRouter.output "\u000304invalid regex", sender.sender
      return true
    
    switch args[2]
      when "sender"
        list = list.filter (obj)->
          0 <= obj.from.search regex
      when "text"
        list = list.filter (obj)->
          0 <= obj.message.search regex
      when "target"
        list = list.filter (obj)->
          0 <= obj.to.search regex
    
    return @_showlog sender ,text, [args[0], "show", args[4], args[5]], storage, textRouter, commandManager, list
    
  _pagelog: (list, itemPerPage, pageNumber)->
    totalPage = Math.ceil (list.length / itemPerPage)
    
    indexStart = list.length - pageNumber * itemPerPage
    indexEnd = indexStart + itemPerPage
    
    indexStart = if (indexStart >= 0) then indexStart else 0
    indexEnd = if (indexEnd >= 0) then indexEnd else 0
    indexStart = if (indexStart <= list.length) then indexStart else list.length
    indexEnd = if (indexEnd <= list.length) then indexEnd else list.length
    
    newList = []
    
    i = indexStart
    while i < indexEnd
      newList.push list[i]
      i++
    
    filteredList = 
      list : newList
      pageNumber : pageNumber
      allPage :totalPage
    
    return filteredList
  ###
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
      
      if content.asText
        
        args = commandManager.parseArgs content.text
        
        return false if args[0] is "log"
        
        onChannel = 0 is sender.target.search /#/
        
        date = content.meta.time or new Date
        
        message = new @Message {
          from : sender.sender
          to : sender.target
          message : content.text
          isOnChannel : onChannel
          time : date
          medias: []
        }
    
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