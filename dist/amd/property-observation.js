define(["exports"], function (exports) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var SetterObserver = exports.SetterObserver = (function () {
    function SetterObserver(taskQueue, obj, propertyName) {
      this.taskQueue = taskQueue;
      this.obj = obj;
      this.propertyName = propertyName;
      this.callbacks = [];
      this.queued = false;
      this.observing = false;
      this.isSVG = obj instanceof SVGElement;
    }

    _prototypeProperties(SetterObserver, null, {
      getValue: {
        value: function getValue() {
          return this.obj[this.propertyName];
        },
        writable: true,
        configurable: true
      },
      setValue: {
        value: function setValue(newValue) {
          if (this.isSVG) {
            this.obj.setAttributeNS(null, this.propertyName, newValue);
          } else {
            this.obj[this.propertyName] = newValue;
          }
        },
        writable: true,
        configurable: true
      },
      getterValue: {
        value: function getterValue() {
          return this.currentValue;
        },
        writable: true,
        configurable: true
      },
      setterValue: {
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
        },
        writable: true,
        configurable: true
      },
      call: {
        value: function call() {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.oldValue,
              newValue = this.currentValue;

          this.queued = false;

          while (i--) {
            callbacks[i](newValue, oldValue);
          }
        },
        writable: true,
        configurable: true
      },
      subscribe: {
        value: function subscribe(callback) {
          var callbacks = this.callbacks;
          callbacks.push(callback);

          if (!this.observing) {
            this.convertProperty();
          }

          return function () {
            callbacks.splice(callbacks.indexOf(callback), 1);
          };
        },
        writable: true,
        configurable: true
      },
      convertProperty: {
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
        },
        writable: true,
        configurable: true
      }
    });

    return SetterObserver;
  })();
  var OoObjectObserver = exports.OoObjectObserver = (function () {
    function OoObjectObserver(obj) {
      this.obj = obj;
      this.observers = {};
    }

    _prototypeProperties(OoObjectObserver, null, {
      subscribe: {
        value: function subscribe(propertyObserver, callback) {
          var _this = this;
          var callbacks = propertyObserver.callbacks;
          callbacks.push(callback);

          if (!this.observing) {
            this.observing = true;
            try {
              Object.observe(this.obj, function (changes) {
                return _this.handleChanges(changes);
              }, ["update", "add"]);
            } catch (_) {}
          }

          return function () {
            callbacks.splice(callbacks.indexOf(callback), 1);
          };
        },
        writable: true,
        configurable: true
      },
      getObserver: {
        value: function getObserver(propertyName) {
          var propertyObserver = this.observers[propertyName] || (this.observers[propertyName] = new OoPropertyObserver(this, this.obj, propertyName));

          return propertyObserver;
        },
        writable: true,
        configurable: true
      },
      handleChanges: {
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
        },
        writable: true,
        configurable: true
      }
    });

    return OoObjectObserver;
  })();
  var OoPropertyObserver = exports.OoPropertyObserver = (function () {
    function OoPropertyObserver(owner, obj, propertyName) {
      this.owner = owner;
      this.obj = obj;
      this.propertyName = propertyName;
      this.callbacks = [];
      this.isSVG = obj instanceof SVGElement;
    }

    _prototypeProperties(OoPropertyObserver, null, {
      getValue: {
        value: function getValue() {
          return this.obj[this.propertyName];
        },
        writable: true,
        configurable: true
      },
      setValue: {
        value: function setValue(newValue) {
          if (this.isSVG) {
            this.obj.setAttributeNS(null, this.propertyName, newValue);
          } else {
            this.obj[this.propertyName] = newValue;
          }
        },
        writable: true,
        configurable: true
      },
      trigger: {
        value: function trigger(newValue, oldValue) {
          var callbacks = this.callbacks,
              i = callbacks.length;

          while (i--) {
            callbacks[i](newValue, oldValue);
          }
        },
        writable: true,
        configurable: true
      },
      subscribe: {
        value: function subscribe(callback) {
          return this.owner.subscribe(this, callback);
        },
        writable: true,
        configurable: true
      }
    });

    return OoPropertyObserver;
  })();
  var ElementObserver = exports.ElementObserver = (function () {
    function ElementObserver(handler, element, propertyName) {
      this.element = element;
      this.propertyName = propertyName;
      this.callbacks = [];
      this.oldValue = element[propertyName];
      this.handler = handler;
    }

    _prototypeProperties(ElementObserver, null, {
      getValue: {
        value: function getValue() {
          return this.element[this.propertyName];
        },
        writable: true,
        configurable: true
      },
      setValue: {
        value: function setValue(newValue) {
          this.element[this.propertyName] = newValue;
          this.call();
        },
        writable: true,
        configurable: true
      },
      call: {
        value: function call() {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.oldValue,
              newValue = this.getValue();

          while (i--) {
            callbacks[i](newValue, oldValue);
          }

          this.oldValue = newValue;
        },
        writable: true,
        configurable: true
      },
      subscribe: {
        value: function subscribe(callback) {
          var that = this;

          if (!this.disposeHandler) {
            this.disposeHandler = this.handler.subscribe(this.element, this.propertyName, this.call.bind(this));
          }

          var callbacks = this.callbacks;

          callbacks.push(callback);

          return function () {
            callbacks.splice(callbacks.indexOf(callback), 1);
            if (callback.length === 0) {
              that.disposeHandler();
              that.disposeHandler = null;
            }
          };
        },
        writable: true,
        configurable: true
      }
    });

    return ElementObserver;
  })();
  exports.__esModule = true;
});