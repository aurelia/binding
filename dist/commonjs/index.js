'use strict';

exports.__esModule = true;
exports.valueConverter = valueConverter;
exports.computedFrom = computedFrom;

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _aureliaMetadata = require('aurelia-metadata');

var _valueConverter = require('./value-converter');

var _classList = require('./class-list');

var classList = _interopRequireWildcard(_classList);

var _eventManager = require('./event-manager');

exports.EventManager = _eventManager.EventManager;

var _observerLocator = require('./observer-locator');

exports.ObserverLocator = _observerLocator.ObserverLocator;
exports.ObjectObservationAdapter = _observerLocator.ObjectObservationAdapter;
exports.ValueConverterResource = _valueConverter.ValueConverterResource;

var _arrayChangeRecords = require('./array-change-records');

exports.calcSplices = _arrayChangeRecords.calcSplices;

var _bindingModes = require('./binding-modes');

_defaults(exports, _interopRequireWildcard(_bindingModes));

var _parser = require('./parser');

exports.Parser = _parser.Parser;

var _bindingExpression = require('./binding-expression');

exports.BindingExpression = _bindingExpression.BindingExpression;

var _listenerExpression = require('./listener-expression');

exports.ListenerExpression = _listenerExpression.ListenerExpression;

var _nameExpression = require('./name-expression');

exports.NameExpression = _nameExpression.NameExpression;

var _callExpression = require('./call-expression');

exports.CallExpression = _callExpression.CallExpression;

var _dirtyChecking = require('./dirty-checking');

exports.DirtyChecker = _dirtyChecking.DirtyChecker;

var _mapChangeRecords = require('./map-change-records');

exports.getChangeRecords = _mapChangeRecords.getChangeRecords;

var _computedObservation = require('./computed-observation');

exports.ComputedPropertyObserver = _computedObservation.ComputedPropertyObserver;
exports.declarePropertyDependencies = _computedObservation.declarePropertyDependencies;

function valueConverter(nameOrTarget) {
  if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
    return function (target) {
      Reflect.defineMetadata(_aureliaMetadata.Metadata.resource, new _valueConverter.ValueConverterResource(nameOrTarget), target);
    };
  }

  Reflect.defineMetadata(_aureliaMetadata.Metadata.resource, new _valueConverter.ValueConverterResource(), nameOrTarget);
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