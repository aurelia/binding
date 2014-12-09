"use strict";

var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

var Expression = (function () {
  var Expression = function Expression() {
    this.isChain = false;
    this.isAssignable = false;
  };

  Expression.prototype.eval = function () {
    throw new Error("Cannot evaluate " + this);
  };

  Expression.prototype.assign = function () {
    throw new Error("Cannot assign to " + this);
  };

  Expression.prototype.bind = function (context, wrapper) {
    return new BoundExpression(this, context, wrapper);
  };

  Expression.prototype.toString = function () {
    return Unparser.unparse(this);
  };

  return Expression;
})();

exports.Expression = Expression;
var BoundExpression = (function () {
  var BoundExpression = function BoundExpression(expression, context, wrapper) {
    if (wrapper === undefined) wrapper = null;
    this.expression = expression;
    this._context = context;
    this._wrapper = wrapper;
  };

  BoundExpression.prototype.eval = function (locals) {
    if (locals === undefined) locals = null;
    return this.expression.eval(this._computeContext(locals));
  };

  BoundExpression.prototype.assign = function (value, locals) {
    if (locals === undefined) locals = null;
    return this.expression.assign(this._computeContext(locals), value);
  };

  BoundExpression.prototype._computeContext = function (locals) {
    if (locals == null) {
      return this._context;
    }

    if (this._wrapper) {
      return this._wrapper(this._context, locals);
    }

    throw new Error("Locals " + locals + " provided, but missing wrapper.");
  };

  return BoundExpression;
})();

exports.BoundExpression = BoundExpression;
var Chain = (function (Expression) {
  var Chain = function Chain(expressions) {
    Expression.call(this);

    this.expressions = expressions;
    this.isChain = true;
  };

  _extends(Chain, Expression);

  Chain.prototype.eval = function (scope, filters) {
    var _this = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var result, expressions = _this.expressions, length = expressions.length, i;

      for (i = 0; i < length; i++) {
        var last = expressions[i].eval(scope, filters);

        if (last != null) {
          result = last;
        }
      }

      return result;
    })();
  };

  Chain.prototype.accept = function (visitor) {
    visitor.visitChain(this);
  };

  return Chain;
})(Expression);

exports.Chain = Chain;
var Filter = (function (Expression) {
  var Filter = function Filter(expression, name, args, allArgs) {
    Expression.call(this);

    this.expression = expression;
    this.name = name;
    this.args = args;
    this.allArgs = allArgs;
  };

  _extends(Filter, Expression);

  Filter.prototype.eval = function (scope, filters) {
    var _this2 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var filter = filters(_this2.name);
      if (!filter) {
        throw new Error("No Filter: " + _this2.name + " found!");
      }

      return filter.apply(null, evalList(scope, _this2.allArgs, filters));
    })();
  };

  Filter.prototype.accept = function (visitor) {
    visitor.visitFilter(this);
  };

  return Filter;
})(Expression);

exports.Filter = Filter;
var Assign = (function (Expression) {
  var Assign = function Assign(target, value) {
    Expression.call(this);

    this.target = target;
    this.value = value;
  };

  _extends(Assign, Expression);

  Assign.prototype.eval = function (scope, filters) {
    var _this3 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      return _this3.target.assign(scope, _this3.value.eval(scope, filters));
    })();
  };

  Assign.prototype.accept = function (vistor) {
    vistor.visitAssign(this);
  };

  return Assign;
})(Expression);

exports.Assign = Assign;
var Conditional = (function (Expression) {
  var Conditional = function Conditional(condition, yes, no) {
    Expression.call(this);

    this.condition = condition;
    this.yes = yes;
    this.no = no;
  };

  _extends(Conditional, Expression);

  Conditional.prototype.eval = function (scope, filters) {
    var _this4 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      return (!!_this4.condition.eval(scope)) ? _this4.yes.eval(scope) : _this4.no.eval(scope);
    })();
  };

  Conditional.prototype.accept = function (visitor) {
    visitor.visitConditional(this);
  };

  return Conditional;
})(Expression);

exports.Conditional = Conditional;
var AccessScope = (function (Expression) {
  var AccessScope = function AccessScope(name) {
    Expression.call(this);

    this.name = name;
    this.isAssignable = true;
  };

  _extends(AccessScope, Expression);

  AccessScope.prototype.eval = function (scope, filters) {
    var _this5 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      return scope[_this5.name];
    })();
  };

  AccessScope.prototype.assign = function (scope, value) {
    return scope[this.name] = value;
  };

  AccessScope.prototype.accept = function (visitor) {
    visitor.visitAccessScope(this);
  };

  return AccessScope;
})(Expression);

