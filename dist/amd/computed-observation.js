define(['exports'], function (exports) {
  'use strict';

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  exports.hasDeclaredDependencies = hasDeclaredDependencies;
  exports.declarePropertyDependencies = declarePropertyDependencies;

  var ComputedPropertyObserver = (function () {
    function ComputedPropertyObserver(obj, propertyName, descriptor, observerLocator) {
      _classCallCheck(this, ComputedPropertyObserver);

      this.obj = obj;
      this.propertyName = propertyName;
      this.descriptor = descriptor;
      this.observerLocator = observerLocator;
      this.callbacks = [];
    }

    _createClass(ComputedPropertyObserver, [{
      key: 'getValue',
      value: function getValue() {
        return this.obj[this.propertyName];
      }
    }, {
      key: 'setValue',
      value: function setValue(newValue) {
        throw new Error('Computed properties cannot be assigned.');
      }
    }, {
      key: 'trigger',
      value: function trigger(newValue, oldValue) {
        var callbacks = this.callbacks,
            i = callbacks.length;

        while (i--) {
          callbacks[i](newValue, oldValue);
        }
      }
    }, {
      key: 'evaluate',
      value: function evaluate() {
        var newValue = this.getValue();
        if (this.oldValue === newValue) {
          return;
        }this.trigger(newValue, this.oldValue);
        this.oldValue = newValue;
      }
    }, {
      key: 'subscribe',
      value: function subscribe(callback) {
        var _this = this;

        var dependencies, i, ii;

        this.callbacks.push(callback);

        if (this.oldValue === undefined) {
          this.oldValue = this.getValue();
          this.subscriptions = [];

          dependencies = this.descriptor.get.dependencies;
          for (i = 0, ii = dependencies.length; i < ii; i++) {
            this.subscriptions.push(this.observerLocator.getObserver(this.obj, dependencies[i]).subscribe(function () {
              return _this.evaluate();
            }));
          }
        }

        return function () {
          _this.callbacks.splice(_this.callbacks.indexOf(callback), 1);
          if (_this.callbacks.length > 0) return;
          while (_this.subscriptions.length) {
            _this.subscriptions.pop()();
          }
          _this.oldValue = undefined;
        };
      }
    }]);

    return ComputedPropertyObserver;
  })();

  exports.ComputedPropertyObserver = ComputedPropertyObserver;

  function hasDeclaredDependencies(descriptor) {
    return descriptor && descriptor.get && !descriptor.set && descriptor.get.dependencies && descriptor.get.dependencies.length;
  }

  function declarePropertyDependencies(ctor, propertyName, dependencies) {
    var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
    if (descriptor.set) throw new Error('The property cannot have a setter function.');
    descriptor.get.dependencies = dependencies;
  }
});