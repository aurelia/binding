define(['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.App = undefined;

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

  var _dec, _class, _desc, _value, _class2, _descriptor;

  var App = exports.App = (_dec = (0, _aureliaFramework.inject)(_aureliaFramework.Parser), _dec(_class = (_class2 = function () {
    function App(parser) {
      _classCallCheck(this, App);

      _initDefineProp(this, 'expressionString', _descriptor, this);

      this.value = null;
      this.examples = [{ name: 'Basic Property', expression: 'firstName' }, { name: 'Property Path', expression: 'person.firstName' }, { name: 'Conditional', expression: 'isActive ? \'active\' : \'\'' }, { name: 'Array Index', expression: 'myArray[index]' }, { name: 'Binary', expression: 'x * y' }, { name: 'Object Literal', expression: '{ x: 3, y: height, z: depth }' }, { name: 'Literal Array', expression: '[a, 1, \'hello\', null, undefined]' }, { name: 'Call Method', expression: 'save(entity)' }, { name: 'Assignment', expression: 'width = rangeInput.value' }, { name: 'Value Converter', expression: 'startDate | dateFormat:\'MM/dd/yyyy\'' }, { name: 'Binding Behavior', expression: 'lastName & updateTrigger:\'blur\'' }, { name: 'Kitchen Sink', expression: 'getPosts({ start: minDate, end: maxDate })[0].timestamp | timeAgo & signal:\'tick\'' }];

      this.parser = parser;
      this.expressionString = '';
    }

    App.prototype.expressionStringChanged = function expressionStringChanged(newValue, oldValue) {
      this.error = '';
      this.expression = null;

      try {
        var value = { role: 'Root', expression: this.parser.parse(newValue) };
        if (value.expression instanceof _aureliaFramework.Chain) {
          value = null;
        }
        this.value = value;
      } catch (e) {
        this.value = null;
        this.error = e.toString();
      }
    };

    return App;
  }(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'expressionString', [_aureliaFramework.observable], {
    enumerable: true,
    initializer: null
  })), _class2)) || _class);
});