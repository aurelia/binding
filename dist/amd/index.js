define(['exports', 'aurelia-metadata', './value-converter', './event-manager', './observer-locator', './array-change-records', './binding-modes', './parser', './binding-expression', './listener-expression', './name-expression', './call-expression', './dirty-checking', './map-change-records', './computed-observation'], function (exports, _aureliaMetadata, _valueConverter, _eventManager, _observerLocator, _arrayChangeRecords, _bindingModes, _parser, _bindingExpression, _listenerExpression, _nameExpression, _callExpression, _dirtyChecking, _mapChangeRecords, _computedObservation) {
  'use strict';

  var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

  var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  exports.valueConverter = valueConverter;
  exports.computedFrom = computedFrom;
  Object.defineProperty(exports, 'EventManager', {
    enumerable: true,
    get: function get() {
      return _eventManager.EventManager;
    }
  });
  Object.defineProperty(exports, 'ObserverLocator', {
    enumerable: true,
    get: function get() {
      return _observerLocator.ObserverLocator;
    }
  });
  Object.defineProperty(exports, 'ObjectObservationAdapter', {
    enumerable: true,
    get: function get() {
      return _observerLocator.ObjectObservationAdapter;
    }
  });
  Object.defineProperty(exports, 'ValueConverterResource', {
    enumerable: true,
    get: function get() {
      return _valueConverter.ValueConverterResource;
    }
  });
  Object.defineProperty(exports, 'calcSplices', {
    enumerable: true,
    get: function get() {
      return _arrayChangeRecords.calcSplices;
    }
  });

  _defaults(exports, _interopRequireWildcard(_bindingModes));

  Object.defineProperty(exports, 'Parser', {
    enumerable: true,
    get: function get() {
      return _parser.Parser;
    }
  });
  Object.defineProperty(exports, 'BindingExpression', {
    enumerable: true,
    get: function get() {
      return _bindingExpression.BindingExpression;
    }
  });
  Object.defineProperty(exports, 'ListenerExpression', {
    enumerable: true,
    get: function get() {
      return _listenerExpression.ListenerExpression;
    }
  });
  Object.defineProperty(exports, 'NameExpression', {
    enumerable: true,
    get: function get() {
      return _nameExpression.NameExpression;
    }
  });
  Object.defineProperty(exports, 'CallExpression', {
    enumerable: true,
    get: function get() {
      return _callExpression.CallExpression;
    }
  });
  Object.defineProperty(exports, 'DirtyChecker', {
    enumerable: true,
    get: function get() {
      return _dirtyChecking.DirtyChecker;
    }
  });
  Object.defineProperty(exports, 'getChangeRecords', {
    enumerable: true,
    get: function get() {
      return _mapChangeRecords.getChangeRecords;
    }
  });
  Object.defineProperty(exports, 'ComputedPropertyObserver', {
    enumerable: true,
    get: function get() {
      return _computedObservation.ComputedPropertyObserver;
    }
  });
  Object.defineProperty(exports, 'declarePropertyDependencies', {
    enumerable: true,
    get: function get() {
      return _computedObservation.declarePropertyDependencies;
    }
  });

  function valueConverter(name) {
    return function (target) {
      _aureliaMetadata.Metadata.on(target).add(new _valueConverter.ValueConverterResource(name));
      return target;
    };
  }

  _aureliaMetadata.Decorators.configure.parameterizedDecorator('valueConverter', valueConverter);

  function computedFrom() {
    for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
      rest[_key] = arguments[_key];
    }

    return function (target, key, descriptor) {
      if (descriptor.set) {
        throw new Error('The computed property "' + key + '" cannot have a setter function.');
      }
      descriptor.get.dependencies = rest;
      return descriptor;
    };
  }
});