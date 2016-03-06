class IMedia
  constructor: ()->
    this.id = null;
    this.role = null;
    this.placeHolderText = null;
    this.meta = null;
    this.files = []
  
  requestFiles: ()->
    throw new Error 'not implmeneted'
    
module.exports = IMedia