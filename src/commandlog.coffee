Icommand = require './icommand.js'


class CommandSay extends Icommand
  constructor: (@storage)->
    @maxRecord = 500
    @defaultPageShow = 10
    @userPageShowMax = 20
    
    @logs = @storage.get "talks", []
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length < 2
      return false
    
    list = @logs
    
    if not commandManager.isOp sender.sender
      list = list.filter (obj)->
        return not obj.private
    
    switch args[1]
      when "show"
        @_showlog(sender ,text, args, storage, textRouter, commandManager, list)
      when "find"
        @_findlog(sender ,text, args, storage, textRouter, commandManager, list)
      else
        false
    
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
        #{date.getMonth()}/\
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
  
  help: (commandPrefix)->
    return [
      "view recent talks, this command will force send to you instead of channel ",
      "Usage:", 
      "#{commandPrefix} show [page, default to 1 if omit] [records per page, default to #{@defaultPageShow} if omit]",
      "#{commandPrefix} find [sender/text/target] [regex] [page, default to 1 if omit] [records per page, default to #{@defaultPageShow} if omit]"
    ]
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true
  
  handleRaw: (sender, type, content, textRouter, commandManager)->
    if type isnt "text"
      return false
    
    args = commandManager.parseArgs content
    if args[0] is "log"
      return false
    
    isPrivate = (sender.target != sender.channel)
    
    @logs.push
      time : Date.now()
      from : sender.sender
      to : sender.target
      private : isPrivate
      message : content
    
    @storage.set "talks", @logs
    return true

module.exports = CommandSay