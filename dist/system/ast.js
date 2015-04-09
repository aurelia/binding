System.register(['./path-observer', './composite-observer'], function (_export) {
  var PathObserver, CompositeObserver, _get, _inherits, _classCallCheck, _createClass, Expression, Chain, ValueConverter, Assign, Conditional, AccessScope, AccessMember, AccessKeyed, CallScope, CallMember, CallFunction, Binary, PrefixNot, LiteralPrimitive, LiteralString, LiteralArray, LiteralObject, Unparser, evalListCache;

  function evalList(scope, list, valueConverters) {
    var length = list.length,
        cacheLength,
        i;

    for (cacheLength = evalListCache.length; cacheLength <= length; ++cacheLength) {
      evalListCache.push([]);
    }

    var result = evalListCache[length];

    for (i = 0; i < length; ++i) {
      result[i] = list[i].evaluate(scope, valueConverters);
    }

    return result;
  }

  function autoConvertAdd(a, b) {
    if (a != null && b != null) {
      if (typeof a == 'string' && typeof b != 'string') {
        return a + b.toString();
      }

      if (typeof a != 'string' && typeof b == 'string') {
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

    if (typeof func === 'function') {
      return func;
    }

    if (func === null) {
      throw new Error('Undefined function ' + name);
    } else {
      throw new Error('' + name + ' is not a function');
    }
  }

  function getKeyed(obj, key) {
    if (Array.isArray(obj)) {
      return obj[parseInt(key)];
    } else if (obj) {
      return obj[key];
    } else if (obj === null) {
      throw new Error('Accessing null object');
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
    setters: [function (_pathObserver) {
      PathObserver = _pathObserver.PathObserver;
    }, function (_compositeObserver) {
      CompositeObserver = _compositeObserver.CompositeObserver;
    }],
    execute: function () {
      'use strict';

      _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

      _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      Expression = (function () {
        function Expression() {
          _classCallCheck(this, Expression);

          this.isChain = false;
          this.isAssignable = false;
        }

        _createClass(Expression, [{
          key: 'evaluate',
          value: function evaluate() {
            throw new Error('Cannot evaluate ' + this);
          }
        }, {
          key: 'assign',
          value: function assign() {
            throw new Error('Cannot assign to ' + this);
          }
        }, {
          key: 'toString',
          value: function toString() {
            return Unparser.unparse(this);
          }
        }]);

        return Expression;
      })();

      _export('Expression', Expression);

      Chain = (function (_Expression) {
        function Chain(expressions) {
          _classCallCheck(this, Chain);

          _get(Object.getPrototypeOf(Chain.prototype), 'constructor', this).call(this);

          this.expressions = expressions;
          this.isChain = true;
        }

        _inherits(Chain, _Expression);

        _createClass(Chain, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            var result,
                expressions = this.expressions,
                length = expressions.length,
                i,
                last;

            for (i = 0; i < length; ++i) {
              last = expressions[i].evaluate(scope, valueConverters);

              if (last !== null) {
                result = last;
              }
            }

            return result;
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitChain(this);
          }
        }]);

        return Chain;
      })(Expression);

      _export('Chain', Chain);

      ValueConverter = (function (_Expression2) {
        function ValueConverter(expression, name, args, allArgs) {
          _classCallCheck(this, ValueConverter);

          _get(Object.getPrototypeOf(ValueConverter.prototype), 'constructor', this).call(this);

          this.expression = expression;
          this.name = name;
          this.args = args;
          this.allArgs = allArgs;
        }

        _inherits(ValueConverter, _Expression2);

        _createClass(ValueConverter, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            var converter = valueConverters(this.name);
            if (!converter) {
              throw new Error('No ValueConverter named "' + this.name + '" was found!');
            }

            if ('toView' in converter) {
              return converter.toView.apply(converter, evalList(scope, this.allArgs, valueConverters));
            }

            return this.allArgs[0].evaluate(scope, valueConverters);
          }
        }, {
          key: 'assign',
          value: function assign(scope, value, valueConverters) {
            var converter = valueConverters(this.name);
            if (!converter) {
              throw new Error('No ValueConverter named "' + this.name + '" was found!');
            }

            if ('fromView' in converter) {
              value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, valueConverters)));
            }

            return this.allArgs[0].assign(scope, value, valueConverters);
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitValueConverter(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this = this;

            var observer,
                childObservers = [],
                i,
                ii,
                exp,
                expInfo;

            for (i = 0, ii = this.allArgs.length; i < ii; ++i) {
              exp = this.allArgs[i];
              expInfo = exp.connect(binding, scope);

              if (expInfo.observer) {
                childObservers.push(expInfo.observer);
              }
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: this.evaluate(scope, binding.valueConverterLookupFunction),
              observer: observer
            };
          }
        }]);

        return ValueConverter;
      })(Expression);

      _export('ValueConverter', ValueConverter);

      Assign = (function (_Expression3) {
        function Assign(target, value) {
          _classCallCheck(this, Assign);

          _get(Object.getPrototypeOf(Assign.prototype), 'constructor', this).call(this);

          this.target = target;
          this.value = value;
        }

        _inherits(Assign, _Expression3);

        _createClass(Assign, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            return this.target.assign(scope, this.value.evaluate(scope, valueConverters));
          }
        }, {
          key: 'accept',
          value: function accept(vistor) {
            vistor.visitAssign(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            return { value: this.evaluate(scope, binding.valueConverterLookupFunction) };
          }
        }]);

        return Assign;
      })(Expression);

      _export('Assign', Assign);

      Conditional = (function (_Expression4) {
        function Conditional(condition, yes, no) {
          _classCallCheck(this, Conditional);

          _get(Object.getPrototypeOf(Conditional.prototype), 'constructor', this).call(this);

          this.condition = condition;
          this.yes = yes;
          this.no = no;
        }

        _inherits(Conditional, _Expression4);

        _createClass(Conditional, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            return !!this.condition.evaluate(scope) ? this.yes.evaluate(scope) : this.no.evaluate(scope);
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitConditional(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this2 = this;

            var conditionInfo = this.condition.connect(binding, scope),
                yesInfo = this.yes.connect(binding, scope),
                noInfo = this.no.connect(binding, scope),
                childObservers = [],
                observer;

            if (conditionInfo.observer) {
              childObservers.push(conditionInfo.observer);
            }

            if (yesInfo.observer) {
              childObservers.push(yesInfo.observer);
            }

            if (noInfo.observer) {
              childObservers.push(noInfo.observer);
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this2.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: !!conditionInfo.value ? yesInfo.value : noInfo.value,
              observer: observer
            };
          }
        }]);

        return Conditional;
      })(Expression);

      _export('Conditional', Conditional);

      AccessScope = (function (_Expression5) {
        function AccessScope(name) {
          _classCallCheck(this, AccessScope);

          _get(Object.getPrototypeOf(AccessScope.prototype), 'constructor', this).call(this);

          this.name = name;
          this.isAssignable = true;
        }

        _inherits(AccessScope, _Expression5);

        _createClass(AccessScope, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            return scope[this.name];
          }
        }, {
          key: 'assign',
          value: function assign(scope, value) {
            return scope[this.name] = value;
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitAccessScope(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var observer = binding.getObserver(scope, this.name);

            return {
              value: observer.getValue(),
              observer: observer
            };
          }
        }]);

        return AccessScope;
      })(Expression);

      _export('AccessScope', AccessScope);

      AccessMember = (function (_Expression6) {
        function AccessMember(object, name) {
          _classCallCheck(this, AccessMember);

          _get(Object.getPrototypeOf(AccessMember.prototype), 'constructor', this).call(this);

          this.object = object;
          this.name = name;
          this.isAssignable = true;
        }

        _inherits(AccessMember, _Expression6);

        _createClass(AccessMember, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            var instance = this.object.evaluate(scope, valueConverters);
            return instance === null || instance === undefined ? instance : instance[this.name];
          }
        }, {
          key: 'assign',
          value: function assign(scope, value) {
            var instance = this.object.evaluate(scope);

            if (instance === null || instance === undefined) {
              instance = {};
              this.object.assign(scope, instance);
            }

            return instance[this.name] = value;
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitAccessMember(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this3 = this;

            var info = this.object.connect(binding, scope),
                objectInstance = info.value,
                objectObserver = info.observer,
                observer;

            if (objectObserver) {
              observer = new PathObserver(objectObserver, function (value) {
                if (value == null || value == undefined) {
                  return value;
                }

                return binding.getObserver(value, _this3.name);
              }, objectInstance);
            } else {
              observer = binding.getObserver(objectInstance, this.name);
            }

            return {
              value: objectInstance == null ? null : objectInstance[this.name],
              observer: observer
            };
          }
        }]);

        return AccessMember;
      })(Expression);

      _export('AccessMember', AccessMember);

      AccessKeyed = (function (_Expression7) {
        function AccessKeyed(object, key) {
          _classCallCheck(this, AccessKeyed);

          _get(Object.getPrototypeOf(AccessKeyed.prototype), 'constructor', this).call(this);

          this.object = object;
          this.key = key;
          this.isAssignable = true;
        }

        _inherits(AccessKeyed, _Expression7);

        _createClass(AccessKeyed, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            var instance = this.object.evaluate(scope, valueConverters);
            var lookup = this.key.evaluate(scope, valueConverters);
            return getKeyed(instance, lookup);
          }
        }, {
          key: 'assign',
          value: function assign(scope, value) {
            var instance = this.object.evaluate(scope);
            var lookup = this.key.evaluate(scope);
            return setKeyed(instance, lookup, value);
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitAccessKeyed(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this4 = this;

            var objectInfo = this.object.connect(binding, scope),
                keyInfo = this.key.connect(binding, scope),
                childObservers = [],
                observer;

            if (objectInfo.observer) {
              childObservers.push(objectInfo.observer);
            }

            if (keyInfo.observer) {
              childObservers.push(keyInfo.observer);
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this4.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: this.evaluate(scope, binding.valueConverterLookupFunction),
              observer: observer
            };
          }
        }]);

        return AccessKeyed;
      })(Expression);

      _export('AccessKeyed', AccessKeyed);

      CallScope = (function (_Expression8) {
        function CallScope(name, args) {
          _classCallCheck(this, CallScope);

          _get(Object.getPrototypeOf(CallScope.prototype), 'constructor', this).call(this);

          this.name = name;
          this.args = args;
        }

        _inherits(CallScope, _Expression8);

        _createClass(CallScope, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters, args) {
            args = args || evalList(scope, this.args, valueConverters);
            return ensureFunctionFromMap(scope, this.name).apply(scope, args);
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitCallScope(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this5 = this;

            var observer,
                childObservers = [],
                i,
                ii,
                exp,
                expInfo;

            for (i = 0, ii = this.args.length; i < ii; ++i) {
              exp = this.args[i];
              expInfo = exp.connect(binding, scope);

              if (expInfo.observer) {
                childObservers.push(expInfo.observer);
              }
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this5.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: this.evaluate(scope, binding.valueConverterLookupFunction),
              observer: observer
            };
          }
        }]);

        return CallScope;
      })(Expression);

      _export('CallScope', CallScope);

      CallMember = (function (_Expression9) {
        function CallMember(object, name, args) {
          _classCallCheck(this, CallMember);

          _get(Object.getPrototypeOf(CallMember.prototype), 'constructor', this).call(this);

          this.object = object;
          this.name = name;
          this.args = args;
        }

        _inherits(CallMember, _Expression9);

        _createClass(CallMember, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters, args) {
            var instance = this.object.evaluate(scope, valueConverters);
            args = args || evalList(scope, this.args, valueConverters);
            return ensureFunctionFromMap(instance, this.name).apply(instance, args);
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitCallMember(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this6 = this;

            var observer,
                objectInfo = this.object.connect(binding, scope),
                childObservers = [],
                i,
                ii,
                exp,
                expInfo;

            if (objectInfo.observer) {
              childObservers.push(objectInfo.observer);
            }

            for (i = 0, ii = this.args.length; i < ii; ++i) {
              exp = this.args[i];
              expInfo = exp.connect(binding, scope);

              if (expInfo.observer) {
                childObservers.push(expInfo.observer);
              }
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this6.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: this.evaluate(scope, binding.valueConverterLookupFunction),
              observer: observer
            };
          }
        }]);

        return CallMember;
      })(Expression);

      _export('CallMember', CallMember);

      CallFunction = (function (_Expression10) {
        function CallFunction(func, args) {
          _classCallCheck(this, CallFunction);

          _get(Object.getPrototypeOf(CallFunction.prototype), 'constructor', this).call(this);

          this.func = func;
          this.args = args;
        }

        _inherits(CallFunction, _Expression10);

        _createClass(CallFunction, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters, args) {
            var func = this.func.evaluate(scope, valueConverters);

            if (typeof func !== 'function') {
              throw new Error('' + this.func + ' is not a function');
            } else {
              return func.apply(null, args || evalList(scope, this.args, valueConverters));
            }
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitCallFunction(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this7 = this;

            var observer,
                funcInfo = this.func.connect(binding, scope),
                childObservers = [],
                i,
                ii,
                exp,
                expInfo;

            if (funcInfo.observer) {
              childObservers.push(funcInfo.observer);
            }

            for (i = 0, ii = this.args.length; i < ii; ++i) {
              exp = this.args[i];
              expInfo = exp.connect(binding, scope);

              if (expInfo.observer) {
                childObservers.push(expInfo.observer);
              }
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this7.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: this.evaluate(scope, binding.valueConverterLookupFunction),
              observer: observer
            };
          }
        }]);

        return CallFunction;
      })(Expression);

      _export('CallFunction', CallFunction);

      Binary = (function (_Expression11) {
        function Binary(operation, left, right) {
          _classCallCheck(this, Binary);

          _get(Object.getPrototypeOf(Binary.prototype), 'constructor', this).call(this);

          this.operation = operation;
          this.left = left;
          this.right = right;
        }

        _inherits(Binary, _Expression11);

        _createClass(Binary, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            var left = this.left.evaluate(scope);

            switch (this.operation) {
              case '&&':
                return !!left && !!this.right.evaluate(scope);
              case '||':
                return !!left || !!this.right.evaluate(scope);
            }

            var right = this.right.evaluate(scope);

            switch (this.operation) {
              case '==':
                return left == right;
              case '===':
                return left === right;
              case '!=':
                return left != right;
              case '!==':
                return left !== right;
            }

            if (left === null || right === null) {
              switch (this.operation) {
                case '+':
                  if (left != null) {
                    return left;
                  }if (right != null) {
                    return right;
                  }return 0;
                case '-':
                  if (left != null) {
                    return left;
                  }if (right != null) {
                    return 0 - right;
                  }return 0;
              }

              return null;
            }

            switch (this.operation) {
              case '+':
                return autoConvertAdd(left, right);
              case '-':
                return left - right;
              case '*':
                return left * right;
              case '/':
                return left / right;
              case '%':
                return left % right;
              case '<':
                return left < right;
              case '>':
                return left > right;
              case '<=':
                return left <= right;
              case '>=':
                return left >= right;
              case '^':
                return left ^ right;
              case '&':
                return left & right;
            }

            throw new Error('Internal error [' + this.operation + '] not handled');
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitBinary(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this8 = this;

            var leftInfo = this.left.connect(binding, scope),
                rightInfo = this.right.connect(binding, scope),
                childObservers = [],
                observer;

            if (leftInfo.observer) {
              childObservers.push(leftInfo.observer);
            }

            if (rightInfo.observer) {
              childObservers.push(rightInfo.observer);
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this8.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: this.evaluate(scope, binding.valueConverterLookupFunction),
              observer: observer
            };
          }
        }]);

        return Binary;
      })(Expression);

      _export('Binary', Binary);

      PrefixNot = (function (_Expression12) {
        function PrefixNot(operation, expression) {
          _classCallCheck(this, PrefixNot);

          _get(Object.getPrototypeOf(PrefixNot.prototype), 'constructor', this).call(this);

          this.operation = operation;
          this.expression = expression;
        }

        _inherits(PrefixNot, _Expression12);

        _createClass(PrefixNot, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            return !this.expression.evaluate(scope);
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitPrefix(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this9 = this;

            var info = this.expression.connect(binding, scope),
                observer;

            if (info.observer) {
              observer = new CompositeObserver([info.observer], function () {
                return _this9.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: !info.value,
              observer: observer
            };
          }
        }]);

        return PrefixNot;
      })(Expression);

      _export('PrefixNot', PrefixNot);

      LiteralPrimitive = (function (_Expression13) {
        function LiteralPrimitive(value) {
          _classCallCheck(this, LiteralPrimitive);

          _get(Object.getPrototypeOf(LiteralPrimitive.prototype), 'constructor', this).call(this);

          this.value = value;
        }

        _inherits(LiteralPrimitive, _Expression13);

        _createClass(LiteralPrimitive, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            return this.value;
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitLiteralPrimitive(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            return { value: this.value };
          }
        }]);

        return LiteralPrimitive;
      })(Expression);

      _export('LiteralPrimitive', LiteralPrimitive);

      LiteralString = (function (_Expression14) {
        function LiteralString(value) {
          _classCallCheck(this, LiteralString);

          _get(Object.getPrototypeOf(LiteralString.prototype), 'constructor', this).call(this);

          this.value = value;
        }

        _inherits(LiteralString, _Expression14);

        _createClass(LiteralString, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            return this.value;
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitLiteralString(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            return { value: this.value };
          }
        }]);

        return LiteralString;
      })(Expression);

      _export('LiteralString', LiteralString);

      LiteralArray = (function (_Expression15) {
        function LiteralArray(elements) {
          _classCallCheck(this, LiteralArray);

          _get(Object.getPrototypeOf(LiteralArray.prototype), 'constructor', this).call(this);

          this.elements = elements;
        }

        _inherits(LiteralArray, _Expression15);

        _createClass(LiteralArray, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            var elements = this.elements,
                length = elements.length,
                result = [],
                i;

            for (i = 0; i < length; ++i) {
              result[i] = elements[i].evaluate(scope, valueConverters);
            }

            return result;
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitLiteralArray(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this10 = this;

            var observer,
                childObservers = [],
                results = [],
                i,
                ii,
                exp,
                expInfo;

            for (i = 0, ii = this.elements.length; i < ii; ++i) {
              exp = this.elements[i];
              expInfo = exp.connect(binding, scope);

              if (expInfo.observer) {
                childObservers.push(expInfo.observer);
              }

              results[i] = expInfo.value;
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this10.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: results,
              observer: observer
            };
          }
        }]);

        return LiteralArray;
      })(Expression);

      _export('LiteralArray', LiteralArray);

      LiteralObject = (function (_Expression16) {
        function LiteralObject(keys, values) {
          _classCallCheck(this, LiteralObject);

          _get(Object.getPrototypeOf(LiteralObject.prototype), 'constructor', this).call(this);

          this.keys = keys;
          this.values = values;
        }

        _inherits(LiteralObject, _Expression16);

        _createClass(LiteralObject, [{
          key: 'evaluate',
          value: function evaluate(scope, valueConverters) {
            var instance = {},
                keys = this.keys,
                values = this.values,
                length = keys.length,
                i;

            for (i = 0; i < length; ++i) {
              instance[keys[i]] = values[i].evaluate(scope, valueConverters);
            }

            return instance;
          }
        }, {
          key: 'accept',
          value: function accept(visitor) {
            visitor.visitLiteralObject(this);
          }
        }, {
          key: 'connect',
          value: function connect(binding, scope) {
            var _this11 = this;

            var observer,
                childObservers = [],
                instance = {},
                keys = this.keys,
                values = this.values,
                length = keys.length,
                i,
                valueInfo;

            for (i = 0; i < length; ++i) {
              valueInfo = values[i].connect(binding, scope);

              if (valueInfo.observer) {
                childObservers.push(valueInfo.observer);
              }

              instance[keys[i]] = valueInfo.value;
            }

            if (childObservers.length) {
              observer = new CompositeObserver(childObservers, function () {
                return _this11.evaluate(scope, binding.valueConverterLookupFunction);
              });
            }

            return {
              value: instance,
              observer: observer
            };
          }
        }]);

        return LiteralObject;
      })(Expression);

      _export('LiteralObject', LiteralObject);

      Unparser = (function () {
        function Unparser(buffer) {
          _classCallCheck(this, Unparser);

          this.buffer = buffer;
        }

        _createClass(Unparser, [{
          key: 'write',
          value: function write(text) {
            this.buffer.push(text);
          }
        }, {
          key: 'writeArgs',
          value: function writeArgs(args) {
            var i, length;

            this.write('(');

            for (i = 0, length = args.length; i < length; ++i) {
              if (i !== 0) {
                this.write(',');
              }

              args[i].accept(this);
            }

            this.write(')');
          }
        }, {
          key: 'visitChain',
          value: function visitChain(chain) {
            var expressions = chain.expressions,
                length = expressions.length,
                i;

            for (i = 0; i < length; ++i) {
              if (i !== 0) {
                this.write(';');
              }

              expressions[i].accept(this);
            }
          }
        }, {
          key: 'visitValueConverter',
          value: function visitValueConverter(converter) {
            var args = converter.args,
                length = args.length,
                i;

            this.write('(');
            converter.expression.accept(this);
            this.write('|' + converter.name);

            for (i = 0; i < length; ++i) {
              this.write(' :');
              args[i].accept(this);
            }

            this.write(')');
          }
        }, {
          key: 'visitAssign',
          value: function visitAssign(assign) {
            assign.target.accept(this);
            this.write('=');
            assign.value.accept(this);
          }
        }, {
          key: 'visitConditional',
          value: function visitConditional(conditional) {
            conditional.condition.accept(this);
            this.write('?');
            conditional.yes.accept(this);
            this.write(':');
            conditional.no.accept(this);
          }
        }, {
          key: 'visitAccessScope',
          value: function visitAccessScope(access) {
            this.write(access.name);
          }
        }, {
          key: 'visitAccessMember',
          value: function visitAccessMember(access) {
            access.object.accept(this);
            this.write('.' + access.name);
          }
        }, {
          key: 'visitAccessKeyed',
          value: function visitAccessKeyed(access) {
            access.object.accept(this);
            this.write('[');
            access.key.accept(this);
            this.write(']');
          }
        }, {
          key: 'visitCallScope',
          value: function visitCallScope(call) {
            this.write(call.name);
            this.writeArgs(call.args);
          }
        }, {
          key: 'visitCallFunction',
          value: function visitCallFunction(call) {
            call.func.accept(this);
            this.writeArgs(call.args);
          }
        }, {
          key: 'visitCallMember',
          value: function visitCallMember(call) {
            call.object.accept(this);
            this.write('.' + call.name);
            this.writeArgs(call.args);
          }
        }, {
          key: 'visitPrefix',
          value: function visitPrefix(prefix) {
            this.write('(' + prefix.operation);
            prefix.expression.accept(this);
            this.write(')');
          }
        }, {
          key: 'visitBinary',
          value: function visitBinary(binary) {
            this.write('(');
            binary.left.accept(this);
            this.write(binary.operation);
            binary.right.accept(this);
            this.write(')');
          }
        }, {
          key: 'visitLiteralPrimitive',
          value: function visitLiteralPrimitive(literal) {
            this.write('' + literal.value);
          }
        }, {
          key: 'visitLiteralArray',
          value: function visitLiteralArray(literal) {
            var elements = literal.elements,
                length = elements.length,
                i;

            this.write('[');

            for (i = 0; i < length; ++i) {
              if (i !== 0) {
                this.write(',');
              }

              elements[i].accept(this);
            }

            this.write(']');
          }
        }, {
          key: 'visitLiteralObject',
          value: function visitLiteralObject(literal) {
            var keys = literal.keys,
                values = literal.values,
                length = keys.length,
                i;

            this.write('{');

            for (i = 0; i < length; ++i) {
              if (i !== 0) {
                this.write(',');
              }

              this.write('\'' + keys[i] + '\':');
              values[i].accept(this);
            }

            this.write('}');
          }
        }, {
          key: 'visitLiteralString',
          value: function visitLiteralString(literal) {
            var escaped = literal.value.replace(/'/g, '\'');
            this.write('\'' + escaped + '\'');
          }
        }], [{
          key: 'unparse',
          value: function unparse(expression) {
            var buffer = [],
                visitor = new Unparser(buffer);

            expression.accept(visitor);

            return buffer.join('');
          }
        }]);

        return Unparser;
      })();

      _export('Unparser', Unparser);

      evalListCache = [[], [0], [0, 0], [0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0, 0]];
    }
  };
});