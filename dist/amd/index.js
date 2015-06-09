define(['exports', 'aurelia-metadata', './value-converter', './class-list', './event-manager', './observer-locator', './array-change-records', './binding-modes', './parser', './binding-expression', './listener-expression', './name-expression', './call-expression', './dirty-checking', './map-change-records', './computed-observation'], function (exports, _aureliaMetadata, _valueConverter, _classList, _eventManager, _observerLocator, _arrayChangeRecords, _bindingModes, _parser, _bindingExpression, _listenerExpression, _nameExpression, _callExpression, _dirtyChecking, _mapChangeRecords, _computedObservation) {
  'use strict';

  exports.__esModule = true;
  exports.valueConverter = valueConverter;
  exports.computedFrom = computedFrom;

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

  function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

  exports.EventManager = _eventManager.EventManager;
  exports.ObserverLocator = _observerLocator.ObserverLocator;
  exports.ObjectObservationAdapter = _observerLocator.ObjectObservationAdapter;
  exports.ValueConverterResource = _valueConverter.ValueConverterResource;
  exports.calcSplices = _arrayChangeRecords.calcSplices;

  _defaults(exports, _interopRequireWildcard(_bindingModes));

  exports.Parser = _parser.Parser;
  exports.BindingExpression = _bindingExpression.BindingExpression;
  exports.ListenerExpression = _listenerExpression.ListenerExpression;
  exports.NameExpression = _nameExpression.NameExpression;
  exports.CallExpression = _callExpression.CallExpression;
  exports.DirtyChecker = _dirtyChecking.DirtyChecker;
  exports.getChangeRecords = _mapChangeRecords.getChangeRecords;
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
});