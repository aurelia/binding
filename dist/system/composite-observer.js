System.register([], function (_export) {
  var _classCallCheck, _createClass, CompositeObserver;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

        _createClass(CompositeObserver, [{
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
            var subscriptions = this.subscriptions;

            var i = subscriptions.length;
            while (i--) {
              subscriptions[i]();
            }
          }
        }]);

        return CompositeObserver;
      })();

      _export("CompositeObserver", CompositeObserver);
    }
  };
});