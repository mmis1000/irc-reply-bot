(function() {
  var User,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  User = (function() {
    function User(id1, prop) {
      var key, value;
      this.id = id1;
      this.images = [];
      this.aliases = [];
      this.nicknames = [this.id];
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

    User.prototype.is = function(someone) {
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
    };

    User.prototype.isNickname = function(name) {
      return indexOf.call(this.nicknames, name) >= 0;
    };

    return User;

  })();

  module.exports = User;

}).call(this);
