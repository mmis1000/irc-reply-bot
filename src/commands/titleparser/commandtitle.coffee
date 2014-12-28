virtual_class = require '../../virtualclass.js'
Icommand = require '../../icommand.js'
{EventEmitter} = require('events')
phantom = require 'phantom'
loadFileIn = require '../../folderloader.js'
path = require 'path'
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
    @ph = null
    phantom.create '--ignore-ssl-errors=yes', '--web-security=false', '--ssl-protocol=any', {onStdout : ()->null},(ph)=>
      @ph = ph
      console.log 'phantom instance created'
    
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
      "#{commandPrefix} drop #remove all exclude rules"
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
    
    event.cb = (title)->
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
      
    @ph.createPage (page) =>
      page.set 'settings.resourceTimeout', 5000
      page.set 'settings.webSecurityEnabled ', false
      page.set 'settings.loadImages', false
      page.set 'settings.userAgent', 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1478.0 Safari/537.36'
      event.page = page
      
      @emit 'beforeopen', event
      if event.canceled
        return true
      
      console.log "phantomJS : opening URL #{event.url}" if @debug
      
      page.open event.url, (status) =>
        console.log "phantomJS : opened site? ", status if @debug
        
        event.pageResult = status
        event.queryCallback = ()-> 
          JSON.stringify {
            title : document.title
            url : location.href
          }
        @emit 'beforequery', event
        if event.canceled
          return true
        
        if event.pageResult is 'success'
          page.evaluate event.queryCallback, (result) =>
            event.result = JSON.parse result
            
            @emit 'afterquery', event
            if event.canceled
              return true
            
            if not event.title
              event.title = "[ #{event.result.title} ] - #{event.result.url}"
              
            console.log 'phantomJS : Page title is ' + event.title if @debug
            event.cb event.title
  
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
        
module.exports = CommandTitle