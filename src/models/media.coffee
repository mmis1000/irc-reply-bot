IMedia = require './i_media'
Q = require 'q'

class Media extends IMedia
  constructor: (options)->
    super
    
    options = {} if not 'object' is typeof options
    
    for key, value of options
      if options.hasOwnProperty key
        @[key] = value
    
    if not @id
      throw new Error 'media must have a identifier'
  
  getAllFiles: (cb)->
    promise = Q.all @files.map (file)-> file.getFile()
    promise.nodeify cb
    promise

module.exports = Media