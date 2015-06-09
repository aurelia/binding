System.register(['core-js'], function (_export) {
  'use strict';

  var core, ValueConverterResource;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function camelCase(name) {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }],
    execute: function () {
      ValueConverterResource = (function () {
        function ValueConverterResource(name) {
          _classCallCheck(this, ValueConverterResource);

          this.name = name;
        }

        ValueConverterResource.convention = function convention(name) {
          if (name.endsWith('ValueConverter')) {
            return new ValueConverterResource(camelCase(name.substring(0, name.length - 14)));
          }
        };

        ValueConverterResource.prototype.analyze = function analyze(container, target) {
          this.instance = container.get(target);
        };

        ValueConverterResource.prototype.register = function register(registry, name) {
          registry.registerValueConverter(name || this.name, this.instance);
        };

        ValueConverterResource.prototype.load = function load(container, target) {
          return Promise.resolve(this);
        };

        return ValueConverterResource;
      })();

      _export('ValueConverterResource', ValueConverterResource);
    }
  };
});