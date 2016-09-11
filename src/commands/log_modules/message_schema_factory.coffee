cache = null
moment = require 'moment'

getMessageSchema = (mongoose, timezone, locale, mediaCollectionName = "Media", collectionName = "Messages")->
  MessageSchema = mongoose.Schema {
    from : String
    to : String
    message : String
    
    # v2 message format
    messageFormat: String
    messageFormated: String
    
    # optional, for conflict check
    messageId : { type : String, index : true }
    
    # if the text is meaningful and should be display along with medias
    asText : { type : Boolean, index : true }
    
    isOnChannel : Boolean
    medias: [{ type: String, ref: mediaCollectionName }]
    time : { type : Date, index : true }
    meta: {}
  }, { collection : collectionName }
  
  MessageSchema.methods.toString = ()->
    timeStamp = moment @time
    .utcOffset timezone
    .locale locale
    .format 'YYYY-MM-DD hh:mm:ss a'
    
    "#{timeStamp} #{@from} => #{@to}: #{@message}"
  
  MessageSchema
  
module.exports = getMessageSchema;