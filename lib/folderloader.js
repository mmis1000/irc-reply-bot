var fs, getPaths, loadFiles, path;

fs = require('fs');

path = require('path');

getPaths = function(rootDir) {
  var file, filePath, files, fullPath, paths, stat;
  files = fs.readdirSync(rootDir);
  paths = [];
  for (file of files) {
    if (file[0] !== '.') {
      filePath = path.resolve(rootDir, file);
      stat = fs.statSync(filePath);
      if (stat.isDirectory() || stat.isFile()) {
        fullPath = path.resolve(rootDir, file);
        //console.log rootDir, file, fullPath
        paths.push(fullPath);
      }
    }
  }
  return paths;
};

loadFiles = function(dir) {
  var _path, filePaths, loadedFiles;
  filePaths = getPaths(dir);
  loadedFiles = [];
//console.log dir, filePaths
  for (_path of filePaths) {
    try {
      loadedFiles.push({
        path: _path,
        module: require(_path)
      });
    } catch (error) {}
  }
  return loadedFiles;
};

module.exports = loadFiles;
