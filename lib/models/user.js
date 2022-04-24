(function() {
  var User,
    indexOf = [].indexOf;

  User = class User {
    constructor(id1, prop) {
      var key, value;
      this.id = id1;
      this.images = []; // instance of Media
      this.aliases = []; // global alias
      this.nicknames = [this.id]; // router only alias
      this.firstName = null;
      this.midName = null;
      this.lastName = null;
      this.profileUrl = null;
      this.type = 'user';
      for (key in prop) {
        value = prop[key];
        this[key] = value;
      }
    }

    is(someone) {
      var i, id, ids, len;
      if (this === someone) {
        return true;
      }
      ids = [];
      if ('string' === typeof someone) {
        ids.push(someone);
      }
      if (someone instanceof User) {
        ids.push(someone.id);
        ids = ids.concat(someone.aliases);
      }
      for (i = 0, len = ids.length; i < len; i++) {
        id = ids[i];
        if (this.id === id) {
          return true;
        }
        if (indexOf.call(this.alias, id) >= 0) {
          return true;
        }
      }
      return false;
    }

    isNickname(name) {
      return indexOf.call(this.nicknames, name) >= 0;
    }

  };

  module.exports = User;

}).call(this);
