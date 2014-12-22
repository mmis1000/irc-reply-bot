(function() {
  var virtual_class,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  virtual_class = function() {
    var classes;
    classes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return classes.reduceRight(function(Parent, Child) {
      var Child_Projection, key, _ref;
      Child_Projection = (function(_super) {
        __extends(Child_Projection, _super);

        function Child_Projection() {
          var child_super;
          child_super = Child.__super__;
          Child.__super__ = Child_Projection.__super__;
          Child.apply(this, arguments);
          Child.__super__ = child_super;
          if (child_super == null) {
            Child_Projection.__super__.constructor.apply(this, arguments);
          }
        }

        return Child_Projection;

      })(Parent);
      _ref = Child.prototype;
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        if (Child.prototype[key] !== Child) {
          Child_Projection.prototype[key] = Child.prototype[key];
        }
      }
      for (key in Child) {
        if (!__hasProp.call(Child, key)) continue;
        if (Child[key] !== Object.getPrototypeOf(Child.prototype)) {
          Child_Projection[key] = Child[key];
        }
      }
      return Child_Projection;
    });
  };

  module.exports = virtual_class;

}).call(this);
