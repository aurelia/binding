"use strict";

var hyphenMatcher = /-([a-z])/gi;

function toUpperCase(match, char, index, str) {
  return char.toUpperCase();
}

var NameExpression = function NameExpression(attribute, value) {
  this.attribute = attribute;
  this.property = attribute.replace(hyphenMatcher, toUpperCase);
  this.discrete = true;
  this.mode = (value || "model").toLowerCase();
};

NameExpression.prototype.createBinding = function (target) {
  return new NameBinder(this.property, target, this.mode);
};

exports.NameExpression = NameExpression;
var NameBinder = function NameBinder(property, target, mode) {
  this.property = property;

  switch (mode) {
    case "model":
      this.target = target.primaryBehavior ? target.primaryBehavior.executionContext : target;
      break;
    case "element":
      this.target = target;
      break;
    default:
      throw new Error("Name expressions do not support mode: " + mode);
  }
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