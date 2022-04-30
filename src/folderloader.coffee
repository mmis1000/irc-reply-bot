fs = require 'fs'
path = require 'path'
getPaths = (rootDir) ->
  files = fs.readdirSync(rootDir)
  paths = []
  
  for file from files
    if file[0] != '.'
      filePath = path.resolve rootDir, file
      stat = fs.statSync(filePath)

      if stat.isDirectory() || stat.isFile()
        fullPath = path.resolve rootDir, file
        #console.log rootDir, file, fullPath
        paths.push fullPath

  return paths

loadFiles = (dir)->
  filePaths = getPaths dir
  loadedFiles = []
  #console.log dir, filePaths
  for _path from filePaths
    try
      loadedFiles.push
        path : _path
        module : require _path
  loadedFiles

module.exports = loadFiles