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

phatomDir = "#{path.dirname phantomjs.path}#{path.sep}"

Accept_Language = "zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3"

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
              
    return false
  
  help: (commandPrefix)->
    return [
      "make this bot to parse title in talks, Usage",
      "#{commandPrefix} toggle [on|off] #toggle this module",
      "#{commandPrefix} mode [#{@_getAllMatchModes().join '|'}] #should this bot parse URL contains non-ascii characetr",
      "#{commandPrefix} exclude add {regex} #don't detect url which matched this rule",
      "#{commandPrefix} exclude remove {regex} #remove exclude rule",
      "#{commandPrefix} exclude list #show current exclude rules",
      "#{commandPrefix} exclude drop #remove all exclude rules"
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
    
    event.cb = (title)->
      cache.put originalUrl, title, 2 * 3600 * 1000
      commandManager.send sender, textRouter, title
      
    @_queryTitle event
    return true
    
  _extractURL: (text)->
    text = text.toString()
    allURLs = text.match @matchRuleMap[@setting.mode]
    if not allURLs
      return null
    return allURLs[0]
  
  _queryTitle: (event)->
    
    @emit 'beforecreate', event
    if event.canceled
      return true
      
    @_getRunner().createPage (page) =>
      page.set 'settings.resourceTimeout', 5000
      page.set 'settings.webSecurityEnabled ', false
      #page.set 'settings.loadImages', false
      page.set 'settings.userAgent', 'Mozilla/5.0 (Windows NT 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36'
      page.set 'customHeaders', {"Accept-Language" : Accept_Language}
      event.page = page
      
      @emit 'beforeopen', event
      if event.canceled
        page.close()
        return true
      
      console.log "phantomJS : opening URL #{event.url}" if @debug
      
      event.timeOpen = Date.now()
      
      page.open event.url, (status) =>
        console.log "phantomJS : opened site? ", status if @debug
        
        if status is 'fail'
          page.close()
          return true
          
        event.pageResult = status
        event.queryCallback = ()-> 
          document.body.bgColor = 'white'
          JSON.stringify {
            title : document.title
            url : location.href
            rwd : !!((document.querySelectorAll 'meta[name=viewport]').length)
          }
        @emit 'beforequery', event
        if event.canceled
          page.close()
          return true
        
        if event.pageResult is 'success'
          page.evaluate event.queryCallback, (result) =>
            event.result = JSON.parse result
            
            @emit 'afterquery', event
            if event.canceled
              page.close()
              return true
            
            if not event.title
              event.title = "[ #{event.result.title} ] - #{if event.result.rwd then 'Mobile supported - ' else ''}#{Date.now() - event.timeOpen }ms - #{event.result.url}"
              
            console.log 'phantomJS : Page title is ' + event.title if @debug
            page.set 'viewportSize', { width: 1366, height: 768 }, (result)->
              console.log "Viewport set to: " + result.width + "x" + result.height
              
              tmp.dir (err, dirPath, cleanupCallback)->
                imagePath = path.resolve dirPath, 'result.jpg'
                #console.log imagePath
                
                page.render imagePath, {format: 'jpeg', quality: '90'}, ()->
                  console.log "file created at #{imagePath}"
                  
                  page.close()
                  
                  
                  #starting upload image
                  imgur.uploadFile imagePath
                  .then (json)->
                    console.log 'file uploaded to ' + json.data.link
                    event.cb event.title + " - " + json.data.link
                    try
                      fs.unlink imagePath, ()->
                        cleanupCallback()
                    catch e
                      console.log e
                  .catch (err)->
                    console.error err.message
                    event.cb event.title
                    try
                      fs.unlink imagePath, ()->
                        cleanupCallback()
                    catch e
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

  _addExclude: (regex)->
    regex = regex.toString()
    if regex in @setting.exclude
      return true
    try
      new RegExp regex
      @setting.exclude.push regex
      @_save()
      return true
    catch e
      return false
      
  _removeExclude: (regex)->
    index = @setting.exclude.indexOf regex
    if index < 0
      return false
    @setting.exclude.splice index, 1
    @_save()
    return true
  
  _matchExclude: (url)->
    for item in @setting.exclude
      if url.match item
        return true
    return false
  
  _getExclude:()->
    return @setting.exclude[0..]

  _dropExclude:()->
    @setting.exclude = []
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
    phantom.create '--ignore-ssl-errors=true', '--web-security=false', '--ssl-protocol=any', {path : phatomDir, onStdout : (()->null), onStderr : ()->null},(ph, error)=>
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