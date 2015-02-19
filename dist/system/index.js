System.register(["aurelia-metadata", "./value-converter", "./event-manager", "./observer-locator", "./array-change-records", "./binding-modes", "./parser", "./binding-expression", "./listener-expression", "./name-expression", "./call-expression", "./dirty-checking", "./map-change-records"], function (_export) {
  "use strict";

  var Metadata, ValueConverter;
  return {
    setters: [function (_aureliaMetadata) {
      Metadata = _aureliaMetadata.Metadata;
    }, function (_valueConverter) {
      ValueConverter = _valueConverter.ValueConverter;
      _export("ValueConverter", _valueConverter.ValueConverter);
    }, function (_eventManager) {
      _export("EventManager", _eventManager.EventManager);
    }, function (_observerLocator) {
      _export("ObserverLocator", _observerLocator.ObserverLocator);

      _export("ObjectObservationAdapter", _observerLocator.ObjectObservationAdapter);
    }, function (_arrayChangeRecords) {
      _export("calcSplices", _arrayChangeRecords.calcSplices);
    }, function (_bindingModes) {
      for (var _key in _bindingModes) {
        _export(_key, _bindingModes[_key]);
      }
    }, function (_parser) {
      _export("Parser", _parser.Parser);
    }, function (_bindingExpression) {
      _export("BindingExpression", _bindingExpression.BindingExpression);
    }, function (_listenerExpression) {
      _export("ListenerExpression", _listenerExpression.ListenerExpression);
    }, function (_nameExpression) {
      _export("NameExpression", _nameExpression.NameExpression);
    }, function (_callExpression) {
      _export("CallExpression", _callExpression.CallExpression);
    }, function (_dirtyChecking) {
      _export("DirtyChecker", _dirtyChecking.DirtyChecker);
    }, function (_mapChangeRecords) {
      _export("getChangeRecords", _mapChangeRecords.getChangeRecords);
    }],
    execute: function () {
      Metadata.configure.classHelper("valueConverter", ValueConverter);
    }
  };
});