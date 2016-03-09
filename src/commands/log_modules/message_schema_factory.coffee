cache = null
moment = require 'moment'

getMessageSchema = (mongoose, timezone, locale, mediaCollectionName = "Media", collectionName = "Messages")->
  MessageSchema = mongoose.Schema {
    from : String
    to : String
    message : String
    isOnChannel : Boolean
    medias: [{ type: String, ref: mediaCollectionName }]
    time : { type : Date, index : true }
  }, { collection : collectionName }
  
  MessageSchema.methods.toString = ()->
    timeStamp = moment @time
    .utcOffset timezone
    .locale locale
    .format 'YYYY-MM-DD hh:mm:ss a'
    
    "#{timeStamp} #{@from} => #{@to}: #{@message}"
  
  MessageSchema
  
module.exports = getMessageSchema;