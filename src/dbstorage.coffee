{EventEmitter} = require('events')
MongoClient = (require 'mongodb').MongoClient

noop = ()->

class DbStorage extends EventEmitter
  constructor: (path, @collectionName, @mainIndex, @autoIncrementFields = [], @indexedFields = [])->
    
    temp = {}
    for i in @autoIncrementFields
      temp[i] = 1
    for i in @indexedFields
      temp[i] = 1
    temp[@mainIndex] = 1
    
    @defultCounter = {}
    for i in @autoIncrementFields
      @defultCounter[i] = -1
    @defultCounter._id = @collectionName
    #console.log @defultCounter
    
    @_currentsCounts = {}
    
    @_connectiong = true
    MongoClient.connect path,(err, @db)=>
      #assert.ifError err
      if err?
        @emit 'error', err
        return null
      console.log("Connected correctly to #{path}");
      
      @db.on 'close', ()=>
        @emit 'close'
      
      @counters = db.collection 'counters'
      @datas = db.collection @collectionName
      
      @counters.insert @defultCounter, (err, res)=>
        @counters.findOne {_id : @collectionName}, (err, document)=>
          if err?
            @emit 'error', err
            return null
          for key, value of document
            if 0 != key.search '_'
              @_currentsCounts[key] = value
          console.log "current indexs %j", document
          #console.log temp
          @datas.ensureIndex temp, {unique:true, background:true, dropDups:true}, (err, res)=>
            if err?
              @emit 'error', err
              return null
            @_connectiong = false
            console.log("Prepare finished");
            @emit 'connect'
          
      
  add: (obj, cb=noop)->
    if @_connectiong
      @on 'connect', @add.bind @, arguments...
      return null
    
    temp = []
    for i in @autoIncrementFields
      if obj[i]?
        temp.push i
      delete obj[i]
    
    temp2 = {}
    for i in temp
      temp2[i] = 1
    #console.log "%j", temp
    @counters.findAndModify {_id : @collectionName}, [], {$inc: temp2}, {'new' : true}, (err, res)=>
      #assert.ifError err
      if err?
        cb err
        return null
      for i in temp
        obj[i] = res[i]
      #console.log "new indexes %j", res
      @_currentsCounts = res
      
      @datas.insert obj, (err, res)->
        #ssert.ifError err
        cb err, res
  
  
  ###
    return
      pageAll number
      page    number
      datas   document[]
  ###
  getPage: (field ,limit, page, fromEnd, cb)->
    if 'function' == typeof fromEnd
      cb = fromEnd
      fromEnd = false
    
    if @_connectiong
      @on 'connect', @getPage.bind @, arguments...
      return null
    
    if not field in @autoIncrementFields
      cb new Error "unindexed field #{field}"
    
    length = @_currentsCounts[field] + 1
    if not fromEnd
      offset = limit * page
    else
      offset = length - limit * (page + 1)
    
    query = {}
    query[field] = {$gte: offset, $lt: offset + limit}
    
    all = Math.ceil length / limit
    
    @datas.find query, (err, cursor)->
      if err?
        cb err
        return null
      cursor.toArray (err, res)->
        if err
          cb err
        else
          cb null, {data : res, page : page, all : all}
    
    #@datas.find 
  
  getPageCounts: (pageSize, cb)->
    if @_connectiong
      @on 'connect', @getPageCounts.bind @, arguments...
      return null
    
    counts = {}
    for i in @autoIncrementFields
      counts[i] = Math.ceil (@_currentsCounts[i]+1) / pageSize
    cb null, counts

  getRecordCounts: (cb)->
    if @_connectiong
      @on 'connect', @getRecordCounts.bind @, arguments...
      return null
    
    counts = {}
    for i in @autoIncrementFields
      counts[i] = @_currentsCounts[i] + 1
    cb null, counts

  get: (query = {}, cb)->
    if @_connectiong
      @on 'connect', @get.bind @, arguments...
      return null
    if 'function' == typeof query
      cd = query
      query = {}
    @datas.find query, (err, cursor)->
      if err?
        cb err
        return null
      cursor.toArray (err, res)->
        if err
          cb err
        else
          cb null, {data : res, page : page, all : all}
    
  
  dropAll: (cb=noop)->
    if @_connectiong
      @on 'connect', @dropAll.bind @, arguments...
      return null
    @datas.drop (err, reply)=>
      if err?
        cb err
        return null
      @counters.update {_id : @collectionName}, @defultCounter, {upsert:true, w: 1}, (err, res)->
        cb err, res
        
      
  remove: (_ids, cb=noop)->
    if not Array.isArray _ids
      _ids = [_ids]
    
    if @_connectiong
      @on 'connect', @remove.bind @, arguments...
      return null
    
    @datas.findAndRemove {_id : { $in: _ids }}, (err, res)->
      cb err, re
  
  close: (cb=noop)->
    @db.close cb
  
module.exports = DbStorage