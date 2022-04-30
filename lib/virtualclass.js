var virtual_class,
  hasProp = {}.hasOwnProperty;

virtual_class = function(...classes) {
  var Clazz, MixinClass, key, ref;
  MixinClass = function() {
    var Clazz;
    for (Clazz of classes) {
      try {
        Clazz.apply(this, arguments);
      } catch (error) {}
    }
    return this;
  };
  for (Clazz of classes) {
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
