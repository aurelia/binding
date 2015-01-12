System.register(["aurelia-metadata"], function (_export) {
  "use strict";

  var ResourceType, _prototypeProperties, _inherits, capitalMatcher, ValueConverter;


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
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

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
      ValueConverter = (function (ResourceType) {
        var ValueConverter = function ValueConverter(name) {
          this.name = name;
        };

        _inherits(ValueConverter, ResourceType);

        _prototypeProperties(ValueConverter, {
          convention: {
            value: function (name) {
              if (name.endsWith("ValueConverter")) {
                return new ValueConverter(hyphenate(name.substring(0, name.length - 14)));
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        }, {
          load: {
            value: function (container, target) {
              this.instance = container.get(target);
              return Promise.resolve(this);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          register: {
            value: function (registry, name) {
              registry.registerValueConverter(name || this.name, this.instance);
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return ValueConverter;
      })(ResourceType);
      _export("ValueConverter", ValueConverter);
    }
  };
});