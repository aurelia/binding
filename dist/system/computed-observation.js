System.register([], function (_export) {
  var _classCallCheck, ComputedPropertyObserver;

  _export('hasDeclaredDependencies', hasDeclaredDependencies);

  _export('declarePropertyDependencies', declarePropertyDependencies);

  function hasDeclaredDependencies(descriptor) {
    return descriptor && descriptor.get && !descriptor.set && descriptor.get.dependencies && descriptor.get.dependencies.length;
  }

  function declarePropertyDependencies(ctor, propertyName, dependencies) {
    var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
    if (descriptor.set) throw new Error('The property cannot have a setter function.');
    descriptor.get.dependencies = dependencies;
  }

  return {
    setters: [],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      ComputedPropertyObserver = (function () {
        function ComputedPropertyObserver(obj, propertyName, descriptor, observerLocator) {
          _classCallCheck(this, ComputedPropertyObserver);

          this.obj = obj;
          this.propertyName = propertyName;
          this.descriptor = descriptor;
          this.observerLocator = observerLocator;
          this.callbacks = [];
        }

        ComputedPropertyObserver.prototype.getValue = function getValue() {
          return this.obj[this.propertyName];
        };

        ComputedPropertyObserver.prototype.setValue = function setValue(newValue) {
          throw new Error('Computed properties cannot be assigned.');
        };

        ComputedPropertyObserver.prototype.trigger = function trigger(newValue, oldValue) {
          var callbacks = this.callbacks,
              i = callbacks.length;

          while (i--) {
            callbacks[i](newValue, oldValue);
          }
        };

        ComputedPropertyObserver.prototype.evaluate = function evaluate() {
          var newValue = this.getValue();
          if (this.oldValue === newValue) {
            return;
          }this.trigger(newValue, this.oldValue);
          this.oldValue = newValue;
        };

        ComputedPropertyObserver.prototype.subscribe = function subscribe(callback) {
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
        };

        return ComputedPropertyObserver;
      })();

      _export('ComputedPropertyObserver', ComputedPropertyObserver);
    }
  };
});