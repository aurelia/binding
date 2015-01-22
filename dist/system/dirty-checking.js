System.register([], function (_export) {
  "use strict";

  var _prototypeProperties, DirtyChecker, DirtyCheckProperty;
  return {
    setters: [],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      DirtyChecker = (function () {
        function DirtyChecker() {
          this.tracked = [];
          this.checkDelay = 120;
        }

        _prototypeProperties(DirtyChecker, null, {
          addProperty: {
            value: function addProperty(property) {
              var tracked = this.tracked;

              tracked.push(property);

              if (tracked.length === 1) {
                this.scheduleDirtyCheck();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          removeProperty: {
            value: function removeProperty(property) {
              var tracked = this.tracked;
              tracked.splice(tracked.indexOf(property), 1);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          scheduleDirtyCheck: {
            value: function scheduleDirtyCheck() {
              var _this = this;
              setTimeout(function () {
                return _this.check();
              }, this.checkDelay);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          check: {
            value: function check() {
              var tracked = this.tracked,
                  i = tracked.length;

              while (i--) {
                var current = tracked[i];

                if (current.isDirty()) {
                  current.call();
                }
              }

              if (tracked.length) {
                this.scheduleDirtyCheck();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return DirtyChecker;
      })();
      _export("DirtyChecker", DirtyChecker);

      DirtyCheckProperty = (function () {
        function DirtyCheckProperty(dirtyChecker, obj, propertyName) {
          this.dirtyChecker = dirtyChecker;
          this.obj = obj;
          this.propertyName = propertyName;
          this.callbacks = [];
          this.isSVG = obj instanceof SVGElement;
        }

        _prototypeProperties(DirtyCheckProperty, null, {
          getValue: {
            value: function getValue() {
              return this.obj[this.propertyName];
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              if (this.isSVG) {
                this.obj.setAttributeNS(null, this.propertyName, newValue);
              } else {
                this.obj[this.propertyName] = newValue;
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          call: {
            value: function call() {
              var callbacks = this.callbacks,
                  i = callbacks.length,
                  oldValue = this.oldValue,
                  newValue = this.getValue();

              while (i--) {
                callbacks[i](newValue, oldValue);
              }

              this.oldValue = newValue;
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          isDirty: {
            value: function isDirty() {
              return this.oldValue !== this.getValue();
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          beginTracking: {
            value: function beginTracking() {
              this.tracking = true;
              this.oldValue = this.newValue = this.getValue();
              this.dirtyChecker.addProperty(this);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          endTracking: {
            value: function endTracking() {
              this.tracking = false;
              this.dirtyChecker.removeProperty(this);
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              var callbacks = this.callbacks,
                  that = this;

              callbacks.push(callback);

              if (!this.tracking) {
                this.beginTracking();
              }

              return function () {
                callbacks.splice(callbacks.indexOf(callback), 1);
                if (callbacks.length === 0) {
                  that.endTracking();
                }
              };
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return DirtyCheckProperty;
      })();
      _export("DirtyCheckProperty", DirtyCheckProperty);
    }
  };
});