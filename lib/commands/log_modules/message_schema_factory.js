(function() {
  var cache, getMessageSchema, moment;

  cache = null;

  moment = require('moment');

  getMessageSchema = function(mongoose, timezone, locale, mediaCollectionName, collectionName) {
    var MessageSchema;
    if (mediaCollectionName == null) {
      mediaCollectionName = "Media";
    }
    if (collectionName == null) {
      collectionName = "Messages";
    }
    MessageSchema = mongoose.Schema({
      from: {
        type: String,
        index: true
      },
      to: {
        type: String,
        index: true
      },
      message: String,
      messageFormat: String,
      messageFormated: String,
      messageId: {
        type: String,
        index: true
      },
      asText: {
        type: Boolean,
        index: true
      },
      isOnChannel: Boolean,
      medias: [
        {
          type: String,
          ref: mediaCollectionName
        }
      ],
      time: {
        type: Date,
        index: true
      },
      meta: {}
    }, {
      collection: collectionName
    });
    MessageSchema.index({
      from: 1,
      time: 1
    });
    MessageSchema.index({
      to: 1,
      time: -1
    });
    MessageSchema.methods.toString = function() {
      var timeStamp;
      timeStamp = moment(this.time).utcOffset(timezone).locale(locale).format('YYYY-MM-DD hh:mm:ss a');
      return timeStamp + " " + this.from + " => " + this.to + ": " + this.message;
    };
    return MessageSchema;
  };

  module.exports = getMessageSchema;

}).call(this);
