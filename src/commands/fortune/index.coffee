list = require "./fortune.json"
fortune = require "./fortune.js"
class wrap
  constructor : ()->
    return new fortune list

module.exports = wrap