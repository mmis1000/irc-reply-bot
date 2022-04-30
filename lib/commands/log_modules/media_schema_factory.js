var getMediaSchema;

getMediaSchema = function(mongoose, fileCollectionName = "File", collectionName = 'Medias') {
  var MediaSchema;
  MediaSchema = mongoose.Schema({
    _id: String,
    time: {
      type: Date,
      index: true
    },
    files: [
      {
        type: String,
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
