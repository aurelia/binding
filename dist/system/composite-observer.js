System.register([], function (_export) {
  var _classCallCheck, CompositeObserver;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      CompositeObserver = (function () {
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

        CompositeObserver.prototype.subscribe = function subscribe(callback) {
          var that = this;
          that.callback = callback;
          return function () {
            that.callback = null;
          };
        };

        CompositeObserver.prototype.notify = function notify(newValue) {
          var callback = this.callback;

          if (callback) {
            callback(newValue);
          }
        };

        CompositeObserver.prototype.dispose = function dispose() {
          var subscriptions = this.subscriptions;

          var i = subscriptions.length;
          while (i--) {
            subscriptions[i]();
          }
        };

        return CompositeObserver;
      })();

      _export("CompositeObserver", CompositeObserver);
    }
  };
});