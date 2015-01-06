"use strict";

var CallExpression = function CallExpression(observerLocator, targetProperty, sourceExpression, valueConverterLookupFunction) {
  this.observerLocator = observerLocator;
  this.targetProperty = targetProperty;
  this.sourceExpression = sourceExpression;
  this.valueConverterLookupFunction = valueConverterLookupFunction;
};

CallExpression.prototype.createBinding = function (target) {
  return new Call(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.valueConverterLookupFunction);
};

exports.CallExpression = CallExpression;
var Call = function Call(observerLocator, sourceExpression, target, targetProperty, valueConverterLookupFunction) {
  this.sourceExpression = sourceExpression;
  this.target = target;
  this.targetProperty = observerLocator.getObserver(target, targetProperty);
  this.valueConverterLookupFunction = valueConverterLookupFunction;
};

Call.prototype.bind = function (source) {
  var _this = this;
  if (this.source === source) {
    return;
  }

  if (this.source) {
    this.unbind();
  }

  this.source = source;
  this.targetProperty.setValue(function () {
    var rest = [];

    for (var _key = 0; _key < arguments.length; _key++) {
      rest[_key] = arguments[_key];
    }

    return _this.sourceExpression.eval(source, _this.valueConverterLookupFunction, rest);
  });
};

Call.prototype.unbind = function () {
  this.targetProperty.setValue(null);
};