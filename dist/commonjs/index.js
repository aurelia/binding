'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.valueConverter = valueConverter;
exports.computedFrom = computedFrom;

var _Decorators$Metadata = require('aurelia-metadata');

var _ValueConverterResource = require('./value-converter');

var _EventManager = require('./event-manager');

Object.defineProperty(exports, 'EventManager', {
  enumerable: true,
  get: function get() {
    return _EventManager.EventManager;
  }
});

var _ObserverLocator$ObjectObservationAdapter = require('./observer-locator');

Object.defineProperty(exports, 'ObserverLocator', {
  enumerable: true,
  get: function get() {
    return _ObserverLocator$ObjectObservationAdapter.ObserverLocator;
  }
});
Object.defineProperty(exports, 'ObjectObservationAdapter', {
  enumerable: true,
  get: function get() {
    return _ObserverLocator$ObjectObservationAdapter.ObjectObservationAdapter;
  }
});
Object.defineProperty(exports, 'ValueConverterResource', {
  enumerable: true,
  get: function get() {
    return _ValueConverterResource.ValueConverterResource;
  }
});

var _calcSplices = require('./array-change-records');

Object.defineProperty(exports, 'calcSplices', {
  enumerable: true,
  get: function get() {
    return _calcSplices.calcSplices;
  }
});

var _bindingModes = require('./binding-modes');

_defaults(exports, _interopRequireWildcard(_bindingModes));

var _Parser = require('./parser');

Object.defineProperty(exports, 'Parser', {
  enumerable: true,
  get: function get() {
    return _Parser.Parser;
  }
});

var _BindingExpression = require('./binding-expression');

Object.defineProperty(exports, 'BindingExpression', {
  enumerable: true,
  get: function get() {
    return _BindingExpression.BindingExpression;
  }
});

var _ListenerExpression = require('./listener-expression');

Object.defineProperty(exports, 'ListenerExpression', {
  enumerable: true,
  get: function get() {
    return _ListenerExpression.ListenerExpression;
  }
});

var _NameExpression = require('./name-expression');

Object.defineProperty(exports, 'NameExpression', {
  enumerable: true,
  get: function get() {
    return _NameExpression.NameExpression;
  }
});

var _CallExpression = require('./call-expression');

Object.defineProperty(exports, 'CallExpression', {
  enumerable: true,
  get: function get() {
    return _CallExpression.CallExpression;
  }
});

var _DirtyChecker = require('./dirty-checking');

Object.defineProperty(exports, 'DirtyChecker', {
  enumerable: true,
  get: function get() {
    return _DirtyChecker.DirtyChecker;
  }
});

var _getChangeRecords = require('./map-change-records');

Object.defineProperty(exports, 'getChangeRecords', {
  enumerable: true,
  get: function get() {
    return _getChangeRecords.getChangeRecords;
  }
});

var _ComputedPropertyObserver$declarePropertyDependencies = require('./computed-observation');

Object.defineProperty(exports, 'ComputedPropertyObserver', {
  enumerable: true,
  get: function get() {
    return _ComputedPropertyObserver$declarePropertyDependencies.ComputedPropertyObserver;
  }
});
Object.defineProperty(exports, 'declarePropertyDependencies', {
  enumerable: true,
  get: function get() {
    return _ComputedPropertyObserver$declarePropertyDependencies.declarePropertyDependencies;
  }
});

function valueConverter(name) {
  return function (target) {
    _Decorators$Metadata.Metadata.on(target).add(new _ValueConverterResource.ValueConverterResource(name));
    return target;
  };
}

_Decorators$Metadata.Decorators.configure.parameterizedDecorator('valueConverter', valueConverter);

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