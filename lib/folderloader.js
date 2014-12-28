(function() {
  var fs, getPaths, loadFiles, path;

  fs = require('fs');

  path = require('path');

  getPaths = function(rootDir) {
    var file, filePath, files, fullPath, paths, stat, _i, _len;
    files = fs.readdirSync(rootDir);
    paths = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      if (file[0] !== '.') {
        filePath = path.resolve(rootDir, file);
        stat = fs.statSync(filePath);
        if (stat.isDirectory() || stat.isFile()) {
          fullPath = path.resolve(rootDir, file);
          paths.push(fullPath);
        }
      }
    }
    return paths;
  };

  loadFiles = function(dir) {
    var filePaths, loadedFiles, _i, _len;
    filePaths = getPaths(dir);
    loadedFiles = [];
    for (_i = 0, _len = filePaths.length; _i < _len; _i++) {
      path = filePaths[_i];
      try {
        loadedFiles.push({
          path: path,
          module: require(path)
        });
      } catch (_error) {}
    }
    return loadedFiles;
  };

  module.exports = loadFiles;

}).call(this);
