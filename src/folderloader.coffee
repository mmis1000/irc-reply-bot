fs = require 'fs'
path = require 'path'
getPaths = (rootDir) ->
  files = fs.readdirSync(rootDir)
  paths = []
  
  for file in files
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
  for path in filePaths
    try
      loadedFiles.push
        path : path
        module : require path
  loadedFiles

module.exports = loadFiles