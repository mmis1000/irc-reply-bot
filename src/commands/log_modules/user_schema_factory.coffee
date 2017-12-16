cache = null

getUserSchema = (mongoose, mediaCollectionName = "Media", collectionName = "Users")->
  UserSchema = mongoose.Schema {
    _id: String
    images: [{ type: String, ref: mediaCollectionName }]
    ids: [{ type: String, index : true }]
    nicknames: [String]
    
    firstName: String
    midName: String
    lastName: String
    
    profileUrl: String
    
    type: String
  }, { collection : collectionName }
  
  UserSchema
  
module.exports = getUserSchema;