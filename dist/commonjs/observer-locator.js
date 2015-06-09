'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _aureliaTaskQueue = require('aurelia-task-queue');

var _environment = require('./environment');

var _arrayObservation = require('./array-observation');

var _mapObservation = require('./map-observation');

var _eventManager = require('./event-manager');

var _dirtyChecking = require('./dirty-checking');

var _propertyObservation = require('./property-observation');

var _elementObservation = require('./element-observation');

var _classObserver = require('./class-observer');

var _aureliaDependencyInjection = require('aurelia-dependency-injection');

var _computedObservation = require('./computed-observation');

var _svg = require('./svg');

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

function createObserverLookup(obj, observerLocator) {
  var value = new _propertyObservation.OoObjectObserver(obj, observerLocator);

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

  ObserverLocator.inject = function inject() {
    return [_aureliaTaskQueue.TaskQueue, _eventManager.EventManager, _dirtyChecking.DirtyChecker, _aureliaDependencyInjection.All.of(ObjectObservationAdapter)];
  };

  ObserverLocator.prototype.getObserver = function getObserver(obj, propertyName) {
    var observersLookup = obj.__observers__,
        observer;

    if (observersLookup && propertyName in observersLookup) {
      return observersLookup[propertyName];
    }

    observer = this.createPropertyObserver(obj, propertyName);

    if (!observer.doNotCache) {
      if (observersLookup === undefined) {
        observersLookup = this.getOrCreateObserversLookup(obj);
      }

      observersLookup[propertyName] = observer;
    }

    return observer;
  };

  ObserverLocator.prototype.getOrCreateObserversLookup = function getOrCreateObserversLookup(obj) {
    return obj.__observers__ || this.createObserversLookup(obj);
  };

  ObserverLocator.prototype.createObserversLookup = function createObserversLookup(obj) {
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
  };

  ObserverLocator.prototype.getObservationAdapter = function getObservationAdapter(obj, propertyName, descriptor) {
    var i, ii, observationAdapter;
    for (i = 0, ii = this.observationAdapters.length; i < ii; i++) {
      observationAdapter = this.observationAdapters[i];
      if (observationAdapter.handlesProperty(obj, propertyName, descriptor)) return observationAdapter;
    }
    return null;
  };

  ObserverLocator.prototype.createPropertyObserver = function createPropertyObserver(obj, propertyName) {
    var observerLookup, descriptor, handler, observationAdapter, xlinkResult;

    if (obj instanceof Element) {
      if (propertyName === 'class') {
        return new _classObserver.ClassObserver(obj);
      }
      if (propertyName === 'style' || propertyName === 'css') {
        return new _elementObservation.StyleObserver(obj, propertyName);
      }
      handler = this.eventManager.getElementHandler(obj, propertyName);
      if (propertyName === 'value' && obj.tagName.toLowerCase() === 'select') {
        return new _elementObservation.SelectValueObserver(obj, handler, this);
      }
      if (propertyName === 'checked' && obj.tagName.toLowerCase() === 'input') {
        return new _elementObservation.CheckedObserver(obj, handler, this);
      }
      if (handler) {
        return new _elementObservation.ValueAttributeObserver(obj, propertyName, handler);
      }
      xlinkResult = /^xlink:(.+)$/.exec(propertyName);
      if (xlinkResult) {
        return new _elementObservation.XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
      }
      if (/^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof SVGElement && (0, _svg.isStandardSvgAttribute)(obj.nodeName, propertyName)) {
        return new _elementObservation.DataAttributeObserver(obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);

    if ((0, _computedObservation.hasDeclaredDependencies)(descriptor)) {
      return new _computedObservation.ComputedPropertyObserver(obj, propertyName, descriptor, this);
    }

    var existingGetterOrSetter = undefined;
    if (descriptor && (existingGetterOrSetter = descriptor.get || descriptor.set)) {
      if (existingGetterOrSetter.getObserver) {
        return existingGetterOrSetter.getObserver(obj);
      }

      observationAdapter = this.getObservationAdapter(obj, propertyName, descriptor);
      if (observationAdapter) return observationAdapter.getObserver(obj, propertyName, descriptor);
      return new _dirtyChecking.DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    }

    if (_environment.hasObjectObserve) {
      observerLookup = obj.__observer__ || createObserverLookup(obj, this);
      return observerLookup.getObserver(propertyName, descriptor);
    }

    if (obj instanceof Array) {
      if (propertyName === 'length') {
        return this.getArrayObserver(obj).getLengthObserver();
      } else {
        return new _dirtyChecking.DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    } else if (obj instanceof Map) {
      if (propertyName === 'size') {
        return this.getMapObserver(obj).getLengthObserver();
      } else {
        return new _dirtyChecking.DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }

    return new _propertyObservation.SetterObserver(this.taskQueue, obj, propertyName);
  };

  ObserverLocator.prototype.getArrayObserver = function getArrayObserver(array) {
    if ('__array_observer__' in array) {
      return array.__array_observer__;
    }

    return array.__array_observer__ = (0, _arrayObservation.getArrayObserver)(this.taskQueue, array);
  };

  ObserverLocator.prototype.getMapObserver = function getMapObserver(map) {
    if ('__map_observer__' in map) {
      return map.__map_observer__;
    }

    return map.__map_observer__ = (0, _mapObservation.getMapObserver)(this.taskQueue, map);
  };

  return ObserverLocator;
})();

exports.ObserverLocator = ObserverLocator;

var ObjectObservationAdapter = (function () {
  function ObjectObservationAdapter() {
    _classCallCheck(this, ObjectObservationAdapter);
  }

  ObjectObservationAdapter.prototype.handlesProperty = function handlesProperty(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement handlesProperty(object, propertyName).');
  };

  ObjectObservationAdapter.prototype.getObserver = function getObserver(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement createObserver(object, propertyName).');
  };

  return ObjectObservationAdapter;
})();

exports.ObjectObservationAdapter = ObjectObservationAdapter;