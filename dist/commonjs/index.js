"use strict";

var patchAST = require('./ast').patchAST;
patchAST();

exports.EventManager = require("./event-manager").EventManager;
exports.ObserverLocator = require("./observer-locator").ObserverLocator;
exports.Filter = require("./filter").Filter;
exports.calcSplices = require("./array-change-records").calcSplices;
(function (obj) {
  for (var i in obj) {
    exports[i] = obj[i];
  }
})(require("./binding-modes"));

exports.Parser = require("./expressions/parser").Parser;
exports.BindingExpression = require("./binding-expression").BindingExpression;
exports.ListenerExpression = require("./listener-expression").ListenerExpression;
exports.NameExpression = require("./name-expression").NameExpression;
exports.DirtyChecker = require("./dirty-checking").DirtyChecker;