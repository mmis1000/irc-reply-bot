(function() {
  var getMediaSchema;

  getMediaSchema = function(mongoose, fileCollectionName, collectionName) {
    var MediaSchema;
    if (fileCollectionName == null) {
      fileCollectionName = "Files";
    }
    if (collectionName == null) {
      collectionName = 'Medias';
    }
    MediaSchema = mongoose.Schema({
      _id: String,
      files: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: fileCollectionName
        }
      ],
      role: String,
      placeHolderText: String,
      meta: {}
    }, {
      collection: collectionName
    });
    return MediaSchema;
  };

  module.exports = getMediaSchema;

}).call(this);
