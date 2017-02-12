Q = require 'q'
BaseFile = require './base_file'
request = require 'request'

class TelegramFile extends BaseFile
  constructor: (fileId, @api, options)->
    super 'telegram', fileId, {
      UID: "#{fileId}@telegram"
    }
    options = options or {}
    for key, value of options
      if @hasOwnProperty key
        @[key] = value
  
  getFile: (cb, retryTimes = 1, defered = Q.defer())->
    defered.promise.nodeify cb
    @_getFile (err)=>
      if err and retryTimes > 0
        console.error "Error get file #{@contentSrc}. retry after 5 seconds"
        return setTimeout ()=>
          console.error 'retry start'
          @getFile null, retryTimes - 1, defered
        , 5000
      if err
        console.error "Error get file #{@contentSrc}."
        defered.reject err
      # console.log "File #{@contentSrc} retrieved."
      defered.resolve @
      
    defered.promise
       
  _getFile: (cb, retryTimes = 1)->
    deferred = Q.defer()
    deferred.promise.nodeify cb
    
    @api.getFile @contentSrc, (err, res)=>
      if err or not res
        return deferred.reject err or new Error 'cannot get content'
      
      # console.log res
      @api.getFileContent res.file_path, (err, res, body)=>
        if err or not body
          return deferred.reject err or new Error 'no content found'
        
        @MIME = res.headers["content-type"]
        if @meta.overrides and @meta.overrides.MIME
          @MIME = @meta.overrides.MIME
        @content = body
        @length = body.length
        
        deferred.resolve @
    
    deferred.promise

module.exports = TelegramFile