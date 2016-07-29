define(['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Expression = undefined;

  function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable,
      writable: descriptor.writable,
      value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
      desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
      desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
      return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
      desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
      desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
      Object['define' + 'Property'](target, property, desc);
      desc = null;
    }

    return desc;
  }

  function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
  }

  var _class, _desc, _value, _class2, _descriptor;

  var Expression = exports.Expression = (0, _aureliaFramework.containerless)(_class = (_class2 = function () {
    function Expression() {
      _classCallCheck(this, Expression);

      _initDefineProp(this, 'value', _descriptor, this);

      this.type = null;
      this.children = null;
    }

    Expression.prototype.valueChanged = function valueChanged(_ref) {
      var role = _ref.role;
      var expression = _ref.expression;

      if (expression instanceof _aureliaFramework.AccessThis) {
        this.type = 'AccessThis';
        this.children = null;
      } else if (expression instanceof _aureliaFramework.AccessScope) {
        this.type = 'AccessScope';
        this.children = null;
      } else if (expression instanceof _aureliaFramework.AccessMember) {
        this.type = 'AccessMember';
        this.children = [{ role: 'Object', expression: expression.object }];
      } else if (expression instanceof _aureliaFramework.AccessKeyed) {
        this.type = 'AccessKeyed';
        this.children = [{ role: 'Object', expression: expression.object }, { role: 'Key', expression: expression.key }];
      } else if (expression instanceof _aureliaFramework.Assign) {
        this.type = 'Assign';
        this.children = [{ role: 'Target', expression: expression.target }, { role: 'Value', expression: expression.value }];
      } else if (expression instanceof _aureliaFramework.Binary) {
        this.type = 'Binary';
        this.children = [{ role: 'Left', expression: expression.left }, { role: 'Right', expression: expression.right }];
      } else if (expression instanceof _aureliaFramework.BindingBehavior) {
        this.type = 'BindingBehavior';
        this.children = [{ role: 'Target', expression: expression.expression }].concat(expression.args.map(function (x) {
          return { role: 'Argument', expression: x };
        }));
      } else if (expression instanceof _aureliaFramework.CallFunction) {
        this.type = 'CallFunction';
        this.children = [{ role: 'Function', expression: expression.func }].concat(expression.args.map(function (x) {
          return { role: 'Argument', expression: x };
        }));
      } else if (expression instanceof _aureliaFramework.CallMember) {
        this.type = 'CallMember';
        this.children = [{ role: 'Object', expression: expression.object }].concat(expression.args.map(function (x) {
          return { role: 'Argument', expression: x };
        }));
      } else if (expression instanceof _aureliaFramework.CallScope) {
        this.type = 'CallScope';
        this.children = expression.args.map(function (x) {
          return { role: 'Argument', expression: x };
        });
      } else if (expression instanceof _aureliaFramework.Conditional) {
        this.type = 'Conditional';
        this.children = [{ role: 'Condition', expression: expression.condition }, { role: 'True-Value', expression: expression.yes }, { role: 'False-Value', expression: expression.no }];
      } else if (expression instanceof _aureliaFramework.LiteralPrimitive) {
        this.type = 'LiteralPrimitive';
        this.children = null;
      } else if (expression instanceof _aureliaFramework.LiteralString) {
        this.type = 'LiteralString';
        this.children = null;
      } else if (expression instanceof _aureliaFramework.LiteralArray) {
        this.type = 'LiteralArray';
        this.children = expression.elements.map(function (x) {
          return { role: 'Element', expression: x };
        });
      } else if (expression instanceof _aureliaFramework.LiteralObject) {
        this.type = 'LiteralObject';
        this.children = expression.values.map(function (x) {
          return { role: 'Property Value', expression: x };
        });
      } else if (expression instanceof _aureliaFramework.PrefixNot) {
        this.type = 'PrefixNot';
        this.children = [{ role: 'Target', expression: expression.expression }];
      } else if (expression instanceof _aureliaFramework.ValueConverter) {
        this.type = 'ValueConverter';
        this.children = [{ role: 'Target', expression: expression.allArgs[0] }].concat(expression.args.map(function (x) {
          return { role: 'Argument', expression: x };
        }));
      } else {
        this.type = 'Unknown';
        this.children = null;
      }
    };

    return Expression;
  }(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'value', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
  })), _class2)) || _class;
});