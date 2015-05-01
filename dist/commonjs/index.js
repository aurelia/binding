'use strict';

var _interopRequireWildcard = function (obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (typeof obj === 'object' && obj !== null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } };

var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

exports.__esModule = true;
exports.valueConverter = valueConverter;
exports.computedFrom = computedFrom;

var _Decorators$Metadata = require('aurelia-metadata');

var _ValueConverterResource = require('./value-converter');

var _EventManager = require('./event-manager');

exports.EventManager = _EventManager.EventManager;

var _ObserverLocator$ObjectObservationAdapter = require('./observer-locator');

exports.ObserverLocator = _ObserverLocator$ObjectObservationAdapter.ObserverLocator;
exports.ObjectObservationAdapter = _ObserverLocator$ObjectObservationAdapter.ObjectObservationAdapter;
exports.ValueConverterResource = _ValueConverterResource.ValueConverterResource;

var _calcSplices = require('./array-change-records');

exports.calcSplices = _calcSplices.calcSplices;

var _bindingModes = require('./binding-modes');

_defaults(exports, _interopRequireWildcard(_bindingModes));

var _Parser = require('./parser');

exports.Parser = _Parser.Parser;

var _BindingExpression = require('./binding-expression');

exports.BindingExpression = _BindingExpression.BindingExpression;

var _ListenerExpression = require('./listener-expression');

exports.ListenerExpression = _ListenerExpression.ListenerExpression;

var _NameExpression = require('./name-expression');

exports.NameExpression = _NameExpression.NameExpression;

var _CallExpression = require('./call-expression');

exports.CallExpression = _CallExpression.CallExpression;

var _DirtyChecker = require('./dirty-checking');

exports.DirtyChecker = _DirtyChecker.DirtyChecker;

var _getChangeRecords = require('./map-change-records');

exports.getChangeRecords = _getChangeRecords.getChangeRecords;

var _ComputedPropertyObserver$declarePropertyDependencies = require('./computed-observation');

exports.ComputedPropertyObserver = _ComputedPropertyObserver$declarePropertyDependencies.ComputedPropertyObserver;
exports.declarePropertyDependencies = _ComputedPropertyObserver$declarePropertyDependencies.declarePropertyDependencies;

function valueConverter(nameOrTarget) {
  if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
    return function (target) {
      Reflect.defineMetadata(_Decorators$Metadata.Metadata.resource, new _ValueConverterResource.ValueConverterResource(nameOrTarget), target);
    };
  }

  Reflect.defineMetadata(_Decorators$Metadata.Metadata.resource, new _ValueConverterResource.ValueConverterResource(), nameOrTarget);
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