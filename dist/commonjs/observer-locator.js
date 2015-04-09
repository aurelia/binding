'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _TaskQueue = require('aurelia-task-queue');

var _getArrayObserver2 = require('./array-observation');

var _getMapObserver2 = require('./map-observation');

var _EventManager = require('./event-manager');

var _DirtyChecker$DirtyCheckProperty = require('./dirty-checking');

var _SetterObserver$OoObjectObserver$OoPropertyObserver = require('./property-observation');

var _SelectValueObserver$CheckedObserver$ValueAttributeObserver$XLinkAttributeObserver$DataAttributeObserver$StyleObserver = require('./element-observation');

var _All = require('aurelia-dependency-injection');

var _hasDeclaredDependencies$ComputedPropertyObserver = require('./computed-observation');

if (typeof Object.getPropertyDescriptor !== 'function') {
  Object.getPropertyDescriptor = function (subject, name) {
    var pd = Object.getOwnPropertyDescriptor(subject, name);
    var proto = Object.getPrototypeOf(subject);
    while (typeof pd === 'undefined' && proto !== null) {
      pd = Object.getOwnPropertyDescriptor(proto, name);
      proto = Object.getPrototypeOf(proto);
    }
    return pd;
  };
}

var hasObjectObserve = (function detectObjectObserve() {
  if (typeof Object.observe !== 'function') {
    return false;
  }

  var records = [];

  function callback(recs) {
    records = recs;
  }

  var test = {};
  Object.observe(test, callback);
  test.id = 1;
  test.id = 2;
  delete test.id;

  Object.deliverChangeRecords(callback);
  if (records.length !== 3) {
    return false;
  }if (records[0].type != 'add' || records[1].type != 'update' || records[2].type != 'delete') {
    return false;
  }

  Object.unobserve(test, callback);

  return true;
})();

function createObserversLookup(obj) {
  var value = {};

  try {
    Object.defineProperty(obj, '__observers__', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    });
  } catch (_) {}

  return value;
}

function createObserverLookup(obj, observerLocator) {
  var value = new _SetterObserver$OoObjectObserver$OoPropertyObserver.OoObjectObserver(obj, observerLocator);

  try {
    Object.defineProperty(obj, '__observer__', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    });
  } catch (_) {}

  return value;
}

