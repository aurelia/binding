define(["exports", "./ast", "./event-manager", "./observer-locator", "./filter", "./array-change-records", "./binding-modes", "./expressions/parser", "./binding-expression", "./listener-expression", "./name-expression", "./dirty-checking"], function (exports, _ast, _eventManager, _observerLocator, _filter, _arrayChangeRecords, _bindingModes, _expressionsParser, _bindingExpression, _listenerExpression, _nameExpression, _dirtyChecking) {
  "use strict";

  var patchAST = _ast.patchAST;
  patchAST();

  exports.EventManager = _eventManager.EventManager;
  exports.ObserverLocator = _observerLocator.ObserverLocator;
  exports.Filter = _filter.Filter;
  exports.calcSplices = _arrayChangeRecords.calcSplices;
  (function (obj) {
    for (var i in obj) {
      exports[i] = obj[i];
    }
  })(_bindingModes);

  exports.Parser = _expressionsParser.Parser;
  exports.BindingExpression = _bindingExpression.BindingExpression;
  exports.ListenerExpression = _listenerExpression.ListenerExpression;
  exports.NameExpression = _nameExpression.NameExpression;
  exports.DirtyChecker = _dirtyChecking.DirtyChecker;
});