System.register(['core-js'], function (_export) {
  var core, _classCallCheck, SetterObserver, OoObjectObserver, OoPropertyObserver, UndefinedPropertyObserver;

  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      SetterObserver = (function () {
        function SetterObserver(taskQueue, obj, propertyName) {
          _classCallCheck(this, SetterObserver);

          this.taskQueue = taskQueue;
          this.obj = obj;
          this.propertyName = propertyName;
          this.callbacks = [];
          this.queued = false;
          this.observing = false;
        }

        SetterObserver.prototype.getValue = function getValue() {
          return this.obj[this.propertyName];
        };

        SetterObserver.prototype.setValue = function setValue(newValue) {
          this.obj[this.propertyName] = newValue;
        };

        SetterObserver.prototype.getterValue = function getterValue() {
          return this.currentValue;
        };

        SetterObserver.prototype.setterValue = function setterValue(newValue) {
          var oldValue = this.currentValue;

          if (oldValue !== newValue) {
            if (!this.queued) {
              this.oldValue = oldValue;
              this.queued = true;
              this.taskQueue.queueMicroTask(this);
            }

            this.currentValue = newValue;
          }
        };

        SetterObserver.prototype.call = function call() {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.oldValue,
              newValue = this.currentValue;

          this.queued = false;

          while (i--) {
            callbacks[i](newValue, oldValue);
          }
        };

        SetterObserver.prototype.subscribe = function subscribe(callback) {
          var callbacks = this.callbacks;
          callbacks.push(callback);

          if (!this.observing) {
            this.convertProperty();
          }

          return function () {
            callbacks.splice(callbacks.indexOf(callback), 1);
          };
        };

        SetterObserver.prototype.convertProperty = function convertProperty() {
          this.observing = true;
          this.currentValue = this.obj[this.propertyName];
          this.setValue = this.setterValue;
          this.getValue = this.getterValue;

          try {
            Object.defineProperty(this.obj, this.propertyName, {
              configurable: true,
              enumerable: true,
              get: this.getValue.bind(this),
              set: this.setValue.bind(this)
            });
          } catch (_) {}
        };

        return SetterObserver;
      })();

      _export('SetterObserver', SetterObserver);

      OoObjectObserver = (function () {
        function OoObjectObserver(obj, observerLocator) {
          _classCallCheck(this, OoObjectObserver);

          this.obj = obj;
          this.observers = {};
          this.observerLocator = observerLocator;
        }

        OoObjectObserver.prototype.subscribe = function subscribe(propertyObserver, callback) {
          var _this = this;

          var callbacks = propertyObserver.callbacks;
          callbacks.push(callback);

          if (!this.observing) {
            this.observing = true;
            try {
              Object.observe(this.obj, function (changes) {
                return _this.handleChanges(changes);
              }, ['update', 'add']);
            } catch (_) {}
          }

          return function () {
            callbacks.splice(callbacks.indexOf(callback), 1);
          };
        };

        OoObjectObserver.prototype.getObserver = function getObserver(propertyName, descriptor) {
          var propertyObserver = this.observers[propertyName];
          if (!propertyObserver) {
            if (descriptor) {
              propertyObserver = this.observers[propertyName] = new OoPropertyObserver(this, this.obj, propertyName);
            } else {
              propertyObserver = this.observers[propertyName] = new UndefinedPropertyObserver(this, this.obj, propertyName);
            }
          }
          return propertyObserver;
        };

        OoObjectObserver.prototype.handleChanges = function handleChanges(changeRecords) {
          var updates = {},
              observers = this.observers,
              i = changeRecords.length;

          while (i--) {
            var change = changeRecords[i],
                name = change.name;

            if (!(name in updates)) {
              var observer = observers[name];
              updates[name] = true;
              if (observer) {
                observer.trigger(change.object[name], change.oldValue);
              }
            }
          }
        };

        return OoObjectObserver;
      })();

      _export('OoObjectObserver', OoObjectObserver);

      OoPropertyObserver = (function () {
        function OoPropertyObserver(owner, obj, propertyName) {
          _classCallCheck(this, OoPropertyObserver);

          this.owner = owner;
          this.obj = obj;
          this.propertyName = propertyName;
          this.callbacks = [];
        }

        OoPropertyObserver.prototype.getValue = function getValue() {
          return this.obj[this.propertyName];
        };

        OoPropertyObserver.prototype.setValue = function setValue(newValue) {
          this.obj[this.propertyName] = newValue;
        };

        OoPropertyObserver.prototype.trigger = function trigger(newValue, oldValue) {
          var callbacks = this.callbacks,
              i = callbacks.length;

          while (i--) {
            callbacks[i](newValue, oldValue);
          }
        };

        OoPropertyObserver.prototype.subscribe = function subscribe(callback) {
          return this.owner.subscribe(this, callback);
        };

        return OoPropertyObserver;
      })();

      _export('OoPropertyObserver', OoPropertyObserver);

      UndefinedPropertyObserver = (function () {
        function UndefinedPropertyObserver(owner, obj, propertyName) {
          _classCallCheck(this, UndefinedPropertyObserver);

          this.owner = owner;
          this.obj = obj;
          this.propertyName = propertyName;
          this.callbackMap = new Map();
          this.callbacks = [];
        }

        UndefinedPropertyObserver.prototype.getValue = function getValue() {
          if (this.actual) {
            return this.actual.getValue();
          }
          return this.obj[this.propertyName];
        };

        UndefinedPropertyObserver.prototype.setValue = function setValue(newValue) {
          if (this.actual) {
            this.actual.setValue(newValue);
            return;
          }

          this.obj[this.propertyName] = newValue;
          this.trigger(newValue, undefined);
        };

        UndefinedPropertyObserver.prototype.trigger = function trigger(newValue, oldValue) {
          var callback;

          if (this.subscription) {
            this.subscription();
          }

          this.getObserver();

          for (var _iterator = this.callbackMap.keys(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            if (_isArray) {
              if (_i >= _iterator.length) break;
              callback = _iterator[_i++];
            } else {
              _i = _iterator.next();
              if (_i.done) break;
              callback = _i.value;
            }

            callback(newValue, oldValue);
          }
        };

        UndefinedPropertyObserver.prototype.getObserver = function getObserver() {
          var callback, observerLocator;

          if (!Object.getOwnPropertyDescriptor(this.obj, this.propertyName)) {
            return;
          }

          observerLocator = this.owner.observerLocator;
          delete this.owner.observers[this.propertyName];
          delete observerLocator.getObserversLookup(this.obj, observerLocator)[this.propertyName];
          this.actual = observerLocator.getObserver(this.obj, this.propertyName);

          for (var _iterator2 = this.callbackMap.keys(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              callback = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              callback = _i2.value;
            }

            this.callbackMap.set(callback, this.actual.subscribe(callback));
          }
        };

        UndefinedPropertyObserver.prototype.subscribe = function subscribe(callback) {
          var _this2 = this;

          if (!this.actual) {
            this.getObserver();
          }

          if (this.actual) {
            return this.actual.subscribe(callback);
          }

          if (!this.subscription) {
            this.subscription = this.owner.subscribe(this);
          }

          this.callbackMap.set(callback, null);

          return function () {
            var actualDispose = _this2.callbackMap.get(callback);
            if (actualDispose) actualDispose();
            _this2.callbackMap['delete'](callback);
          };
        };

        return UndefinedPropertyObserver;
      })();

      _export('UndefinedPropertyObserver', UndefinedPropertyObserver);
    }
  };
});