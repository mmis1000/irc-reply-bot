fs = require 'fs'
getFile = (path)->
  try
    fs.readFileSync(path).toString()
  catch e
    null

setFile = (path, content, cb)->
  fs.writeFile(path, content, cb);

setFileSync = (path, content)->
  fs.writeFileSync(path, content);

class GM_Storage
  constructor: (@savePath)->
    @useQuery = true
    @scheduled = false
    @saveInterval = 60 * 1000
    @cache = null
    @_load()
    @writing = false
    @writeNext = false
    
    process.on "exit", ()=>
      console.log "saveing storage dump..."
      @_save true
    
  set: (key, value)->
    #make sure always get newest value
    #@_load()
    @cache[key] = value
    @_save()

  get: (key, defaultValue)->
    #make sure always get newest value
    #@_load()
    if @cache[key] != undefined
      @cache[key]
    else if defaultValue?
      defaultValue
    else
      undefined

  remove: (key)->
    #make sure always get newest value
    #@_load()
    delete @cache[key]
    @_save()
  
  removeAll: ()->
    @cache = {}
    @_save()
  
  #use when storage was modified by another program
  reload: ()->
    @_load

  _load: ()->
    if getFile @savePath
      @cache = JSON.parse getFile @savePath
    else
      @cache = {}
      @_save true

  _save: (noQuery)->
    setTimeoutR = (a, b)->setTimeout b, a
    #console.log @
    if @useQuery and !noQuery
      if not @scheduled
        #console.log "[debug] write scheduled"
        setTimeoutR @saveInterval, ()=>
          @_writeFile()
          @scheduled = false
        @scheduled = true
    else
      @_writeFileSync()

  _writeFileSync: ()->
    JSONText = JSON.stringify @cache, null, 4
    setFileSync @savePath, JSONText
    
  _writeFile: ()->
    if not @writing
      #console.log "[debug] write start"
      JSONText = JSON.stringify @cache, null, 4
      setFile @savePath, JSONText, @_onWriteFinish.bind @
      @writing = true
    else
      @writeNext = true
  
  _onWriteFinish: ()->
    #console.log "[debug] write finished"
    @writing = false
    if @writeNext
      @writeNext = false
      @_writeFile()
    
module.exports = GM_Storage