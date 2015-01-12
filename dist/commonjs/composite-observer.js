"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var CompositeObserver = (function () {
  var CompositeObserver = function CompositeObserver(observers, evaluate) {
    var _this = this;
    this.subscriptions = new Array(observers.length);
    this.evaluate = evaluate;

    for (var i = 0,
        ii = observers.length; i < ii; i++) {
      this.subscriptions[i] = observers[i].subscribe(function (newValue) {
        _this.notify(_this.evaluate());
      });
    }
  };

  _prototypeProperties(CompositeObserver, null, {
    subscribe: {
      value: function (callback) {
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
      value: function (newValue) {
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
      value: function () {
        var subscriptions = this.subscriptions;

        while (i--) {
          subscriptions[i]();
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return CompositeObserver;
})();

exports.CompositeObserver = CompositeObserver;