const Storage = require('./lib/storage.js');
const fs      = require('fs');
const Path    = require('path');
module.exports = function (saveFolder) {
  return {
    safeLoad : function (func, label) {
      if (!label) {
        label = func.toSource().replace(/[\r\n]/g, " \\n ")
      }
      try {
        func();
      } catch (e) {
        console.error("fail to load " + label + " due to " + e.toString()); 
      }
    },
    createStorage : function (path) {
      try {
        var stat = fs.statSync(Path.resolve(__dirname, saveFolder))
        if (!stat.isDirectory()) {
          var error = new Error('not a directory')
          error.type = "not_a_directory"
          throw error;
        }
      } catch (e) {
        if (e.type == "not_a_directory") {
          throw new Error("fail to create folder, target is not a folder");
        } else {
          fs.mkdirSync(Path.resolve(__dirname, saveFolder));
        }
      }
      var storage = new Storage(Path.resolve(__dirname, saveFolder, path));
      return storage;
    }
  };
}