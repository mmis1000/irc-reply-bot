(function() {
  var fs, getPaths, loadFiles, path;

  fs = require('fs');

  path = require('path');

  getPaths = function(rootDir) {
    var file, filePath, files, fullPath, i, len, paths, stat;
    files = fs.readdirSync(rootDir);
    paths = [];
    for (i = 0, len = files.length; i < len; i++) {
      file = files[i];
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
    var _path, filePaths, i, len, loadedFiles;
    filePaths = getPaths(dir);
    loadedFiles = [];
    for (i = 0, len = filePaths.length; i < len; i++) {
      _path = filePaths[i];
      try {
        loadedFiles.push({
          path: _path,
          module: require(_path)
        });
      } catch (undefined) {}
    }
    return loadedFiles;
  };

  module.exports = loadFiles;

}).call(this);
