System.register(['aurelia-metadata', './value-converter', './event-manager', './observer-locator', './array-change-records', './binding-modes', './parser', './binding-expression', './listener-expression', './name-expression', './call-expression', './dirty-checking', './map-change-records', './computed-observation'], function (_export) {
  var Decorators, Metadata, ValueConverterResource;

  _export('valueConverter', valueConverter);

  _export('computedFrom', computedFrom);

  function valueConverter(nameOrTarget) {
    if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
      return function (target) {
        Reflect.defineMetadata(Metadata.resource, new ValueConverterResource(nameOrTarget), target);
      };
    }

    Reflect.defineMetadata(Metadata.resource, new ValueConverterResource(), nameOrTarget);
  }

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

  return {
    setters: [function (_aureliaMetadata) {
      Decorators = _aureliaMetadata.Decorators;
      Metadata = _aureliaMetadata.Metadata;
    }, function (_valueConverter) {
      ValueConverterResource = _valueConverter.ValueConverterResource;

      _export('ValueConverterResource', _valueConverter.ValueConverterResource);
    }, function (_eventManager) {
      _export('EventManager', _eventManager.EventManager);
    }, function (_observerLocator) {
      _export('ObserverLocator', _observerLocator.ObserverLocator);

      _export('ObjectObservationAdapter', _observerLocator.ObjectObservationAdapter);
    }, function (_arrayChangeRecords) {
      _export('calcSplices', _arrayChangeRecords.calcSplices);
    }, function (_bindingModes) {
      for (var _key2 in _bindingModes) {
        _export(_key2, _bindingModes[_key2]);
      }
    }, function (_parser) {
      _export('Parser', _parser.Parser);
    }, function (_bindingExpression) {
      _export('BindingExpression', _bindingExpression.BindingExpression);
    }, function (_listenerExpression) {
      _export('ListenerExpression', _listenerExpression.ListenerExpression);
    }, function (_nameExpression) {
      _export('NameExpression', _nameExpression.NameExpression);
    }, function (_callExpression) {
      _export('CallExpression', _callExpression.CallExpression);
    }, function (_dirtyChecking) {
      _export('DirtyChecker', _dirtyChecking.DirtyChecker);
    }, function (_mapChangeRecords) {
      _export('getChangeRecords', _mapChangeRecords.getChangeRecords);
    }, function (_computedObservation) {
      _export('ComputedPropertyObserver', _computedObservation.ComputedPropertyObserver);

      _export('declarePropertyDependencies', _computedObservation.declarePropertyDependencies);
    }],
    execute: function () {
      'use strict';

      Decorators.configure.parameterizedDecorator('valueConverter', valueConverter);
    }
  };
});