(function() {
  var cache, getMessageSchema, moment;

  cache = null;

  moment = require('moment');

  getMessageSchema = function(mongoose, timezone, locale, mediaCollectionName, collectionName) {
    var MessageSchema;
    if (mediaCollectionName == null) {
      mediaCollectionName = "Medias";
    }
    if (collectionName == null) {
      collectionName = "Messages";
    }
    MessageSchema = mongoose.Schema({
      from: String,
      to: String,
      message: String,
      isOnChannel: Boolean,
      files: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: mediaCollectionName
        }
      ],
      time: {
        type: Date,
        index: true
      }
    }, {
      collection: collectionName
    });
    MessageSchema.methods.toString = function() {
      var timeStamp;
      timeStamp = moment(this.time).utcOffset(timezone).locale(locale).format('YYYY-MM-DD hh:mm:ss a');
      return "" + timeStamp + " " + this.from + " => " + this.to + ": " + this.message;
    };
    return MessageSchema;
  };

  module.exports = getMessageSchema;

}).call(this);
