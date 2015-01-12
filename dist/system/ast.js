System.register(["./path-observer", "./composite-observer", "./expressions/ast"], function (_export) {
  "use strict";

  var PathObserver, CompositeObserver, ValueConverter, Assign, Conditional, AccessScope, AccessMember, AccessKeyed, CallScope, CallMember, CallFunction, Binary, PrefixNot, LiteralPrimitive, LiteralString, LiteralArray, LiteralObject;
  _export("patchAST", patchAST);

  function patchAST() {
    ValueConverter.prototype.connect = function (binding, scope) {
      var _this = this;
      var observer, childObservers = [], i, ii, exp, expInfo;

      for (i = 0, ii = this.allArgs.length; i < ii; ++i) {
        exp = this.allArgs[i];
        expInfo = exp.connect(binding, scope);

        if (expInfo.observer) {
          childObservers.push(expInfo.observer);
        }
      }

      if (childObservers.length) {
        observer = new CompositeObserver(childObservers, function () {
          return _this.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: this.eval(scope, binding.valueConverterLookupFunction),
        observer: observer
      };
    };

    Assign.prototype.connect = function (binding, scope) {
      return { value: this.eval(scope, binding.valueConverterLookupFunction) };
    };

    Conditional.prototype.connect = function (binding, scope) {
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
          return _this2.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: !!conditionInfo.value ? yesInfo.value : noInfo.value,
        observer: observer
      };
    };

    AccessScope.prototype.connect = function (binding, scope) {
      var observer = binding.getObserver(scope, this.name);

      return {
        value: observer.getValue(),
        observer: observer
      };
    };

    AccessMember.prototype.connect = function (binding, scope) {
      var _this3 = this;
      var info = this.object.connect(binding, scope),
          objectInstance = info.value,
          objectObserver = info.observer,
          observer;

      if (objectObserver) {
        observer = new PathObserver(objectObserver, function (value) {
          if (value == null) {
            return null;
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
    };

    AccessKeyed.prototype.connect = function (binding, scope) {
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
          return _this4.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: this.eval(scope, binding.valueConverterLookupFunction),
        observer: observer
      };
    };

    CallScope.prototype.connect = function (binding, scope) {
      var _this5 = this;
      var observer, childObservers = [], i, ii, exp, expInfo;

      for (i = 0, ii = this.args.length; i < ii; ++i) {
        exp = this.args[i];
        expInfo = exp.connect(binding, scope);

        if (expInfo.observer) {
          childObservers.push(expInfo.observer);
        }
      }

      if (childObservers.length) {
        observer = new CompositeObserver(childObservers, function () {
          return _this5.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: this.eval(scope, binding.valueConverterLookupFunction),
        observer: observer
      };
    };

    CallMember.prototype.connect = function (binding, scope) {
      var _this6 = this;
      var observer, objectInfo = this.object.connect(binding, scope), childObservers = [], i, ii, exp, expInfo;

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
          return _this6.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: this.eval(scope, binding.valueConverterLookupFunction),
        observer: observer
      };
    };

    CallFunction.prototype.connect = function (binding, scope) {
      var _this7 = this;
      var observer, funcInfo = this.func.connect(binding, scope), childObservers = [], i, ii, exp, expInfo;

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
          return _this7.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: this.eval(scope, binding.valueConverterLookupFunction),
        observer: observer
      };
    };

    Binary.prototype.connect = function (binding, scope) {
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
          return _this8.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: this.eval(scope, binding.valueConverterLookupFunction),
        observer: observer
      };
    };

    PrefixNot.prototype.connect = function (binding, scope) {
      var _this9 = this;
      var info = this.expression.connect(binding, scope), observer;

      if (info.observer) {
        observer = new CompositeObserver([info.observer], function () {
          return _this9.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: !info.value,
        observer: observer
      };
    };

    LiteralPrimitive.prototype.connect = function (binding, scope) {
      return { value: this.value };
    };

    LiteralString.prototype.connect = function (binding, scope) {
      return { value: this.value };
    };

    LiteralArray.prototype.connect = function (binding, value) {
      var _this10 = this;
      var observer, childObservers = [], results = [], i, ii, exp, expInfo;

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
          return _this10.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: results,
        observer: observer
      };
    };

    LiteralObject.prototype.connect = function (binding, value) {
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
          return _this11.eval(scope, binding.valueConverterLookupFunction);
        });
      }

      return {
        value: instance,
        observer: observer
      };
    };
  }
  return {
    setters: [function (_pathObserver) {
      PathObserver = _pathObserver.PathObserver;
    }, function (_compositeObserver) {
      CompositeObserver = _compositeObserver.CompositeObserver;
    }, function (_expressionsAst) {
      ValueConverter = _expressionsAst.ValueConverter;
      Assign = _expressionsAst.Assign;
      Conditional = _expressionsAst.Conditional;
      AccessScope = _expressionsAst.AccessScope;
      AccessMember = _expressionsAst.AccessMember;
      AccessKeyed = _expressionsAst.AccessKeyed;
      CallScope = _expressionsAst.CallScope;
      CallMember = _expressionsAst.CallMember;
      CallFunction = _expressionsAst.CallFunction;
      Binary = _expressionsAst.Binary;
      PrefixNot = _expressionsAst.PrefixNot;
      LiteralPrimitive = _expressionsAst.LiteralPrimitive;
      LiteralString = _expressionsAst.LiteralString;
      LiteralArray = _expressionsAst.LiteralArray;
      LiteralObject = _expressionsAst.LiteralObject;
    }],
    execute: function () {}
  };
});