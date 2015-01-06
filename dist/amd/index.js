define(["exports", "./ast", "./event-manager", "./observer-locator", "./value-converter", "./array-change-records", "./binding-modes", "./expressions/parser", "./binding-expression", "./listener-expression", "./name-expression", "./call-expression", "./dirty-checking"], function (exports, _ast, _eventManager, _observerLocator, _valueConverter, _arrayChangeRecords, _bindingModes, _expressionsParser, _bindingExpression, _listenerExpression, _nameExpression, _callExpression, _dirtyChecking) {
  "use strict";

  var _interopRequireWildcard = function (obj) {
    return obj && obj.constructor === Object ? obj : {
      "default": obj
    };
  };

  var _exportsWildcard = function (obj) {
    for (var i in obj) {
      if (exports[i] !== undefined) {
        exports[i] = obj[i];
      }
    }
  };

  var patchAST = _ast.patchAST;
  patchAST();

  exports.EventManager = _eventManager.EventManager;
  exports.ObserverLocator = _observerLocator.ObserverLocator;
  exports.ValueConverter = _valueConverter.ValueConverter;
  exports.calcSplices = _arrayChangeRecords.calcSplices;
  _exportsWildcard(_interopRequireWildcard(_bindingModes));

  exports.Parser = _expressionsParser.Parser;
  exports.BindingExpression = _bindingExpression.BindingExpression;
  exports.ListenerExpression = _listenerExpression.ListenerExpression;
  exports.NameExpression = _nameExpression.NameExpression;
  exports.CallExpression = _callExpression.CallExpression;
  exports.DirtyChecker = _dirtyChecking.DirtyChecker;
});