fs = require 'fs'
getFile = (path)->
  try
    fs.readFileSync(path).toString()
  catch e
    null
setFile = (path, content)->
  fs.writeFileSync(path, content);

class GM_Storage
  constructor: (@savePath)->
    @useQuery = true
    @scheduled = false
    @saveInterval = 600 * 1000
    @cache = null
    @_load()
    
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
        setTimeoutR @saveInterval, ()=>
          JSONText = JSON.stringify @cache, null, 4
          setFile @savePath, JSONText
          @scheduled = false
        @scheduled = true
    else
      JSONText = JSON.stringify @cache, null, 4
      setFile @savePath, JSONText


module.exports = GM_Storage