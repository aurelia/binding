"use strict";

var hyphenMatcher = /-([a-z])/gi;

function toUpperCase(match, char, index, str) {
  return char.toUpperCase();
}

var NameExpression = (function () {
  var NameExpression = function NameExpression(attribute) {
    this.attribute = attribute;
    this.property = attribute.replace(hyphenMatcher, toUpperCase);
    this.discrete = true;
  };

  NameExpression.prototype.createBinding = function (target) {
    return new NameBinder(this.property, target);
  };

  return NameExpression;
})();

exports.NameExpression = NameExpression;
var NameBinder = (function () {
  var NameBinder = function NameBinder(property, target) {
    this.property = property;
    this.target = target.primaryBehavior ? target.primaryBehavior.executionContext : target;
  };

  NameBinder.prototype.bind = function (source) {
    if (this.source) {
      if (this.source === source) {
        return;
      }

      this.unbind();
    }

    this.source = source;
    source[this.property] = this.target;
  };

  NameBinder.prototype.unbind = function () {
    this.source[this.property] = null;
  };

  return NameBinder;
})();