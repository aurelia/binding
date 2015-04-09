System.register([], function (_export) {
  var _classCallCheck, _createClass, DirtyChecker, DirtyCheckProperty;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      DirtyChecker = (function () {
        function DirtyChecker() {
          _classCallCheck(this, DirtyChecker);

          this.tracked = [];
          this.checkDelay = 120;
        }

        _createClass(DirtyChecker, [{
          key: "addProperty",
          value: function addProperty(property) {
            var tracked = this.tracked;

            tracked.push(property);

            if (tracked.length === 1) {
              this.scheduleDirtyCheck();
            }
          }
        }, {
          key: "removeProperty",
          value: function removeProperty(property) {
            var tracked = this.tracked;
            tracked.splice(tracked.indexOf(property), 1);
          }
        }, {
          key: "scheduleDirtyCheck",
          value: function scheduleDirtyCheck() {
            var _this = this;

            setTimeout(function () {
              return _this.check();
            }, this.checkDelay);
          }
        }, {
          key: "check",
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
          }
        }]);

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

        _createClass(DirtyCheckProperty, [{
          key: "getValue",
          value: function getValue() {
            return this.obj[this.propertyName];
          }
        }, {
          key: "setValue",
          value: function setValue(newValue) {
            if (this.isSVG) {
              this.obj.setAttributeNS(null, this.propertyName, newValue);
            } else {
              this.obj[this.propertyName] = newValue;
            }
          }
        }, {
          key: "call",
          value: function call() {
            var callbacks = this.callbacks,
                i = callbacks.length,
                oldValue = this.oldValue,
                newValue = this.getValue();

            while (i--) {
              callbacks[i](newValue, oldValue);
            }

            this.oldValue = newValue;
          }
        }, {
          key: "isDirty",
          value: function isDirty() {
            return this.oldValue !== this.getValue();
          }
        }, {
          key: "beginTracking",
          value: function beginTracking() {
            this.tracking = true;
            this.oldValue = this.newValue = this.getValue();
            this.dirtyChecker.addProperty(this);
          }
        }, {
          key: "endTracking",
          value: function endTracking() {
            this.tracking = false;
            this.dirtyChecker.removeProperty(this);
          }
        }, {
          key: "subscribe",
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
          }
        }]);

        return DirtyCheckProperty;
      })();

      _export("DirtyCheckProperty", DirtyCheckProperty);
    }
  };
});