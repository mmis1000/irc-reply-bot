(function() {
  var DbStorage, EventEmitter, MongoClient, noop,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  EventEmitter = require('events').EventEmitter;

  MongoClient = (require('mongodb')).MongoClient;

  noop = function() {};

  DbStorage = (function(_super) {
    __extends(DbStorage, _super);

    function DbStorage(path, collectionName, mainIndex, autoIncrementFields, indexedFields) {
      var i, temp, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      this.collectionName = collectionName;
      this.mainIndex = mainIndex;
      this.autoIncrementFields = autoIncrementFields != null ? autoIncrementFields : [];
      this.indexedFields = indexedFields != null ? indexedFields : [];
      temp = {};
      _ref = this.autoIncrementFields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        temp[i] = 1;
      }
      _ref1 = this.indexedFields;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        i = _ref1[_j];
        temp[i] = 1;
      }
      temp[this.mainIndex] = 1;
      this.defultCounter = {};
      _ref2 = this.autoIncrementFields;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        i = _ref2[_k];
        this.defultCounter[i] = -1;
      }
      this.defultCounter._id = this.collectionName;
      this._currentsCounts = {};
      this._connectiong = true;
      MongoClient.connect(path, (function(_this) {
        return function(err, db) {
          _this.db = db;
          if (err != null) {
            _this.emit('error', err);
            return null;
          }
          console.log("Connected correctly to " + path);
          _this.db.on('close', function() {
            return _this.emit('close');
          });
          _this.counters = db.collection('counters');
          _this.datas = db.collection(_this.collectionName);
          return _this.counters.insert(_this.defultCounter, function(err, res) {
            return _this.counters.findOne({
              _id: _this.collectionName
            }, function(err, document) {
              var key, value;
              if (err != null) {
                _this.emit('error', err);
                return null;
              }
              for (key in document) {
                value = document[key];
                if (0 !== key.search('_')) {
                  _this._currentsCounts[key] = value;
                }
              }
              console.log("current indexs %j", document);
              return _this.datas.ensureIndex(temp, {
                unique: true,
                background: true,
                dropDups: true
              }, function(err, res) {
                if (err != null) {
                  _this.emit('error', err);
                  return null;
                }
                _this._connectiong = false;
                console.log("Prepare finished");
                return _this.emit('connect');
              });
            });
          });
        };
      })(this));
    }

    DbStorage.prototype.add = function(obj, cb) {
      var i, temp, temp2, _i, _j, _len, _len1, _ref, _ref1;
      if (cb == null) {
        cb = noop;
      }
      if (this._connectiong) {
        this.on('connect', (_ref = this.add).bind.apply(_ref, [this].concat(__slice.call(arguments))));
        return null;
      }
      temp = [];
      _ref1 = this.autoIncrementFields;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        i = _ref1[_i];
        if (obj[i] != null) {
          temp.push(i);
        }
        delete obj[i];
      }
      temp2 = {};
      for (_j = 0, _len1 = temp.length; _j < _len1; _j++) {
        i = temp[_j];
        temp2[i] = 1;
      }
      return this.counters.findAndModify({
        _id: this.collectionName
      }, [], {
        $inc: temp2
      }, {
        'new': true
      }, (function(_this) {
        return function(err, res) {
          var _k, _len2;
          if (err != null) {
            cb(err);
            return null;
          }
          for (_k = 0, _len2 = temp.length; _k < _len2; _k++) {
            i = temp[_k];
            obj[i] = res[i];
          }
          _this._currentsCounts = res;
          return _this.datas.insert(obj, function(err, res) {
            return cb(err, res);
          });
        };
      })(this));
    };


    /*
      return
        pageAll number
        page    number
        datas   document[]
     */

    DbStorage.prototype.getPage = function(field, limit, page, fromEnd, cb) {
      var all, length, offset, query, _ref, _ref1;
      if ('function' === typeof fromEnd) {
        cb = fromEnd;
        fromEnd = false;
      }
      if (this._connectiong) {
        this.on('connect', (_ref = this.getPage).bind.apply(_ref, [this].concat(__slice.call(arguments))));
        return null;
      }
      if (_ref1 = !field, __indexOf.call(this.autoIncrementFields, _ref1) >= 0) {
        cb(new Error("unindexed field " + field));
      }
      length = this._currentsCounts[field] + 1;
      if (!fromEnd) {
        offset = limit * page;
      } else {
        offset = length - limit * (page + 1);
      }
      query = {};
      query[field] = {
        $gte: offset,
        $lt: offset + limit
      };
      all = Math.ceil(length / limit);
      return this.datas.find(query, function(err, cursor) {
        if (err != null) {
          cb(err);
          return null;
        }
        return cursor.toArray(function(err, res) {
          if (err) {
            return cb(err);
          } else {
            return cb(null, {
              data: res,
              page: page,
              all: all
            });
          }
        });
      });
    };

    DbStorage.prototype.getPageCounts = function(pageSize, cb) {
      var counts, i, _i, _len, _ref, _ref1;
      if (this._connectiong) {
        this.on('connect', (_ref = this.getPageCounts).bind.apply(_ref, [this].concat(__slice.call(arguments))));
        return null;
      }
      counts = {};
      _ref1 = this.autoIncrementFields;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        i = _ref1[_i];
        counts[i] = Math.ceil((this._currentsCounts[i] + 1) / pageSize);
      }
      return cb(null, counts);
    };

    DbStorage.prototype.getRecordCounts = function(cb) {
      var counts, i, _i, _len, _ref, _ref1;
      if (this._connectiong) {
        this.on('connect', (_ref = this.getRecordCounts).bind.apply(_ref, [this].concat(__slice.call(arguments))));
        return null;
      }
      counts = {};
      _ref1 = this.autoIncrementFields;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        i = _ref1[_i];
        counts[i] = this._currentsCounts[i] + 1;
      }
      return cb(null, counts);
    };

    DbStorage.prototype.get = function(query, cb) {
      var cd, _ref;
      if (query == null) {
        query = {};
      }
      if (this._connectiong) {
        this.on('connect', (_ref = this.get).bind.apply(_ref, [this].concat(__slice.call(arguments))));
        return null;
      }
      if ('function' === typeof query) {
        cd = query;
        query = {};
      }
      return this.datas.find(query, function(err, cursor) {
        if (err != null) {
          cb(err);
          return null;
        }
        return cursor.toArray(function(err, res) {
          if (err) {
            return cb(err);
          } else {
            return cb(null, {
              data: res,
              page: page,
              all: all
            });
          }
        });
      });
    };

    DbStorage.prototype.dropAll = function(cb) {
      var _ref;
      if (cb == null) {
        cb = noop;
      }
      if (this._connectiong) {
        this.on('connect', (_ref = this.dropAll).bind.apply(_ref, [this].concat(__slice.call(arguments))));
        return null;
      }
      return this.datas.drop((function(_this) {
        return function(err, reply) {
          if (err != null) {
            cb(err);
            return null;
          }
          return _this.counters.update({
            _id: _this.collectionName
          }, _this.defultCounter, {
            upsert: true,
            w: 1
          }, function(err, res) {
            return cb(err, res);
          });
        };
      })(this));
    };

    DbStorage.prototype.remove = function(_ids, cb) {
      var _ref;
      if (cb == null) {
        cb = noop;
      }
      if (!Array.isArray(_ids)) {
        _ids = [_ids];
      }
      if (this._connectiong) {
        this.on('connect', (_ref = this.remove).bind.apply(_ref, [this].concat(__slice.call(arguments))));
        return null;
      }
      return this.datas.findAndRemove({
        _id: {
          $in: _ids
        }
      }, function(err, res) {
        return cb(err, re);
      });
    };

    DbStorage.prototype.close = function(cb) {
      if (cb == null) {
        cb = noop;
      }
      return this.db.close(cb);
    };

    return DbStorage;

  })(EventEmitter);

  module.exports = DbStorage;

}).call(this);
