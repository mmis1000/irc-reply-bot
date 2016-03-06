Q = require 'q'

class IFile
  constructor: ()->
    # these property may work only after getFile got called
    @MIME = null;
    @length = null;
    @photoSize = null;
    @meta = {};
    
    # these properety should be work at any time
    @isThumb = null;
    @contentSource = null;
    @contentSrc = null;
    @UID = null;
  
  getFile: (cb)->
    deferred = Q.defer()
    deferred.promise.nodeify cb
    deferred.reject Error 'not implemented'
    deferred.promise
    
module.exports = IFile