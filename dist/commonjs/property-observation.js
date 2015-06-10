'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _coreJs = require('core-js');

var _coreJs2 = _interopRequireDefault(_coreJs);

var SetterObserver = (function () {
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

exports.SetterObserver = SetterObserver;

var OoPropertyObserver = (function () {
  function OoPropertyObserver(obj, propertyName, subscribe) {
    _classCallCheck(this, OoPropertyObserver);

    this.obj = obj;
    this.propertyName = propertyName;
    this.subscribe = subscribe;
  }

  OoPropertyObserver.prototype.getValue = function getValue() {
    return this.obj[this.propertyName];
  };

  OoPropertyObserver.prototype.setValue = function setValue(newValue) {
    this.obj[this.propertyName] = newValue;
  };

  return OoPropertyObserver;
})();

exports.OoPropertyObserver = OoPropertyObserver;

var OoObjectObserver = (function () {
  function OoObjectObserver(obj, observerLocator) {
    _classCallCheck(this, OoObjectObserver);

    this.obj = obj;
    this.observerLocator = observerLocator;
    this.observers = {};
    this.callbacks = {};
    this.callbackCount = 0;
  }

  OoObjectObserver.prototype.subscribe = function subscribe(propertyName, callback) {
    if (this.callbacks[propertyName]) {
      this.callbacks[propertyName].push(callback);
    } else {
      this.callbacks[propertyName] = [callback];
      this.callbacks[propertyName].oldValue = this.obj[propertyName];
    }

    if (this.callbackCount === 0) {
      this.handler = this.handleChanges.bind(this);
      try {
        Object.observe(this.obj, this.handler, ['update', 'add']);
      } catch (_) {}
    }

    this.callbackCount++;

    return this.unsubscribe.bind(this, propertyName, callback);
  };

  OoObjectObserver.prototype.unsubscribe = function unsubscribe(propertyName, callback) {
    var callbacks = this.callbacks[propertyName],
        index = callbacks.indexOf(callback);
    if (index === -1) {
      return;
    }

    callbacks.splice(index, 1);
    if (callbacks.count = 0) {
      callbacks.oldValue = null;
      this.callbacks[propertyName] = null;
    }

    this.callbackCount--;
    if (this.callbackCount === 0) {
      try {
        Object.unobserve(this.obj, this.handler);
      } catch (_) {}
    }
  };

  OoObjectObserver.prototype.getObserver = function getObserver(propertyName, descriptor) {
    var propertyObserver = this.observers[propertyName];
    if (!propertyObserver) {
      if (descriptor) {
        propertyObserver = this.observers[propertyName] = new OoPropertyObserver(this.obj, propertyName, this.subscribe.bind(this, propertyName));
      } else {
        propertyObserver = this.observers[propertyName] = new UndefinedPropertyObserver(this, this.obj, propertyName);
      }
    }
    return propertyObserver;
  };

  OoObjectObserver.prototype.handleChanges = function handleChanges(changes) {
    var properties = {},
        i,
        ii,
        change,
        propertyName,
        oldValue,
        newValue,
        callbacks;

    for (i = 0, ii = changes.length; i < ii; i++) {
      change = changes[i];
      properties[change.name] = change;
    }

    for (name in properties) {
      callbacks = this.callbacks[name];
      if (!callbacks) {
        continue;
      }
      change = properties[name];
      newValue = change.object[name];
      oldValue = change.oldValue;

      for (i = 0, ii = callbacks.length; i < ii; i++) {
        callbacks[i](newValue, oldValue);
      }
    }
  };

  return OoObjectObserver;
})();

exports.OoObjectObserver = OoObjectObserver;

var UndefinedPropertyObserver = (function () {
  function UndefinedPropertyObserver(owner, obj, propertyName) {
    _classCallCheck(this, UndefinedPropertyObserver);

    this.owner = owner;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbackMap = new Map();
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
    delete observerLocator.getOrCreateObserversLookup(this.obj, observerLocator)[this.propertyName];
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
    var _this = this;

    if (!this.actual) {
      this.getObserver();
    }

    if (this.actual) {
      return this.actual.subscribe(callback);
    }

    if (!this.subscription) {
      this.subscription = this.owner.subscribe(this.propertyName, this.trigger.bind(this));
    }

    this.callbackMap.set(callback, null);

    return function () {
      var actualDispose = _this.callbackMap.get(callback);
      if (actualDispose) actualDispose();
      _this.callbackMap['delete'](callback);
    };
  };

  return UndefinedPropertyObserver;
})();

exports.UndefinedPropertyObserver = UndefinedPropertyObserver;