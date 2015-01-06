System.register([], function (_export) {
  "use strict";

  var _inherits, Expression, Chain, ValueConverter, Assign, Conditional, AccessScope, AccessMember, AccessKeyed, CallScope, CallMember, CallFunction, Binary, PrefixNot, LiteralPrimitive, LiteralString, LiteralArray, LiteralObject, Unparser, evalListCache;
  function evalList(scope, list, valueConverters) {
    var length = list.length, cacheLength, i;

    for (cacheLength = evalListCache.length; cacheLength <= length; ++cacheLength) {
      _evalListCache.push([]);
    }

    var result = evalListCache[length];

    for (i = 0; i < length; ++i) {
      result[i] = list[i].eval(scope, valueConverters);
    }

    return result;
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
  return {
    setters: [],
    execute: function () {
      _inherits = function (child, parent) {
        if (typeof parent !== "function" && parent !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof parent);
        }
        child.prototype = Object.create(parent && parent.prototype, {
          constructor: {
            value: child,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        if (parent) child.__proto__ = parent;
      };

      Expression = function Expression() {
        this.isChain = false;
        this.isAssignable = false;
      };

      Expression.prototype.eval = function () {
        throw new Error("Cannot evaluate " + this);
      };

      Expression.prototype.assign = function () {
        throw new Error("Cannot assign to " + this);
      };

      Expression.prototype.toString = function () {
        return Unparser.unparse(this);
      };

      _export("Expression", Expression);

      Chain = (function () {
        var _Expression = Expression;
        var Chain = function Chain(expressions) {
          _Expression.call(this);

          this.expressions = expressions;
          this.isChain = true;
        };

        _inherits(Chain, _Expression);

        Chain.prototype.eval = function (scope, valueConverters) {
          var result, expressions = this.expressions, length = expressions.length, i, last;

          for (i = 0; i < length; ++i) {
            last = expressions[i].eval(scope, valueConverters);

            if (last != null) {
              result = last;
            }
          }

          return result;
        };

        Chain.prototype.accept = function (visitor) {
          visitor.visitChain(this);
        };

        return Chain;
      })();
      _export("Chain", Chain);

      ValueConverter = (function () {
        var _Expression2 = Expression;
        var ValueConverter = function ValueConverter(expression, name, args, allArgs) {
          _Expression2.call(this);

          this.expression = expression;
          this.name = name;
          this.args = args;
          this.allArgs = allArgs;
        };

        _inherits(ValueConverter, _Expression2);

        ValueConverter.prototype.eval = function (scope, valueConverters) {
          var converter = valueConverters(this.name);
          if (!converter) {
            throw new Error("No ValueConverter named \"" + this.name + "\" was found!");
          }

          if ("toView" in converter) {
            return converter.toView.apply(converter, evalList(scope, this.allArgs, valueConverters));
          }

          return this.allArgs[0].eval(scope, valueConverters);
        };

        ValueConverter.prototype.assign = function (scope, value, valueConverters) {
          var converter = valueConverters(this.name);
          if (!converter) {
            throw new Error("No ValueConverter named \"" + this.name + "\" was found!");
          }

          if ("fromView" in converter) {
            value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, valueConverters)));
          }

          return this.allArgs[0].assign(scope, value, valueConverters);
        };

        ValueConverter.prototype.accept = function (visitor) {
          visitor.visitValueConverter(this);
        };

        return ValueConverter;
      })();
      _export("ValueConverter", ValueConverter);

      Assign = (function () {
        var _Expression3 = Expression;
        var Assign = function Assign(target, value) {
          _Expression3.call(this);

          this.target = target;
          this.value = value;
        };

        _inherits(Assign, _Expression3);

        Assign.prototype.eval = function (scope, valueConverters) {
          return this.target.assign(scope, this.value.eval(scope, valueConverters));
        };

        Assign.prototype.accept = function (vistor) {
          vistor.visitAssign(this);
        };

        return Assign;
      })();
      _export("Assign", Assign);

      Conditional = (function () {
        var _Expression4 = Expression;
        var Conditional = function Conditional(condition, yes, no) {
          _Expression4.call(this);

          this.condition = condition;
          this.yes = yes;
          this.no = no;
        };

        _inherits(Conditional, _Expression4);

        Conditional.prototype.eval = function (scope, valueConverters) {
          return !!this.condition.eval(scope) ? this.yes.eval(scope) : this.no.eval(scope);
        };

        Conditional.prototype.accept = function (visitor) {
          visitor.visitConditional(this);
        };

        return Conditional;
      })();
      _export("Conditional", Conditional);

      AccessScope = (function () {
        var _Expression5 = Expression;
        var AccessScope = function AccessScope(name) {
          _Expression5.call(this);

          this.name = name;
          this.isAssignable = true;
        };

        _inherits(AccessScope, _Expression5);

        AccessScope.prototype.eval = function (scope, valueConverters) {
          return scope[this.name];
        };

        AccessScope.prototype.assign = function (scope, value) {
          return scope[this.name] = value;
        };

        AccessScope.prototype.accept = function (visitor) {
          visitor.visitAccessScope(this);
        };

        return AccessScope;
      })();
      _export("AccessScope", AccessScope);

      AccessMember = (function () {
        var _Expression6 = Expression;
        var AccessMember = function AccessMember(object, name) {
          _Expression6.call(this);

          this.object = object;
          this.name = name;
          this.isAssignable = true;
        };

        _inherits(AccessMember, _Expression6);

        AccessMember.prototype.eval = function (scope, valueConverters) {
          var instance = this.object.eval(scope, valueConverters);
          return instance == null ? null : instance[this.name];
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
      })();
      _export("AccessMember", AccessMember);

      AccessKeyed = (function () {
        var _Expression7 = Expression;
        var AccessKeyed = function AccessKeyed(object, key) {
          _Expression7.call(this);

          this.object = object;
          this.key = key;
          this.isAssignable = true;
        };

        _inherits(AccessKeyed, _Expression7);

        AccessKeyed.prototype.eval = function (scope, valueConverters) {
          var instance = this.object.eval(scope, valueConverters);
          var lookup = this.key.eval(scope, valueConverters);
          return getKeyed(instance, lookup);
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
      })();
      _export("AccessKeyed", AccessKeyed);

      CallScope = (function () {
        var _Expression8 = Expression;
        var CallScope = function CallScope(name, args) {
          _Expression8.call(this);

          this.name = name;
          this.args = args;
        };

        _inherits(CallScope, _Expression8);

        CallScope.prototype.eval = function (scope, valueConverters, args) {
          args = args || evalList(scope, this.args, valueConverters);
          return ensureFunctionFromMap(scope, this.name).apply(scope, args);
        };

        CallScope.prototype.accept = function (visitor) {
          visitor.visitCallScope(this);
        };

        return CallScope;
      })();
      _export("CallScope", CallScope);

      CallMember = (function () {
        var _Expression9 = Expression;
        var CallMember = function CallMember(object, name, args) {
          _Expression9.call(this);

          this.object = object;
          this.name = name;
          this.args = args;
        };

        _inherits(CallMember, _Expression9);

        CallMember.prototype.eval = function (scope, valueConverters, args) {
          var instance = this.object.eval(scope, valueConverters);
          args = args || evalList(scope, this.args, valueConverters);
          return ensureFunctionFromMap(instance, this.name).apply(instance, args);
        };

        CallMember.prototype.accept = function (visitor) {
          visitor.visitCallMember(this);
        };

        return CallMember;
      })();
      _export("CallMember", CallMember);

      CallFunction = (function () {
        var _Expression10 = Expression;
        var CallFunction = function CallFunction(func, args) {
          _Expression10.call(this);

          this.func = func;
          this.args = args;
        };

        _inherits(CallFunction, _Expression10);

        CallFunction.prototype.eval = function (scope, valueConverters, args) {
          var func = this.func.eval(scope, valueConverters);

          if (typeof func != "function") {
            throw new Error("" + this.func + " is not a function");
          } else {
            return func.apply(null, args || evalList(scope, this.args, valueConverters));
          }
        };

        CallFunction.prototype.accept = function (visitor) {
          visitor.visitCallFunction(this);
        };

        return CallFunction;
      })();
      _export("CallFunction", CallFunction);

      Binary = (function () {
        var _Expression11 = Expression;
        var Binary = function Binary(operation, left, right) {
          _Expression11.call(this);

          this.operation = operation;
          this.left = left;
          this.right = right;
        };

        _inherits(Binary, _Expression11);

        Binary.prototype.eval = function (scope, valueConverters) {
          var left = this.left.eval(scope);

          switch (this.operation) {
            case "&&":
              return !!left && !!this.right.eval(scope);
            case "||":
              return !!left || !!this.right.eval(scope);
          }

          var right = this.right.eval(scope);

          if (left == null || right == null) {
            switch (this.operation) {
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

          switch (this.operation) {
            case "+":
              return autoConvertAdd(left, right);
            case "-":
              return left - right;
            case "*":
              return left * right;
            case "/":
              return left / right;
            case "~/":
              return Math.floor(left / right);
            case "%":
              return left % right;
            case "==":
              return left == right;
            case "!=":
              return left != right;
            case "<":
              return left < right;
            case ">":
              return left > right;
            case "<=":
              return left <= right;
            case ">=":
              return left >= right;
            case "^":
              return left ^ right;
            case "&":
              return left & right;
          }

          throw new Error("Internal error [" + this.operation + "] not handled");
        };

        Binary.prototype.accept = function (visitor) {
          visitor.visitBinary(this);
        };

        return Binary;
      })();
      _export("Binary", Binary);

      PrefixNot = (function () {
        var _Expression12 = Expression;
        var PrefixNot = function PrefixNot(operation, expression) {
          _Expression12.call(this);

          this.operation = operation;
          this.expression = expression;
        };

        _inherits(PrefixNot, _Expression12);

        PrefixNot.prototype.eval = function (scope, valueConverters) {
          return !this.expression.eval(scope);
        };

        PrefixNot.prototype.accept = function (visitor) {
          visitor.visitPrefix(this);
        };

        return PrefixNot;
      })();
      _export("PrefixNot", PrefixNot);

      LiteralPrimitive = (function () {
        var _Expression13 = Expression;
        var LiteralPrimitive = function LiteralPrimitive(value) {
          _Expression13.call(this);

          this.value = value;
        };

        _inherits(LiteralPrimitive, _Expression13);

        LiteralPrimitive.prototype.eval = function (scope, valueConverters) {
          return this.value;
        };

        LiteralPrimitive.prototype.accept = function (visitor) {
          visitor.visitLiteralPrimitive(this);
        };

        return LiteralPrimitive;
      })();
      _export("LiteralPrimitive", LiteralPrimitive);

      LiteralString = (function () {
        var _Expression14 = Expression;
        var LiteralString = function LiteralString(value) {
          _Expression14.call(this);

          this.value = value;
        };

        _inherits(LiteralString, _Expression14);

        LiteralString.prototype.eval = function (scope, valueConverters) {
          return this.value;
        };

        LiteralString.prototype.accept = function (visitor) {
          visitor.visitLiteralString(this);
        };

        return LiteralString;
      })();
      _export("LiteralString", LiteralString);

      LiteralArray = (function () {
        var _Expression15 = Expression;
        var LiteralArray = function LiteralArray(elements) {
          _Expression15.call(this);

          this.elements = elements;
        };

        _inherits(LiteralArray, _Expression15);

        LiteralArray.prototype.eval = function (scope, valueConverters) {
          var elements = this.elements, length = elements.length, result = [], i;

          for (i = 0; i < length; ++i) {
            result[i] = elements[i].eval(scope, valueConverters);
          }

          return result;
        };

        LiteralArray.prototype.accept = function (visitor) {
          visitor.visitLiteralArray(this);
        };

        return LiteralArray;
      })();
      _export("LiteralArray", LiteralArray);

      LiteralObject = (function () {
        var _Expression16 = Expression;
        var LiteralObject = function LiteralObject(keys, values) {
          _Expression16.call(this);

          this.keys = keys;
          this.values = values;
        };

        _inherits(LiteralObject, _Expression16);

        LiteralObject.prototype.eval = function (scope, valueConverters) {
          var instance = {}, keys = this.keys, values = this.values, length = keys.length, i;

          for (i = 0; i < length; ++i) {
            instance[keys[i]] = values[i].eval(scope, valueConverters);
          }

          return instance;
        };

        LiteralObject.prototype.accept = function (visitor) {
          visitor.visitLiteralObject(this);
        };

        return LiteralObject;
      })();
      _export("LiteralObject", LiteralObject);

      Unparser = function Unparser(buffer) {
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
        var i, length;

        this.write("(");

        for (i = 0, length = args.length; i < length; ++i) {
          if (i != 0) {
            this.write(",");
          }

          args[i].accept(this);
        }

        this.write(")");
      };

      Unparser.prototype.visitChain = function (chain) {
        var expressions = chain.expressions, length = expressions.length, i;

        for (i = 0; i < length; ++i) {
          if (i != 0) {
            this.write(";");
          }

          expressions[i].accept(this);
        }
      };

      Unparser.prototype.visitValueConverter = function (converter) {
        var args = converter.args, length = args.length, i;

        this.write("(");
        converter.expression.accept(this);
        this.write("|" + converter.name);

        for (i = 0; i < length; ++i) {
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

        for (i = 0; i < length; ++i) {
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

        for (i = 0; i < length; ++i) {
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

      _export("Unparser", Unparser);

      evalListCache = [[], [0], [0, 0], [0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0, 0]];
    }
  };
});