virtual_class = require '../../virtualclass.js'
Icommand = require '../../icommand.js'
{EventEmitter} = require('events')
phantom = require 'phantom'
phantomjs = require 'phantomjs'
loadFileIn = require '../../folderloader.js'
path = require 'path'
imgur = require 'imgur'
tmp = require 'tmp'
fs = require 'fs'
cache = require 'memory-cache'
url = require 'url'
punycode = require 'punycode'
Q = require 'q'


phatomDir = "#{path.dirname phantomjs.path}#{path.sep}"

Accept_Language = "zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3"

MAX_SCREEN_SIZE_X = 2400
MAX_SCREEN_SIZE_Y = 2400


###
 * emit : parseurl
 * emit : beforecreate
 * emit : beforeopen
 * emit : beforequery
 * emit : afterquery
###
class CommandTitle extends virtual_class Icommand, EventEmitter
  constructor: (@storage)->
    @debug = true
    
    @setting = @storage.get 'titleParser', {enabled : true, mode : 'default', exclude : []}
    @matchRuleMap = {
      'default' : /https?:\/\/[^\.\s\/]+(?:\.[^\.\s\/]+)+(?:\/[^\s]*)?/g
      'strict' : /https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&\/=]*/g
    }
    @setting.exclude_image = @setting.excludeImage || [];
    @setting.image_size = @setting.image_size || { width: 1366, height: 768 };
    @fresh_phs = []
    @ph = false
      
    @_createRunner()
    ###
    phantom.create '--ignore-ssl-errors=yes', '--web-security=false', '--ssl-protocol=any', {path : phatomDir, onStdout : ()->null},(ph, error)=>
      @ph = ph
      console.log 'phantom instance created'
      if error
        console.log error
    ###
    @_loadPlugins()
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    switch args[1]
      when 'toggle'
        return false if args.length != 3
        if @_toggle args[2]
          commandManager.send sender, textRouter, "title parser has been toggled to #{args[2]}"
          return true
        else
          return false
      when 'mode'
        return false if args.length != 3
        if @_setMode args[2]
          commandManager.send sender, textRouter, "Changed mode to #{args[2]}"
        else
          commandManager.send sender, textRouter, "Failed to Change mode"
        return true
      when 'exclude'
        switch args[2]
          when 'add'
            return false if args.length != 4
            if @_addExclude args[3]
              commandManager.send sender, textRouter, 'Added rule successfully'
            else
              commandManager.send sender, textRouter, 'Invalid rule!'
            return true
          when 'remove'
            return false if args.length != 4
            if @_removeExclude args[3]
              commandManager.send sender, textRouter, 'Removed successfully'
            else
              commandManager.send sender, textRouter, 'No such rule!'
            return true
          when 'list'
            return false if args.length != 3
            commandManager.sendPv sender, textRouter, 'All excluded URLs :'
            commandManager.sendPv sender, textRouter, @_getExclude().join ', '
            return true
          when 'drop'
            return false if args.length != 3
            if @_dropExclude()
              commandManager.send sender, textRouter, 'Dropped rules!'
            else
              commandManager.send sender, textRouter, 'Fail to drop rule.'
            return true
      when 'exclude-image'
        switch args[2]
          when 'add'
            return false if args.length != 4
            if @_addExclude args[3], 'exclude_image'
              commandManager.send sender, textRouter, 'Added image excluded rule successfully'
            else
              commandManager.send sender, textRouter, 'Invalid rule!'
            return true
          when 'remove'
            return false if args.length != 4
            if @_removeExclude args[3], 'exclude_image'
              commandManager.send sender, textRouter, 'Removed image excluded rule successfully'
            else
              commandManager.send sender, textRouter, 'No such rule!'
            return true
          when 'list'
            return false if args.length != 3
            commandManager.sendPv sender, textRouter, 'All excluded image URLs :'
            commandManager.sendPv sender, textRouter, (@_getExclude 'exclude_image').join ', '
            return true
          when 'drop'
            return false if args.length != 3
            if @_dropExclude 'exclude_image'
              commandManager.send sender, textRouter, 'Dropped image excluded rules!'
            else
              commandManager.send sender, textRouter, 'Fail to drop rule.'
            return true
      when 'size'
        switch args[2]
          when 'set'
            return false if args.length != 5
            return false if isNaN parseInt args[3], 10
            return false if isNaN parseInt args[4], 10
            x = parseInt args[3], 10
            y = parseInt args[4], 10
            
            x = Math.min x, MAX_SCREEN_SIZE_X
            y = Math.min y, MAX_SCREEN_SIZE_Y
            
            @setting.image_size = {
              width : x,
              height : y
            }
            @_save()
            commandManager.send sender, textRouter, "sett size size to #{@setting.image_size.width} / #{@setting.image_size.height}"
            return true
            
          when 'get'
            return false if args.length != 3
            commandManager.send sender, textRouter, "cuurent size is #{@setting.image_size.width} / #{@setting.image_size.height}"
            
            return true
    return false
  
  help: (commandPrefix)->
    return [
      "make this bot to parse title in talks, Usage",
      "#{commandPrefix} toggle [on|off] #toggle this module",
      "#{commandPrefix} mode [#{@_getAllMatchModes().join '|'}] #should this bot parse URL contains non-ascii characetr",
      "#{commandPrefix} exclude add {regex} #don't detect url which matched this rule",
      "#{commandPrefix} exclude remove {regex} #remove exclude rule",
      "#{commandPrefix} exclude list #show current exclude rules",
      "#{commandPrefix} exclude drop #remove all exclude rules",
      "#{commandPrefix} exclude-image add {regex} #don't create screenshot which matched this rule",
      "#{commandPrefix} exclude-image remove {regex} #remove screenshot exclude rule",
      "#{commandPrefix} exclude-image list #show current screenshot exclude rules",
      "#{commandPrefix} exclude-image drop #remove all screenshot exclude rules",
      "#{commandPrefix} size set {width} {heaigh} #set screenshot size",
      "#{commandPrefix} size get #get screenshot size",
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return commandManager.isOp sender.sender
  
  #url parsing
  handleRaw: (sender, type, content, textRouter, commandManager)->
    if type isnt 'text'
      return true
    if 0 != sender.target.search '#'
      return true
    if not @setting.enabled
      return true
    if commandManager.isBanned sender
      return true
    
    
    event = {canceled : false}
    event.command = @
    event.sender = sender
    event.text = content
    event.router = textRouter
    event.manager = commandManager
    event.url = @_extractURL content
    
    if event.url and @_matchExclude event.url
      event.canceled = true

    @emit 'parseurl', event
    
    if not event.url || event.canceled
      return true
    
    originalUrl = event.url
    
    if cache.get originalUrl
      commandManager.send sender, textRouter, cache.get originalUrl
      return true
    
    
    if event.url and @_matchExclude event.url, 'exclude_image'
      event.noImage = true
    
    event.viewport = @setting.image_size
    
    event.cb = (title)->
      cache.put originalUrl, title, 2 * 3600 * 1000
      commandManager.send sender, textRouter, title
      
    @_queryTitle event
    return true
    
  _extractURL: (text)->
    text = text.toString()
    
    #dirty hack to remove irc color code
    text = text.replace /((?:\u0003\d\d?,\d\d?|\u0003\d\d?|\u0002|\u001d|\u000f|\u0016|\u001f))/g, ''
    
    allURLs = text.match @matchRuleMap[@setting.mode]
    if not allURLs
      return null
    temp = url.parse allURLs[0]
    
    fixCJKInPath = (str)->
      str.split ''
      .map (char)->
        return char if 127 > char.charCodeAt 0
        return encodeURIComponent char
      .join ''
    
    temp.pathname = fixCJKInPath temp.pathname if temp.pathname
    temp.search = fixCJKInPath temp.search if temp.search
    temp.hash = fixCJKInPath temp.hash if temp.hash
    
    return url.format temp
  
  _queryTitle: (event)->
    getpage = ()=> 
      # get runner
      deferred = Q.defer()
      @_getRunner().createPage (page) =>
        deferred.resolve page
      deferred.promise
    
    @emit 'beforecreate', event
    if event.canceled
      return true
    
    p = getpage()
    
    # open page
    p = p.then (page)=>
      page.set 'settings.resourceTimeout', 5000
      page.set 'settings.webSecurityEnabled ', false
      #page.set 'settings.loadImages', false
      page.set 'settings.userAgent', 'Mozilla/5.0 (Windows NT 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36'
      page.set 'customHeaders', {"Accept-Language" : Accept_Language}
      event.page = page
      
      @emit 'beforeopen', event
      if event.canceled
        page.close()
        e = new Error 'canceled'
        e.type = 'CANCELED'
        throw e
      
      console.log "Title : opening URL #{event.url}" if @debug
      
      event.timeOpen = Date.now()
      
      deferred = Q.defer()
      page.open event.url, (status)->
        console.log 'test'
        event.status = status
        console.log "Title : : opened site? ", status if @debug
        deferred.resolve page
        
          
        
      deferred.promise
      
    # after open page
    p = p.then (page)=>
      event.pageResult = event.status
      if event.status is 'fail'
        page.close()
        e = new Error 'fail to open page'
        e.type = 'CANNOT_OPEN_PAGE'
        throw e
      return page
    
    # get title
    p = p.then (page)=>
      event.queryCallback = ()=> 
        document.body.bgColor = 'white'
        JSON.stringify {
          title : document.title
          url : location.href
          rwd : !!((document.querySelectorAll 'meta[name=viewport]').length)
        }
      @emit 'beforequery', event
      if event.canceled
        page.close()
        e = new Error 'canceled'
        e.type = 'CANCELED'
        throw e
      
      deferred = Q.defer()
      page.evaluate event.queryCallback, (result) =>
        event.result = JSON.parse result
        deferred.resolve page
        
        
      deferred.promise
    
    # after get title
    p = p.then (page)=>
      @emit 'afterquery', event
      if event.canceled
        page.close()
        e = new Error 'canceled'
        e.type = 'CANCELED'
        throw e
      
      if not event.title
        event.title = "[ #{event.result.title} ] - #{if event.result.rwd then 'Mobile supported - ' else ''}#{Date.now() - event.timeOpen }ms - #{event.result.url}"
        
      console.log 'Title : Page title is ' + event.title if @debug
      return page
      
    if not event.noImage
    
      # set viewport
      p = p.then (page)=>
        viewport = event.viewport || { width: 1366, height: 768 }
        deferred = Q.defer()
        page.set 'viewportSize', viewport, (result)->
          console.log "Title : Viewport set to: " + result.width + "x" + result.height
          deferred.resolve page
        deferred.promise
      
      # create directory
      p = p.then (page)=>
        deferred = Q.defer()
        tmp.dir (err, dirPath, cleanupCallback)->
          console.log "Title : created dir #{dirPath}"
          event.imagePath = path.resolve dirPath, 'result.jpg'
          event.cleanupCallback = cleanupCallback
          deferred.resolve page
        deferred.promise
      
      # render image
      p = p.then (page)=>
        deferred = Q.defer()
        page.render event.imagePath, {format: 'jpeg', quality: '90'}, ()->
          console.log "Title : file created at #{event.imagePath}"
          deferred.resolve page
        deferred.promise
      
      #upload image
      p = p.then (page)=>
        clearUp = (path, cleanupCallback)->
          try
            fs.unlink path, ()->
              cleanupCallback()
          catch e
            console.log e
          
        page.close()
        
        console.log "Title : start to upload #{event.imagePath} to imgur"
        
        deferred = Q.defer()
        imgur.uploadFile event.imagePath
        .then (json)->
          event.imgurPath = json.data.link
          console.log "Title : uploaded #{event.imagePath}, URL is #{event.imgurPath}"
          clearUp event.imagePath, event.cleanupCallback
          deferred.resolve null
        .catch (err)->
          console.error err.message
          clearUp event.imagePath, event.cleanupCallback
          deferred.resolve null
        deferred.promise
    
    else
      
      #just close the page
      p = p.then (page)=>
        page.close()
      
      
    #append url if screenshot exist
    p = p.then ()=>
      if event.imgurPath 
        event.title = event.title + " - screenshot: " + event.imgurPath
      event.cb event.title
    
    p = p.catch (e)->
      console.log e
    
  #configs
  _save: ()->
    @storage.set 'titleParser', @setting
  
  _toggle: (value)->
    if value isnt 'on' and value isnt 'off'
      return false
    if value is 'on'
      @setting.enabled = true
    else
      @setting.enabled = false
    @_save()
    return true
      
  _setMode: (value)->
    if 0 > @_getAllMatchModes().indexOf value
      return false
    @setting.mode = value
    @_save()
    return true

  _getAllMatchModes: ()->
    modes = []
    for key, value of @matchRuleMap
      if @matchRuleMap.hasOwnProperty key
        modes.push key
    return modes

  _matchExclude: (url, name = 'exclude')->
    for item in @setting[name]
      if url.match item
        return true
    return false
    
  _addExclude: (regex, name = 'exclude')->
    regex = regex.toString()
    if regex in @setting[name]
      return true
    try
      new RegExp regex
      @setting[name].push regex
      @_save()
      return true
    catch e
      return false
      
  _removeExclude: (regex, name = 'exclude')->
    index = @setting[name].indexOf regex
    if index < 0
      return false
    @setting[name].splice index, 1
    @_save()
    return true
  
  _getExclude:(name = 'exclude')->
    return @setting[name][0..]

  _dropExclude:(name = 'exclude')->
    @setting[name] = []
    @_save()
    return true
    
  _loadPlugins:()->
    plugins = loadFileIn path.resolve __dirname, 'plugins'
    
    for plugin in plugins
      try
        plugin.module @
        console.log "loaded plugin from #{plugin.path}" if @debug
      catch e
        console.log "fail to load plugin from #{plugin.path} due to", e
  
  _createRunner:()->
    self = @
    phantom.create '--ignore-ssl-errors=true', '--web-security=false', '--ssl-protocol=any', {path : phatomDir, onStdout : (()->null), onStderr : (()->null), onExit : (code, signal)->
      if signal isnt null
        self.ph = null
        self._freshRunner()
        console.log "[Error] phantom instance killed due to #{signal}"
    },(ph, error)=>
      #console.log 'create runner', ph
      @fresh_phs.push ph
      ph.running = 0
      
      old_createPage = ph.createPage
      
      ph.createPage = (callback)=>
        ph.running += 1
        ph.dirty = true
        old_callback = callback
        callback = (page)=>
          #console.log 'create'
          old_close = page.close
          page.close = (args...)=>
            ph.running -= 1
            #console.log 'closed'
            old_close.apply page,args
            @_finishPage()
          old_callback.call null, page
        old_createPage.call ph, callback
        
      #console.log 'phantom instance created'
      if error
        console.log error
      @waiting = false
      @_freshRunner()
    @waiting = true
  
  _freshRunner:()->
    #console.log 'fresh runner'
    if !@ph
      @ph = @fresh_phs.pop()
      
    if @ph.dirty && @ph.running is 0 && @fresh_phs.length > 0
      @ph.exit()
      @ph = @fresh_phs.pop()
      #console.log "runner updated"
    
    
  _finishPage:()->
    @_freshRunner()
  
  _getRunner:()->
    if not @waiting and @fresh_phs.length is 0 
      @_createRunner()
    return @ph
    
module.exports = CommandTitle