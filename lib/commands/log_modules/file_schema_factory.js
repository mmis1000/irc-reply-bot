(function() {
  var getFileSchema;

  getFileSchema = function(mongoose, collectionName) {
    var FileSchema;
    if (collectionName == null) {
      collectionName = "Files";
    }
    FileSchema = mongoose.Schema({
      _id: String,
      MIME: String,
      length: Number,
      photoSize: [Number],
      duration: Number,
      meta: {},
      isThumb: Boolean,
      contentSource: String,
      contentSrc: {}
    }, {
      collection: collectionName
    });
    return FileSchema;
  };

  module.exports = getFileSchema;

}).call(this);
