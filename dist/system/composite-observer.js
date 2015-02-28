System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, CompositeObserver;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      CompositeObserver = _export("CompositeObserver", (function () {
        function CompositeObserver(observers, evaluate) {
          var _this = this;

          _classCallCheck(this, CompositeObserver);

          this.subscriptions = new Array(observers.length);
          this.evaluate = evaluate;

          for (var i = 0, ii = observers.length; i < ii; i++) {
            this.subscriptions[i] = observers[i].subscribe(function (newValue) {
              _this.notify(_this.evaluate());
            });
          }
        }

        _prototypeProperties(CompositeObserver, null, {
          subscribe: {
            value: function subscribe(callback) {
              var that = this;
              that.callback = callback;
              return function () {
                that.callback = null;
              };
            },
            writable: true,
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
            configurable: true
          },
          dispose: {
            value: function dispose() {
              var subscriptions = this.subscriptions;

              while (i--) {
                subscriptions[i]();
              }
            },
            writable: true,
            configurable: true
          }
        });

        return CompositeObserver;
      })());
    }
  };
});