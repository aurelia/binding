System.register(['core-js', 'aurelia-metadata'], function (_export) {
  var core, ResourceType, _classCallCheck, _createClass, _get, _inherits, ValueConverterResource;

  function camelCase(name) {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }, function (_aureliaMetadata) {
      ResourceType = _aureliaMetadata.ResourceType;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

      _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      ValueConverterResource = (function (_ResourceType) {
        function ValueConverterResource(name) {
          _classCallCheck(this, ValueConverterResource);

          _get(Object.getPrototypeOf(ValueConverterResource.prototype), 'constructor', this).call(this);
          this.name = name;
        }

        _inherits(ValueConverterResource, _ResourceType);

        _createClass(ValueConverterResource, [{
          key: 'analyze',
          value: function analyze(container, target) {
            this.instance = container.get(target);
          }
        }, {
          key: 'register',
          value: function register(registry, name) {
            registry.registerValueConverter(name || this.name, this.instance);
          }
        }, {
          key: 'load',
          value: function load(container, target) {
            return Promise.resolve(this);
          }
        }], [{
          key: 'convention',
          value: function convention(name) {
            if (name.endsWith('ValueConverter')) {
              return new ValueConverterResource(camelCase(name.substring(0, name.length - 14)));
            }
          }
        }]);

        return ValueConverterResource;
      })(ResourceType);

      _export('ValueConverterResource', ValueConverterResource);
    }
  };
});