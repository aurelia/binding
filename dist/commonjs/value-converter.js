"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var ResourceType = require("aurelia-metadata").ResourceType;

if (typeof String.prototype.endsWith !== "function") {
  String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

function camelCase(name) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

var ValueConverter = exports.ValueConverter = (function (ResourceType) {
  function ValueConverter(name) {
    _classCallCheck(this, ValueConverter);

    this.name = name;
  }

  _inherits(ValueConverter, ResourceType);

  _prototypeProperties(ValueConverter, {
    convention: {
      value: function convention(name) {
        if (name.endsWith("ValueConverter")) {
          return new ValueConverter(camelCase(name.substring(0, name.length - 14)));
        }
      },
      writable: true,
      configurable: true
    }
  }, {
    load: {
      value: function load(container, target) {
        this.instance = container.get(target);
        return Promise.resolve(this);
      },
      writable: true,
      configurable: true
    },
    register: {
      value: function register(registry, name) {
        registry.registerValueConverter(name || this.name, this.instance);
      },
      writable: true,
      configurable: true
    }
  });

  return ValueConverter;
})(ResourceType);

Object.defineProperty(exports, "__esModule", {
  value: true
});