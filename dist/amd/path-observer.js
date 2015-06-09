define(["exports"], function (exports) {
  "use strict";

  exports.__esModule = true;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var PathObserver = (function () {
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

  exports.PathObserver = PathObserver;
});