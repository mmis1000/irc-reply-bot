(function() {
  var IMedia;

  IMedia = (function() {
    function IMedia() {
      this.id = null;
      this.role = null;
      this.placeHolderText = null;
      this.meta = null;
      this.files = [];
    }

    IMedia.prototype.requestFiles = function() {
      throw new Error('not implmeneted');
    };

    return IMedia;

  })();

  module.exports = IMedia;

}).call(this);