var ObserverLocator = (function () {
  function ObserverLocator(taskQueue, eventManager, dirtyChecker, observationAdapters) {
    _classCallCheck(this, ObserverLocator);

    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
    this.observationAdapters = observationAdapters;
  }

  _createClass(ObserverLocator, [{
    key: 'getObserversLookup',
    value: function getObserversLookup(obj) {
      return obj.__observers__ || createObserversLookup(obj);
    }
  }, {
    key: 'getObserver',
    value: function getObserver(obj, propertyName) {
      var observersLookup = this.getObserversLookup(obj);

      if (propertyName in observersLookup) {
        return observersLookup[propertyName];
      }

      return observersLookup[propertyName] = this.createPropertyObserver(obj, propertyName);
    }
  }, {
    key: 'getObservationAdapter',
    value: function getObservationAdapter(obj, propertyName, descriptor) {
      var i, ii, observationAdapter;
      for (i = 0, ii = this.observationAdapters.length; i < ii; i++) {
        observationAdapter = this.observationAdapters[i];
        if (observationAdapter.handlesProperty(obj, propertyName, descriptor)) {
          return observationAdapter;
        }
      }
      return null;
    }
  }, {
    key: 'createPropertyObserver',
    value: function createPropertyObserver(obj, propertyName) {
      var observerLookup, descriptor, handler, observationAdapter, xlinkResult;

      if (obj instanceof Element) {
        handler = this.eventManager.getElementHandler(obj, propertyName);
        if (propertyName === 'value' && obj.tagName.toLowerCase() === 'select') {
          return new _SelectValueObserver$CheckedObserver$ValueAttributeObserver$XLinkAttributeObserver$DataAttributeObserver$StyleObserver.SelectValueObserver(obj, handler, this);
        }
        if (propertyName === 'checked' && obj.tagName.toLowerCase() === 'input') {
          return new _SelectValueObserver$CheckedObserver$ValueAttributeObserver$XLinkAttributeObserver$DataAttributeObserver$StyleObserver.CheckedObserver(obj, handler, this);
        }
        if (handler) {
          return new _SelectValueObserver$CheckedObserver$ValueAttributeObserver$XLinkAttributeObserver$DataAttributeObserver$StyleObserver.ValueAttributeObserver(obj, propertyName, handler);
        }
        xlinkResult = /^xlink:(.+)$/.exec(propertyName);
        if (xlinkResult) {
          return new _SelectValueObserver$CheckedObserver$ValueAttributeObserver$XLinkAttributeObserver$DataAttributeObserver$StyleObserver.XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
        }
        if (/^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof SVGElement) {
          return new _SelectValueObserver$CheckedObserver$ValueAttributeObserver$XLinkAttributeObserver$DataAttributeObserver$StyleObserver.DataAttributeObserver(obj, propertyName);
        }
        if (propertyName === 'style' || propertyName === 'css') {
          return new _SelectValueObserver$CheckedObserver$ValueAttributeObserver$XLinkAttributeObserver$DataAttributeObserver$StyleObserver.StyleObserver(obj, propertyName);
        }
      }

      descriptor = Object.getPropertyDescriptor(obj, propertyName);

      if (_hasDeclaredDependencies$ComputedPropertyObserver.hasDeclaredDependencies(descriptor)) {
        return new _hasDeclaredDependencies$ComputedPropertyObserver.ComputedPropertyObserver(obj, propertyName, descriptor, this);
      }

      if (descriptor && (descriptor.get || descriptor.set)) {
        observationAdapter = this.getObservationAdapter(obj, propertyName, descriptor);
        if (observationAdapter) {
          return observationAdapter.getObserver(obj, propertyName, descriptor);
        }return new _DirtyChecker$DirtyCheckProperty.DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }

      if (hasObjectObserve) {
        observerLookup = obj.__observer__ || createObserverLookup(obj, this);
        return observerLookup.getObserver(propertyName, descriptor);
      }

      if (obj instanceof Array) {
        observerLookup = this.getArrayObserver(obj);
        return observerLookup.getObserver(propertyName);
      } else if (obj instanceof Map) {
        observerLookup = this.getMapObserver(obj);
        return observerLookup.getObserver(propertyName);
      }

      return new _SetterObserver$OoObjectObserver$OoPropertyObserver.SetterObserver(this.taskQueue, obj, propertyName);
    }
  }, {
    key: 'getArrayObserver',
    value: (function (_getArrayObserver) {
      function getArrayObserver(_x) {
        return _getArrayObserver.apply(this, arguments);
      }

      _getArrayObserver2.getArrayObserver.toString = function () {
        return _getArrayObserver.toString();
      };

      return _getArrayObserver2.getArrayObserver;
    })(function (array) {
      if ('__array_observer__' in array) {
        return array.__array_observer__;
      }

      return array.__array_observer__ = _getArrayObserver2.getArrayObserver(this.taskQueue, array);
    })
  }, {
    key: 'getMapObserver',
    value: (function (_getMapObserver) {
      function getMapObserver(_x2) {
        return _getMapObserver.apply(this, arguments);
      }

      _getMapObserver2.getMapObserver.toString = function () {
        return _getMapObserver.toString();
      };

      return _getMapObserver2.getMapObserver;
    })(function (map) {
      if ('__map_observer__' in map) {
        return map.__map_observer__;
      }

      return map.__map_observer__ = _getMapObserver2.getMapObserver(this.taskQueue, map);
    })
  }], [{
    key: 'inject',
    value: function inject() {
      return [_TaskQueue.TaskQueue, _EventManager.EventManager, _DirtyChecker$DirtyCheckProperty.DirtyChecker, _All.All.of(ObjectObservationAdapter)];
    }
  }]);

  return ObserverLocator;
})();

exports.ObserverLocator = ObserverLocator;

var ObjectObservationAdapter = (function () {
  function ObjectObservationAdapter() {
    _classCallCheck(this, ObjectObservationAdapter);
  }

  _createClass(ObjectObservationAdapter, [{
    key: 'handlesProperty',
    value: function handlesProperty(object, propertyName, descriptor) {
      throw new Error('BindingAdapters must implement handlesProperty(object, propertyName).');
    }
  }, {
    key: 'getObserver',
    value: function getObserver(object, propertyName, descriptor) {
      throw new Error('BindingAdapters must implement createObserver(object, propertyName).');
    }
  }]);

  return ObjectObservationAdapter;
})();

exports.ObjectObservationAdapter = ObjectObservationAdapter;