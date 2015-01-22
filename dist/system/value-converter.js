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

      _inherits = function (subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, {
          constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        if (superClass) subClass.__proto__ = superClass;
      };

      capitalMatcher = /([A-Z])/g;
      ValueConverter = (function (ResourceType) {
        function ValueConverter(name) {
          this.name = name;
        }

        _inherits(ValueConverter, ResourceType);

        _prototypeProperties(ValueConverter, {
          convention: {
            value: function convention(name) {
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
            value: function load(container, target) {
              this.instance = container.get(target);
              return Promise.resolve(this);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          register: {
            value: function register(registry, name) {
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