exports.AccessScope = AccessScope;
var AccessMember = (function (Expression) {
  var AccessMember = function AccessMember(object, name) {
    Expression.call(this);

    this.object = object;
    this.name = name;
    this.isAssignable = true;
  };

  _extends(AccessMember, Expression);

  AccessMember.prototype.eval = function (scope, filters) {
    var _this6 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var instance = _this6.object.eval(scope, filters);
      return instance == null ? null : instance[_this6.name];
    })();
  };

  AccessMember.prototype.assign = function (scope, value) {
    var instance = this.object.eval(scope);

    if (!instance) {
      instance = {};
      this.object.assign(scope, instance);
    }

    return instance[this.name] = value;
  };

  AccessMember.prototype.accept = function (visitor) {
    visitor.visitAccessMember(this);
  };

  return AccessMember;
})(Expression);

exports.AccessMember = AccessMember;
var AccessKeyed = (function (Expression) {
  var AccessKeyed = function AccessKeyed(object, key) {
    Expression.call(this);

    this.object = object;
    this.key = key;
    this.isAssignable = true;
  };

  _extends(AccessKeyed, Expression);

  AccessKeyed.prototype.eval = function (scope, filters) {
    var _this7 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var instance = _this7.object.eval(scope, filters);
      var lookup = _this7.key.eval(scope, filters);
      return getKeyed(instance, lookup);
    })();
  };

  AccessKeyed.prototype.assign = function (scope, value) {
    var instance = this.object.eval(scope);
    var lookup = this.key.eval(scope);
    return setKeyed(instance, lookup, value);
  };

  AccessKeyed.prototype.accept = function (visitor) {
    visitor.visitAccessKeyed(this);
  };

  return AccessKeyed;
})(Expression);

exports.AccessKeyed = AccessKeyed;
var CallScope = (function (Expression) {
  var CallScope = function CallScope(name, args) {
    Expression.call(this);

    this.name = name;
    this.args = args;
  };

  _extends(CallScope, Expression);

  CallScope.prototype.eval = function (scope, filters) {
    var _this8 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var args = evalList(scope, _this8.args, filters);
      return ensureFunctionFromMap(scope, _this8.name).apply(scope, args);
    })();
  };

  CallScope.prototype.accept = function (visitor) {
    visitor.visitCallScope(this);
  };

  return CallScope;
})(Expression);

exports.CallScope = CallScope;
var CallMember = (function (Expression) {
  var CallMember = function CallMember(object, name, args) {
    Expression.call(this);

    this.object = object;
    this.name = name;
    this.args = args;
  };

  _extends(CallMember, Expression);

  CallMember.prototype.eval = function (scope, filters) {
    var _this9 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var instance = _this9.object.eval(scope, filters);
      var args = evalList(scope, _this9.args, filters);
      return ensureFunctionFromMap(instance, _this9.name).apply(instance, args);
    })();
  };

  CallMember.prototype.accept = function (visitor) {
    visitor.visitCallMember(this);
  };

  return CallMember;
})(Expression);

exports.CallMember = CallMember;
var CallFunction = (function (Expression) {
  var CallFunction = function CallFunction(func, args) {
    Expression.call(this);

    this.func = func;
    this.args = args;
  };

  _extends(CallFunction, Expression);

  CallFunction.prototype.eval = function (scope, filters) {
    var _this10 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var func = _this10.func.eval(scope, filters);

      if (typeof func != "function") {
        throw new Error("" + _this10.func + " is not a function");
      } else {
        return func.apply(null, evalList(scope, _this10.args, filters));
      }
    })();
  };

  CallFunction.prototype.accept = function (visitor) {
    visitor.visitCallFunction(this);
  };

  return CallFunction;
})(Expression);

exports.CallFunction = CallFunction;
var Binary = (function (Expression) {
  var Binary = function Binary(operation, left, right) {
    Expression.call(this);

    this.operation = operation;
    this.left = left;
    this.right = right;
  };

  _extends(Binary, Expression);

  Binary.prototype.eval = function (scope, filters) {
    var _this11 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var left = _this11.left.eval(scope);

      switch (_this11.operation) {
        case "&&": return !!left && !!_this11.right.eval(scope);
        case "||": return !!left || !!_this11.right.eval(scope);
      }

      var right = _this11.right.eval(scope);

      if (left == null || right == null) {
        switch (_this11.operation) {
          case "+":
            if (left != null) return left;
            if (right != null) return right;
            return 0;
          case "-":
            if (left != null) return left;
            if (right != null) return 0 - right;
            return 0;
        }

        return null;
      }

      switch (_this11.operation) {
        case "+": return autoConvertAdd(left, right);
        case "-": return left - right;
        case "*": return left * right;
        case "/": return left / right;
        case "~/": return Math.floor(left / right);
        case "%": return left % right;
        case "==": return left == right;
        case "!=": return left != right;
        case "<": return left < right;
        case ">": return left > right;
        case "<=": return left <= right;
        case ">=": return left >= right;
        case "^": return left ^ right;
        case "&": return left & right;
      }

      throw new Error("Internal error [" + _this11.operation + "] not handled");
    })();
  };

  Binary.prototype.accept = function (visitor) {
    visitor.visitBinary(this);
  };

  return Binary;
})(Expression);

