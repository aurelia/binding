System.register(['core-js'], function (_export) {
  var core, _classCallCheck, _createClass, SetterObserver, OoObjectObserver, OoPropertyObserver, UndefinedPropertyObserver;

  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

        _createClass(SetterObserver, [{
          key: 'getValue',
          value: function getValue() {
            return this.obj[this.propertyName];
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            this.obj[this.propertyName] = newValue;
          }
        }, {
          key: 'getterValue',
          value: function getterValue() {
            return this.currentValue;
          }
        }, {
          key: 'setterValue',
          value: function setterValue(newValue) {
            var oldValue = this.currentValue;

            if (oldValue != newValue) {
              if (!this.queued) {
                this.oldValue = oldValue;
                this.queued = true;
                this.taskQueue.queueMicroTask(this);
              }

              this.currentValue = newValue;
            }
          }
        }, {
          key: 'call',
          value: function call() {
            var callbacks = this.callbacks,
                i = callbacks.length,
                oldValue = this.oldValue,
                newValue = this.currentValue;

            this.queued = false;

            while (i--) {
              callbacks[i](newValue, oldValue);
            }
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            var callbacks = this.callbacks;
            callbacks.push(callback);

            if (!this.observing) {
              this.convertProperty();
            }

            return function () {
              callbacks.splice(callbacks.indexOf(callback), 1);
            };
          }
        }, {
          key: 'convertProperty',
          value: function convertProperty() {
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
          }
        }]);

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

        _createClass(OoObjectObserver, [{
          key: 'subscribe',
          value: function subscribe(propertyObserver, callback) {
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
          }
        }, {
          key: 'getObserver',
          value: function getObserver(propertyName, descriptor) {
            var propertyObserver = this.observers[propertyName];
            if (!propertyObserver) {
              if (descriptor) {
                propertyObserver = this.observers[propertyName] = new OoPropertyObserver(this, this.obj, propertyName);
              } else {
                propertyObserver = this.observers[propertyName] = new UndefinedPropertyObserver(this, this.obj, propertyName);
              }
            }
            return propertyObserver;
          }
        }, {
          key: 'handleChanges',
          value: function handleChanges(changeRecords) {
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
          }
        }]);

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

        _createClass(OoPropertyObserver, [{
          key: 'getValue',
          value: function getValue() {
            return this.obj[this.propertyName];
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            this.obj[this.propertyName] = newValue;
          }
        }, {
          key: 'trigger',
          value: function trigger(newValue, oldValue) {
            var callbacks = this.callbacks,
                i = callbacks.length;

            while (i--) {
              callbacks[i](newValue, oldValue);
            }
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            return this.owner.subscribe(this, callback);
          }
        }]);

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

        _createClass(UndefinedPropertyObserver, [{
          key: 'getValue',
          value: function getValue() {
            if (this.actual) {
              return this.actual.getValue();
            }
            return this.obj[this.propertyName];
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            if (this.actual) {
              this.actual.setValue(newValue);
              return;
            }

            this.obj[this.propertyName] = newValue;
            this.trigger(newValue, undefined);
          }
        }, {
          key: 'trigger',
          value: function trigger(newValue, oldValue) {
            var callback;

            if (this.subscription) {
              this.subscription();
            }

            this.getObserver();

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = this.callbackMap.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                callback = _step.value;

                callback(newValue, oldValue);
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                  _iterator['return']();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          }
        }, {
          key: 'getObserver',
          value: function getObserver() {
            var callback, observerLocator;

            if (!Object.getOwnPropertyDescriptor(this.obj, this.propertyName)) {
              return;
            }

            observerLocator = this.owner.observerLocator;
            delete this.owner.observers[this.propertyName];
            delete observerLocator.getObserversLookup(this.obj, observerLocator)[this.propertyName];
            this.actual = observerLocator.getObserver(this.obj, this.propertyName);

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = this.callbackMap.keys()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                callback = _step2.value;

                this.callbackMap.set(callback, this.actual.subscribe(callback));
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                  _iterator2['return']();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
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
          }
        }]);

        return UndefinedPropertyObserver;
      })();

      _export('UndefinedPropertyObserver', UndefinedPropertyObserver);
    }
  };
});