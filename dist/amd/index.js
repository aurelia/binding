define(["exports", "aurelia-metadata", "./value-converter", "./event-manager", "./observer-locator", "./array-change-records", "./binding-modes", "./parser", "./binding-expression", "./listener-expression", "./name-expression", "./call-expression", "./dirty-checking", "./map-change-records", "./computed-observation"], function (exports, _aureliaMetadata, _valueConverter, _eventManager, _observerLocator, _arrayChangeRecords, _bindingModes, _parser, _bindingExpression, _listenerExpression, _nameExpression, _callExpression, _dirtyChecking, _mapChangeRecords, _computedObservation) {
  "use strict";

  var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

  var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

  var Metadata = _aureliaMetadata.Metadata;
  var ValueConverter = _valueConverter.ValueConverter;
  exports.EventManager = _eventManager.EventManager;
  exports.ObserverLocator = _observerLocator.ObserverLocator;
  exports.ObjectObservationAdapter = _observerLocator.ObjectObservationAdapter;
  exports.ValueConverter = _valueConverter.ValueConverter;
  exports.calcSplices = _arrayChangeRecords.calcSplices;

  _defaults(exports, _interopRequireWildcard(_bindingModes));

  exports.Parser = _parser.Parser;
  exports.BindingExpression = _bindingExpression.BindingExpression;
  exports.ListenerExpression = _listenerExpression.ListenerExpression;
  exports.NameExpression = _nameExpression.NameExpression;
  exports.CallExpression = _callExpression.CallExpression;
  exports.DirtyChecker = _dirtyChecking.DirtyChecker;
  exports.getChangeRecords = _mapChangeRecords.getChangeRecords;
  exports.ComputedObservationAdapter = _computedObservation.ComputedObservationAdapter;
  exports.declarePropertyDependencies = _computedObservation.declarePropertyDependencies;

  Metadata.configure.classHelper("valueConverter", ValueConverter);
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});