exports.Binary = Binary;
var PrefixNot = (function (Expression) {
  var PrefixNot = function PrefixNot(operation, expression) {
    Expression.call(this);

    this.operation = operation;
    this.expression = expression;
  };

  _extends(PrefixNot, Expression);

  PrefixNot.prototype.eval = function (scope, filters) {
    var _this12 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      return !_this12.expression.eval(scope);
    })();
  };

  PrefixNot.prototype.accept = function (visitor) {
    visitor.visitPrefix(this);
  };

  return PrefixNot;
})(Expression);

exports.PrefixNot = PrefixNot;
var LiteralPrimitive = (function (Expression) {
  var LiteralPrimitive = function LiteralPrimitive(value) {
    Expression.call(this);

    this.value = value;
  };

  _extends(LiteralPrimitive, Expression);

  LiteralPrimitive.prototype.eval = function (scope, filters) {
    var _this13 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      return _this13.value;
    })();
  };

  LiteralPrimitive.prototype.accept = function (visitor) {
    visitor.visitLiteralPrimitive(this);
  };

  return LiteralPrimitive;
})(Expression);

exports.LiteralPrimitive = LiteralPrimitive;
var LiteralString = (function (Expression) {
  var LiteralString = function LiteralString(value) {
    Expression.call(this);

    this.value = value;
  };

  _extends(LiteralString, Expression);

  LiteralString.prototype.eval = function (scope, filters) {
    var _this14 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      return _this14.value;
    })();
  };

  LiteralString.prototype.accept = function (visitor) {
    visitor.visitLiteralString(this);
  };

  return LiteralString;
})(Expression);

exports.LiteralString = LiteralString;
var LiteralArray = (function (Expression) {
  var LiteralArray = function LiteralArray(elements) {
    Expression.call(this);

    this.elements = elements;
  };

  _extends(LiteralArray, Expression);

  LiteralArray.prototype.eval = function (scope, filters) {
    var _this15 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var elements = _this15.elements, length = elements.length, result = [], i;

      for (i = 0; i < length; i++) {
        result[i] = elements[i].eval(scope, filters);
      }

      return result;
    })();
  };

  LiteralArray.prototype.accept = function (visitor) {
    visitor.visitLiteralArray(this);
  };

  return LiteralArray;
})(Expression);

exports.LiteralArray = LiteralArray;
var LiteralObject = (function (Expression) {
  var LiteralObject = function LiteralObject(keys, values) {
    Expression.call(this);

    this.keys = keys;
    this.values = values;
  };

  _extends(LiteralObject, Expression);

  LiteralObject.prototype.eval = function (scope, filters) {
    var _this16 = this;
    if (filters === undefined) filters = defaultFilterMap;
    return (function () {
      var instance = {}, keys = _this16.keys, values = _this16.values, length = keys.length, i;

      for (i = 0; i < length; i++) {
        instance[keys[i]] = values[i].eval(scope, filters);
      }

      return instance;
    })();
  };

  LiteralObject.prototype.accept = function (visitor) {
    visitor.visitLiteralObject(this);
  };

  return LiteralObject;
})(Expression);

