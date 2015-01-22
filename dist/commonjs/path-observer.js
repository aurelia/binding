"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var PathObserver = (function () {
  function PathObserver(leftObserver, getRightObserver, value) {
    var _this = this;
    this.leftObserver = leftObserver;

    this.disposeLeft = leftObserver.subscribe(function (newValue) {
      var newRightValue = _this.updateRight(getRightObserver(newValue));
      _this.notify(newRightValue);
    });

    this.updateRight(getRightObserver(value));
  }

  _prototypeProperties(PathObserver, null, {
    updateRight: {
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
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    subscribe: {
      value: function subscribe(callback) {
        var that = this;
        that.callback = callback;
        return function () {
          that.callback = null;
        };
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    notify: {
      value: function notify(newValue) {
        var callback = this.callback;

        if (callback) {
          callback(newValue);
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    dispose: {
      value: function dispose() {
        if (this.disposeLeft) {
          this.disposeLeft();
        }

        if (this.disposeRight) {
          this.disposeRight();
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return PathObserver;
})();

exports.PathObserver = PathObserver;