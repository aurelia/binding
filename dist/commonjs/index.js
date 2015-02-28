"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

var Metadata = require("aurelia-metadata").Metadata;

var _valueConverter = require("./value-converter");

var ValueConverter = _valueConverter.ValueConverter;
exports.EventManager = require("./event-manager").EventManager;

var _observerLocator = require("./observer-locator");

exports.ObserverLocator = _observerLocator.ObserverLocator;
exports.ObjectObservationAdapter = _observerLocator.ObjectObservationAdapter;
exports.ValueConverter = _valueConverter.ValueConverter;
exports.calcSplices = require("./array-change-records").calcSplices;

_defaults(exports, _interopRequireWildcard(require("./binding-modes")));

exports.Parser = require("./parser").Parser;
exports.BindingExpression = require("./binding-expression").BindingExpression;
exports.ListenerExpression = require("./listener-expression").ListenerExpression;
exports.NameExpression = require("./name-expression").NameExpression;
exports.CallExpression = require("./call-expression").CallExpression;
exports.DirtyChecker = require("./dirty-checking").DirtyChecker;
exports.getChangeRecords = require("./map-change-records").getChangeRecords;

var _computedObservation = require("./computed-observation");

exports.ComputedObservationAdapter = _computedObservation.ComputedObservationAdapter;
exports.declarePropertyDependencies = _computedObservation.declarePropertyDependencies;

Metadata.configure.classHelper("valueConverter", ValueConverter);
Object.defineProperty(exports, "__esModule", {
  value: true
});