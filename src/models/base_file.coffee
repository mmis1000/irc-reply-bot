Q = require 'q'
request = require 'request'
IFile = require './i_file'

class BaseFile extends IFile
  constructor: (contentSource, content, options)->
    super
    
    options = {} if not 'object' is typeof options
    
    @contentSource = contentSource
    @contentSrc = content
    
    for key, value of options
      if @hasOwnProperty key
        @[key] = value
  
  getFile: (cb)->
    if not @contentSource in ['url', 'inline']
      return super cb
      
    deferred = Q.defer()
    deferred.promise.nodeify cb
    
    if @contentSource is 'inline'
      @content = @contentSrc
      deferred.resolve @
    
    if @contentSource is 'url'
      request @contentSrc, (err, req, body)=>
        if err or not body
          deferred.reject err || new Error 'content not found'
        
        @MIME = res["content-type"]
        @content = body
        deferred.resolve body
        
      
    deferred.promise

module.exports = BaseFile