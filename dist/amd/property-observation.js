define(["exports"], function (exports) {
  "use strict";

  var SetterObserver = (function () {
    var SetterObserver = function SetterObserver(taskQueue, obj, propertyName) {
      this.taskQueue = taskQueue;
      this.obj = obj;
      this.propertyName = propertyName;
      this.callbacks = [];
      this.queued = false;
      this.observing = false;
      this.isSVG = obj instanceof SVGElement;
    };

    SetterObserver.prototype.getValue = function () {
      return this.obj[this.propertyName];
    };

    SetterObserver.prototype.setValue = function (newValue) {
      if (this.isSVG) {
        this.obj.setAttributeNS(null, this.propertyName, newValue);
      } else {
        this.obj[this.propertyName] = newValue;
      }
    };

    SetterObserver.prototype.getterValue = function () {
      return this.currentValue;
    };

    SetterObserver.prototype.setterValue = function (newValue) {
      var oldValue = this.currentValue;

      if (oldValue != newValue) {
        if (!this.queued) {
          this.oldValue = oldValue;
          this.queued = true;
          this.taskQueue.queueMicroTask(this);
        }

        this.currentValue = newValue;
      }
    };

    SetterObserver.prototype.call = function () {
      var callbacks = this.callbacks, i = callbacks.length, oldValue = this.oldValue, newValue = this.currentValue;

      this.queued = false;

      while (i--) {
        callbacks[i](newValue, oldValue);
      }
    };

    SetterObserver.prototype.subscribe = function (callback) {
      var callbacks = this.callbacks;
      callbacks.push(callback);

      if (!this.observing) {
        this.convertProperty();
      }

      return function () {
        callbacks.splice(callbacks.indexOf(callback), 1);
      };
    };

    SetterObserver.prototype.convertProperty = function () {
      this.observing = true;
      this.currentValue = this.obj[this.propertyName];
      this.setValue = this.setterValue;
      this.getValue = this.getterValue;

      Object.defineProperty(this.obj, this.propertyName, {
        configurable: true,
        enumerable: true,
        get: this.getValue.bind(this),
        set: this.setValue.bind(this)
      });
    };

    return SetterObserver;
  })();

  exports.SetterObserver = SetterObserver;
  var OoObjectObserver = (function () {
    var OoObjectObserver = function OoObjectObserver(obj) {
      this.obj = obj;
      this.observers = {};
    };

    OoObjectObserver.prototype.subscribe = function (propertyObserver, callback) {
      var _this = this;
      var callbacks = propertyObserver.callbacks;
      callbacks.push(callback);

      if (!this.observing) {
        this.observing = true;
        Object.observe(this.obj, function (changes) {
          return _this.handleChanges(changes);
        }, ["update", "add"]);
      }

      return function () {
        callbacks.splice(callbacks.indexOf(callback), 1);
      };
    };

    OoObjectObserver.prototype.getObserver = function (propertyName) {
      var propertyObserver = this.observers[propertyName] || (this.observers[propertyName] = new OoPropertyObserver(this, this.obj, propertyName));

      return propertyObserver;
    };

    OoObjectObserver.prototype.handleChanges = function (changeRecords) {
      var updates = {}, observers = this.observers, i = changeRecords.length;

      while (i--) {
        var change = changeRecords[i], name = change.name;

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

  exports.OoObjectObserver = OoObjectObserver;
  var OoPropertyObserver = (function () {
    var OoPropertyObserver = function OoPropertyObserver(owner, obj, propertyName) {
      this.owner = owner;
      this.obj = obj;
      this.propertyName = propertyName;
      this.callbacks = [];
      this.isSVG = obj instanceof SVGElement;
    };

    OoPropertyObserver.prototype.getValue = function () {
      return this.obj[this.propertyName];
    };

    OoPropertyObserver.prototype.setValue = function (newValue) {
      if (this.isSVG) {
        this.obj.setAttributeNS(null, this.propertyName, newValue);
      } else {
        this.obj[this.propertyName] = newValue;
      }
    };

    OoPropertyObserver.prototype.trigger = function (newValue, oldValue) {
      var callbacks = this.callbacks, i = callbacks.length;

      while (i--) {
        callbacks[i](newValue, oldValue);
      }
    };

    OoPropertyObserver.prototype.subscribe = function (callback) {
      return this.owner.subscribe(this, callback);
    };

    return OoPropertyObserver;
  })();

  exports.OoPropertyObserver = OoPropertyObserver;
  var ElementObserver = (function () {
    var ElementObserver = function ElementObserver(handler, element, propertyName) {
      this.element = element;
      this.propertyName = propertyName;
      this.callbacks = [];
      this.oldValue = element[propertyName];
      this.handler = handler;
    };

    ElementObserver.prototype.getValue = function () {
      return this.element[this.propertyName];
    };

    ElementObserver.prototype.setValue = function (newValue) {
      this.element[this.propertyName] = newValue;
      this.call();
    };

    ElementObserver.prototype.call = function () {
      var callbacks = this.callbacks, i = callbacks.length, oldValue = this.oldValue, newValue = this.getValue();

      while (i--) {
        callbacks[i](newValue, oldValue);
      }

      this.oldValue = newValue;
    };

    ElementObserver.prototype.subscribe = function (callback) {
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
    };

    return ElementObserver;
  })();

  exports.ElementObserver = ElementObserver;
});