System.register([], function (_export) {
  "use strict";

  var DirtyChecker, DirtyCheckProperty;
  return {
    setters: [],
    execute: function () {
      DirtyChecker = function DirtyChecker() {
        this.tracked = [];
        this.checkDelay = 120;
      };

      DirtyChecker.prototype.addProperty = function (property) {
        var tracked = this.tracked;

        tracked.push(property);

        if (tracked.length === 1) {
          this.scheduleDirtyCheck();
        }
      };

      DirtyChecker.prototype.removeProperty = function (property) {
        var tracked = this.tracked;
        tracked.splice(tracked.indexOf(property), 1);
      };

      DirtyChecker.prototype.scheduleDirtyCheck = function () {
        var _this = this;
        setTimeout(function () {
          return _this.check();
        }, this.checkDelay);
      };

      DirtyChecker.prototype.check = function () {
        var tracked = this.tracked, i = tracked.length;

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

      _export("DirtyChecker", DirtyChecker);

      DirtyCheckProperty = function DirtyCheckProperty(dirtyChecker, obj, propertyName) {
        this.dirtyChecker = dirtyChecker;
        this.obj = obj;
        this.propertyName = propertyName;
        this.callbacks = [];
        this.isSVG = obj instanceof SVGElement;
      };

      DirtyCheckProperty.prototype.getValue = function () {
        return this.obj[this.propertyName];
      };

      DirtyCheckProperty.prototype.setValue = function (newValue) {
        if (this.isSVG) {
          this.obj.setAttributeNS(null, this.propertyName, newValue);
        } else {
          this.obj[this.propertyName] = newValue;
        }
      };

      DirtyCheckProperty.prototype.call = function () {
        var callbacks = this.callbacks, i = callbacks.length, oldValue = this.oldValue, newValue = this.getValue();

        while (i--) {
          callbacks[i](newValue, oldValue);
        }

        this.oldValue = newValue;
      };

      DirtyCheckProperty.prototype.isDirty = function () {
        return this.oldValue !== this.getValue();
      };

      DirtyCheckProperty.prototype.beginTracking = function () {
        this.tracking = true;
        this.oldValue = this.newValue = this.getValue();
        this.dirtyChecker.addProperty(this);
      };

      DirtyCheckProperty.prototype.endTracking = function () {
        this.tracking = false;
        this.dirtyChecker.removeProperty(this);
      };

      DirtyCheckProperty.prototype.subscribe = function (callback) {
        var callbacks = this.callbacks, that = this;

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

      _export("DirtyCheckProperty", DirtyCheckProperty);
    }
  };
});