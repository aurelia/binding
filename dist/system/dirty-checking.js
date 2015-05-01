System.register([], function (_export) {
  var _classCallCheck, DirtyChecker, DirtyCheckProperty;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      DirtyChecker = (function () {
        function DirtyChecker() {
          _classCallCheck(this, DirtyChecker);

          this.tracked = [];
          this.checkDelay = 120;
        }

        DirtyChecker.prototype.addProperty = function addProperty(property) {
          var tracked = this.tracked;

          tracked.push(property);

          if (tracked.length === 1) {
            this.scheduleDirtyCheck();
          }
        };

        DirtyChecker.prototype.removeProperty = function removeProperty(property) {
          var tracked = this.tracked;
          tracked.splice(tracked.indexOf(property), 1);
        };

        DirtyChecker.prototype.scheduleDirtyCheck = function scheduleDirtyCheck() {
          var _this = this;

          setTimeout(function () {
            return _this.check();
          }, this.checkDelay);
        };

        DirtyChecker.prototype.check = function check() {
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
        };

        return DirtyChecker;
      })();

      _export("DirtyChecker", DirtyChecker);

      DirtyCheckProperty = (function () {
        function DirtyCheckProperty(dirtyChecker, obj, propertyName) {
          _classCallCheck(this, DirtyCheckProperty);

          this.dirtyChecker = dirtyChecker;
          this.obj = obj;
          this.propertyName = propertyName;
          this.callbacks = [];
          this.isSVG = obj instanceof SVGElement;
        }

        DirtyCheckProperty.prototype.getValue = function getValue() {
          return this.obj[this.propertyName];
        };

        DirtyCheckProperty.prototype.setValue = function setValue(newValue) {
          if (this.isSVG) {
            this.obj.setAttributeNS(null, this.propertyName, newValue);
          } else {
            this.obj[this.propertyName] = newValue;
          }
        };

        DirtyCheckProperty.prototype.call = function call() {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.oldValue,
              newValue = this.getValue();

          while (i--) {
            callbacks[i](newValue, oldValue);
          }

          this.oldValue = newValue;
        };

        DirtyCheckProperty.prototype.isDirty = function isDirty() {
          return this.oldValue !== this.getValue();
        };

        DirtyCheckProperty.prototype.beginTracking = function beginTracking() {
          this.tracking = true;
          this.oldValue = this.newValue = this.getValue();
          this.dirtyChecker.addProperty(this);
        };

        DirtyCheckProperty.prototype.endTracking = function endTracking() {
          this.tracking = false;
          this.dirtyChecker.removeProperty(this);
        };

        DirtyCheckProperty.prototype.subscribe = function subscribe(callback) {
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
        };

        return DirtyCheckProperty;
      })();

      _export("DirtyCheckProperty", DirtyCheckProperty);
    }
  };
});