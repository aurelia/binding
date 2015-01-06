System.register(["aurelia-metadata"], function (_export) {
  "use strict";

  var ResourceType, _inherits, capitalMatcher, ValueConverter;


  function addHyphenAndLower(char) {
    return "-" + char.toLowerCase();
  }

  function hyphenate(name) {
    return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
  }

  return {
    setters: [function (_aureliaMetadata) {
      ResourceType = _aureliaMetadata.ResourceType;
    }],
    execute: function () {
      _inherits = function (child, parent) {
        if (typeof parent !== "function" && parent !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof parent);
        }
        child.prototype = Object.create(parent && parent.prototype, {
          constructor: {
            value: child,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        if (parent) child.__proto__ = parent;
      };

      capitalMatcher = /([A-Z])/g;
      ValueConverter = (function () {
        var _ResourceType = ResourceType;
        var ValueConverter = function ValueConverter(name) {
          this.name = name;
        };

        _inherits(ValueConverter, _ResourceType);

        ValueConverter.convention = function (name) {
          if (name.endsWith("ValueConverter")) {
            return new ValueConverter(hyphenate(name.substring(0, name.length - 14)));
          }
        };

        ValueConverter.prototype.load = function (container, target) {
          this.instance = container.get(target);
          return Promise.resolve(this);
        };

        ValueConverter.prototype.register = function (registry, name) {
          registry.registerValueConverter(name || this.name, this.instance);
        };

        return ValueConverter;
      })();
      _export("ValueConverter", ValueConverter);
    }
  };
});