exports.LiteralObject = LiteralObject;
var Unparser = (function () {
  var Unparser = function Unparser(buffer) {
    this.buffer = buffer;
  };

  Unparser.unparse = function (expression) {
    var buffer = [], visitor = new Unparser(buffer);

    expression.accept(visitor);

    return buffer.join("");
  };

  Unparser.prototype.write = function (text) {
    this.buffer.push(text);
  };

  Unparser.prototype.writeArgs = function (args) {
    this.write("(");

    for (var i = 0, length = args.length; i < length; i++) {
      if (i != 0) {
        this.write(",");
      }

      args[i].accept(this);
    }

    this.write(")");
  };

  Unparser.prototype.visitChain = function (chain) {
    var expressions = chain.expressions, length = expressions.length, i;

    for (i = 0; i < length; i++) {
      if (i != 0) {
        this.write(";");
      }

      expressions[i].accept(this);
    }
  };

  Unparser.prototype.visitFilter = function (filter) {
    var args = filter.args, length = args.length, i;

    this.write("(");
    filter.expression.accept(this);
    this.write("|" + filter.name);

    for (i = 0; i < length; i++) {
      this.write(" :");
      args[i].accept(this);
    }

    this.write(")");
  };

  Unparser.prototype.visitAssign = function (assign) {
    assign.target.accept(this);
    this.write("=");
    assign.value.accept(this);
  };

  Unparser.prototype.visitConditional = function (conditional) {
    conditional.condition.accept(this);
    this.write("?");
    conditional.yes.accept(this);
    this.write(":");
    conditional.no.accept(this);
  };

  Unparser.prototype.visitAccessScope = function (access) {
    this.write(access.name);
  };

  Unparser.prototype.visitAccessMember = function (access) {
    access.object.accept(this);
    this.write("." + access.name);
  };

  Unparser.prototype.visitAccessKeyed = function (access) {
    access.object.accept(this);
    this.write("[");
    access.key.accept(this);
    this.write("]");
  };

  Unparser.prototype.visitCallScope = function (call) {
    this.write(call.name);
    this.writeArgs(call.args);
  };

  Unparser.prototype.visitCallFunction = function (call) {
    call.func.accept(this);
    this.writeArgs(call.args);
  };

  Unparser.prototype.visitCallMember = function (call) {
    call.object.accept(this);
    this.write("." + call.name);
    this.writeArgs(call.args);
  };

  Unparser.prototype.visitPrefix = function (prefix) {
    this.write("(" + prefix.operation);
    prefix.expression.accept(this);
    this.write(")");
  };

  Unparser.prototype.visitBinary = function (binary) {
    this.write("(");
    binary.left.accept(this);
    this.write(binary.operation);
    binary.right.accept(this);
    this.write(")");
  };

  Unparser.prototype.visitLiteralPrimitive = function (literal) {
    this.write("" + literal.value);
  };

  Unparser.prototype.visitLiteralArray = function (literal) {
    var elements = literal.elements, length = elements.length, i;

    this.write("[");

    for (i = 0; i < length; i++) {
      if (i != 0) {
        this.write(",");
      }

      elements[i].accept(this);
    }

    this.write("]");
  };

  Unparser.prototype.visitLiteralObject = function (literal) {
    var keys = literal.keys, values = literal.values, length = keys.length, i;

    this.write("{");

    for (i = 0; i < length; i++) {
      if (i != 0) {
        this.write(",");
      }

      this.write("'" + keys[i] + "':");
      values[i].accept(this);
    }

    this.write("}");
  };

  Unparser.prototype.visitLiteralString = function (literal) {
    var escaped = literal.value.replace(/'/g, "'");
    this.write("'" + escaped + "'");
  };

  return Unparser;
})();

exports.Unparser = Unparser;


function defaultFilterMap(name) {
  throw new Error("No NgFilter: " + name + " found!");
}

var evalListCache = [[], [0], [0, 0], [0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0, 0]];

function evalList(scope, list, filters) {
  if (filters === undefined) filters = defaultFilterMap;
  return (function () {
    var length = list.length;

    for (var cacheLength = evalListCache.length; cacheLength <= length; cacheLength++) {
      _evalListCache.push([]);
    }

    var result = evalListCache[length];

    for (var i = 0; i < length; i++) {
      result[i] = list[i].eval(scope, filters);
    }

    return result;
  })();
}

function autoConvertAdd(a, b) {
  if (a != null && b != null) {
    if (typeof a == "string" && typeof b != "string") {
      return a + b.toString();
    }

    if (typeof a != "string" && typeof b == "string") {
      return a.toString() + b;
    }

    return a + b;
  }

  if (a != null) {
    return a;
  }

  if (b != null) {
    return b;
  }

  return 0;
}

function ensureFunctionFromMap(obj, name) {
  var func = obj[name];

  if (typeof func == "function") {
    return func;
  }

  if (func == null) {
    throw new Error("Undefined function " + name);
  } else {
    throw new Error("" + name + " is not a function");
  }
}

function getKeyed(obj, key) {
  if (Array.isArray(obj)) {
    return obj[parseInt(key)];
  } else if (obj) {
    return obj[key];
  } else if (obj == null) {
    throw new Error("Accessing null object");
  } else {
    return obj[key];
  }
}

function setKeyed(obj, key, value) {
  if (Array.isArray(obj)) {
    var index = parseInt(key);

    if (obj.length <= index) {
      obj.length = index + 1;
    }

    obj[index] = value;
  } else {
    obj[key] = value;
  }

  return value;
}