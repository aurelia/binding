System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, ComputedPropertyObserver;

  _export("hasDeclaredDependencies", hasDeclaredDependencies);

  _export("declarePropertyDependencies", declarePropertyDependencies);

  function hasDeclaredDependencies(descriptor) {
    return descriptor && descriptor.get && !descriptor.set && descriptor.get.dependencies && descriptor.get.dependencies.length;
  }

  function declarePropertyDependencies(ctor, propertyName, dependencies) {
    var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
    if (descriptor.set) throw new Error("The property cannot have a setter function.");
    descriptor.get.dependencies = dependencies;
  }

  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      ComputedPropertyObserver = _export("ComputedPropertyObserver", (function () {
        function ComputedPropertyObserver(obj, propertyName, descriptor, observerLocator) {
          _classCallCheck(this, ComputedPropertyObserver);

          this.obj = obj;
          this.propertyName = propertyName;
          this.descriptor = descriptor;
          this.observerLocator = observerLocator;
          this.callbacks = [];
        }

        _prototypeProperties(ComputedPropertyObserver, null, {
          getValue: {
            value: function getValue() {
              return this.obj[this.propertyName];
            },
            writable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              throw new Error("Computed properties cannot be assigned.");
            },
            writable: true,
            configurable: true
          },
          trigger: {
            value: function trigger(newValue, oldValue) {
              var callbacks = this.callbacks,
                  i = callbacks.length;

              while (i--) {
                callbacks[i](newValue, oldValue);
              }
            },
            writable: true,
            configurable: true
          },
          evaluate: {
            value: function evaluate() {
              var newValue = this.getValue();
              if (this.oldValue === newValue) {
                return;
              }this.trigger(newValue, this.oldValue);
              this.oldValue = newValue;
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              var _this = this;

              var dependencies, i, ii;

              this.callbacks.push(callback);

              if (this.oldValue === undefined) {
                this.oldValue = this.getValue();
                this.subscriptions = [];

                dependencies = this.descriptor.get.dependencies;
                for (i = 0, ii = dependencies.length; i < ii; i++) {
                  // todo:  consider throwing when a dependency's observer is an instance of DirtyCheckProperty.
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
            },
            writable: true,
            configurable: true
          }
        });

        return ComputedPropertyObserver;
      })());
    }
  };
});