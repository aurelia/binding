System.register([], function (_export) {
  var _classCallCheck, AccessKeyedObserver;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      AccessKeyedObserver = (function () {
        function AccessKeyedObserver(objectInfo, keyInfo, observerLocator, evaluate) {
          var _this = this;

          _classCallCheck(this, AccessKeyedObserver);

          this.objectInfo = objectInfo;
          this.keyInfo = keyInfo;
          this.evaluate = evaluate;
          this.observerLocator = observerLocator;

          if (keyInfo.observer) {
            this.disposeKey = keyInfo.observer.subscribe(function (newValue) {
              return _this.objectOrKeyChanged(undefined, newValue);
            });
          }

          if (objectInfo.observer) {
            this.disposeObject = objectInfo.observer.subscribe(function (newValue) {
              return _this.objectOrKeyChanged(newValue);
            });
          }

          this.updatePropertySubscription(objectInfo.value, keyInfo.value);
        }

        AccessKeyedObserver.prototype.updatePropertySubscription = function updatePropertySubscription(object, key) {
          var _this2 = this;

          var callback;
          if (this.disposeProperty) {
            this.disposeProperty();
            this.disposeProperty = null;
          }
          if (object instanceof Object) {
            this.disposeProperty = this.observerLocator.getObserver(object, key).subscribe(function () {
              return _this2.notify();
            });
          }
        };

        AccessKeyedObserver.prototype.objectOrKeyChanged = function objectOrKeyChanged(object, key) {
          var oo, ko;
          object = object || ((oo = this.objectInfo.observer) && oo.getValue ? oo.getValue() : this.objectInfo.value);
          key = key || ((ko = this.keyInfo.observer) && ko.getValue ? ko.getValue() : this.keyInfo.value);
          this.updatePropertySubscription(object, key);

          this.notify();
        };

        AccessKeyedObserver.prototype.subscribe = function subscribe(callback) {
          var that = this;
          that.callback = callback;
          return function () {
            that.callback = null;
          };
        };

        AccessKeyedObserver.prototype.notify = function notify() {
          var callback = this.callback;

          if (callback) {
            callback(this.evaluate());
          }
        };

        AccessKeyedObserver.prototype.dispose = function dispose() {
          this.objectInfo = null;
          this.keyInfo = null;
          this.evaluate = null;
          this.observerLocator = null;
          if (this.disposeObject) {
            this.disposeObject();
          }
          if (this.disposeKey) {
            this.disposeKey();
          }
          if (this.disposeProperty) {
            this.disposeProperty();
          }
        };

        return AccessKeyedObserver;
      })();

      _export("AccessKeyedObserver", AccessKeyedObserver);
    }
  };
});