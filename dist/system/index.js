System.register(["./ast", "./event-manager", "./observer-locator", "./value-converter", "./array-change-records", "./binding-modes", "./expressions/parser", "./binding-expression", "./listener-expression", "./name-expression", "./call-expression", "./dirty-checking"], function (_export) {
  "use strict";

  var patchAST;
  return {
    setters: [function (_ast) {
      patchAST = _ast.patchAST;
    }, function (_eventManager) {
      _export("EventManager", _eventManager.EventManager);
    }, function (_observerLocator) {
      _export("ObserverLocator", _observerLocator.ObserverLocator);
    }, function (_valueConverter) {
      _export("ValueConverter", _valueConverter.ValueConverter);
    }, function (_arrayChangeRecords) {
      _export("calcSplices", _arrayChangeRecords.calcSplices);
    }, function (_bindingModes) {
      for (var _key in _bindingModes) {
        _export(_key, _bindingModes[_key]);
      }
    }, function (_expressionsParser) {
      _export("Parser", _expressionsParser.Parser);
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
    }],
    execute: function () {
      patchAST();
    }
  };
});