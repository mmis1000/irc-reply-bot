(function() {
  var virtual_class,
    hasProp = {}.hasOwnProperty;

  virtual_class = function(...classes) {
    var Clazz, MixinClass, i, key, len, ref;
    MixinClass = function() {
      var Clazz, i, len;
      for (i = 0, len = classes.length; i < len; i++) {
        Clazz = classes[i];
        try {
          Clazz.apply(this, arguments);
        } catch (error) {}
      }
      return this;
    };
    for (i = 0, len = classes.length; i < len; i++) {
      Clazz = classes[i];
      ref = Clazz.prototype;
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        if (Clazz.prototype[key] !== Clazz) {
          MixinClass.prototype[key] = Clazz.prototype[key];
        }
      }
      for (key in Clazz) {
        if (!hasProp.call(Clazz, key)) continue;
        if (Clazz[key] !== Object.getPrototypeOf(Clazz.prototype)) {
          MixinClass[key] = Clazz[key];
        }
      }
    }
    return MixinClass;
  };

  module.exports = virtual_class;

}).call(this);
