(function() {
  var cache, getUserSchema;

  cache = null;

  getUserSchema = function(mongoose, mediaCollectionName, collectionName) {
    var UserSchema;
    if (mediaCollectionName == null) {
      mediaCollectionName = "Media";
    }
    if (collectionName == null) {
      collectionName = "Users";
    }
    UserSchema = mongoose.Schema({
      _id: String,
      images: [
        {
          type: String,
          ref: mediaCollectionName
        }
      ],
      ids: [
        {
          type: String,
          index: true
        }
      ],
      nicknames: [String],
      firstName: String,
      midName: String,
      lastName: String,
      profileUrl: String,
      type: String
    }, {
      collection: collectionName
    });
    return UserSchema;
  };

  module.exports = getUserSchema;

}).call(this);
