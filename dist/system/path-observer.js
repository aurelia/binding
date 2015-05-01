System.register([], function (_export) {
  var _classCallCheck, PathObserver;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      PathObserver = (function () {
        function PathObserver(leftObserver, getRightObserver, value) {
          var _this = this;

          _classCallCheck(this, PathObserver);

          this.leftObserver = leftObserver;

          this.disposeLeft = leftObserver.subscribe(function (newValue) {
            var newRightValue = _this.updateRight(getRightObserver(newValue));
            _this.notify(newRightValue);
          });

          this.updateRight(getRightObserver(value));
        }

        PathObserver.prototype.updateRight = function updateRight(observer) {
          var _this2 = this;

          this.rightObserver = observer;

          if (this.disposeRight) {
            this.disposeRight();
          }

          if (!observer) {
            return null;
          }

          this.disposeRight = observer.subscribe(function (newValue) {
            return _this2.notify(newValue);
          });
          return observer.getValue();
        };

        PathObserver.prototype.subscribe = function subscribe(callback) {
          var that = this;
          that.callback = callback;
          return function () {
            that.callback = null;
          };
        };

        PathObserver.prototype.notify = function notify(newValue) {
          var callback = this.callback;

          if (callback) {
            callback(newValue);
          }
        };

        PathObserver.prototype.dispose = function dispose() {
          if (this.disposeLeft) {
            this.disposeLeft();
          }

          if (this.disposeRight) {
            this.disposeRight();
          }
        };

        return PathObserver;
      })();

      _export("PathObserver", PathObserver);
    }
  };
});