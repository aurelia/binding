define(["exports"], function (exports) {
  "use strict";

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

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

    _createClass(PathObserver, [{
      key: "updateRight",
      value: function updateRight(observer) {
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
      }
    }, {
      key: "subscribe",
      value: function subscribe(callback) {
        var that = this;
        that.callback = callback;
        return function () {
          that.callback = null;
        };
      }
    }, {
      key: "notify",
      value: function notify(newValue) {
        var callback = this.callback;

        if (callback) {
          callback(newValue);
        }
      }
    }, {
      key: "dispose",
      value: function dispose() {
        if (this.disposeLeft) {
          this.disposeLeft();
        }

        if (this.disposeRight) {
          this.disposeRight();
        }
      }
    }]);

    return PathObserver;
  })();

  exports.PathObserver = PathObserver;
});