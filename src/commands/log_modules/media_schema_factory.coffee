getMediaSchema = (mongoose, fileCollectionName = "Files", collectionName = 'Medias')->
  MediaSchema = mongoose.Schema {
    _id: String
    
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: fileCollectionName }]
    role: String
    placeHolderText: String
    meta: {}
  }, { collection : collectionName }
  
  MediaSchema

module.exports = getMediaSchema