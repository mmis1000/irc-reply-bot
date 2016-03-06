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
        
  getFile: (cb)->
    deferred = Q.defer()
    deferred.promise.nodeify cb
    
    @api.getFile @contentSrc, (err, res)=>
      if err or not res
        return deferred.reject err or new Error 'cannot get content'
      
      console.log res
      @api.getFileContent res.file_path, (err, res, body)=>
        if err or not body
          return deferred.reject err or now Error 'no content found'
        
        @MIME = res.headers["content-type"]
        @content = body
        @length = body.length
        
        deferred.resolve @
    
    deferred.promise

module.exports = TelegramFile