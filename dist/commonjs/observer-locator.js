"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var TaskQueue = require("aurelia-task-queue").TaskQueue;
var getArrayObserver = require("./array-observation").getArrayObserver;
var EventManager = require("./event-manager").EventManager;
var _dirtyChecking = require("./dirty-checking");

var DirtyChecker = _dirtyChecking.DirtyChecker;
var DirtyCheckProperty = _dirtyChecking.DirtyCheckProperty;
var _propertyObservation = require("./property-observation");

var SetterObserver = _propertyObservation.SetterObserver;
var OoObjectObserver = _propertyObservation.OoObjectObserver;
var OoPropertyObserver = _propertyObservation.OoPropertyObserver;
var ElementObserver = _propertyObservation.ElementObserver;
var All = require("aurelia-dependency-injection").All;


if (typeof Object.getPropertyDescriptor !== "function") {
  Object.getPropertyDescriptor = function (subject, name) {
    var pd = Object.getOwnPropertyDescriptor(subject, name);
    var proto = Object.getPrototypeOf(subject);
    while (typeof pd === "undefined" && proto !== null) {
      pd = Object.getOwnPropertyDescriptor(proto, name);
      proto = Object.getPrototypeOf(proto);
    }
    return pd;
  };
}

var hasObjectObserve = (function detectObjectObserve() {
  if (typeof Object.observe !== "function") {
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
  if (records.length !== 3) return false;

  if (records[0].type != "add" || records[1].type != "update" || records[2].type != "delete") {
    return false;
  }

  Object.unobserve(test, callback);

  return true;
})();

function createObserversLookup(obj) {
  var value = {};

  try {
    Object.defineProperty(obj, "__observers__", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    });
  } catch (_) {}

  return value;
}

function createObserverLookup(obj) {
  var value = new OoObjectObserver(obj);

  try {
    Object.defineProperty(obj, "__observer__", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    });
  } catch (_) {}

  return value;
}

var ObserverLocator = exports.ObserverLocator = (function () {
  function ObserverLocator(taskQueue, eventManager, dirtyChecker, observationAdapters) {
    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
    this.observationAdapters = observationAdapters;
  }

  _prototypeProperties(ObserverLocator, {
    inject: {
      value: function inject() {
        return [TaskQueue, EventManager, DirtyChecker, All.of(ObjectObservationAdapter)];
      },
      writable: true,
      configurable: true
    }
  }, {
    getObserversLookup: {
      value: function getObserversLookup(obj) {
        return obj.__observers__ || createObserversLookup(obj);
      },
      writable: true,
      configurable: true
    },
    getObserver: {
      value: function getObserver(obj, propertyName) {
        var observersLookup = this.getObserversLookup(obj);

        if (propertyName in observersLookup) {
          return observersLookup[propertyName];
        }

        return observersLookup[propertyName] = this.createPropertyObserver(obj, propertyName);
      },
      writable: true,
      configurable: true
    },
    getObservationAdapter: {
      value: function getObservationAdapter(obj, propertyName) {
        var i, ii, observationAdapter;
        for (i = 0, ii = this.observationAdapters.length; i < ii; i++) {
          observationAdapter = this.observationAdapters[i];
          if (observationAdapter.handlesProperty(obj, propertyName)) return observationAdapter;
        }
        return null;
      },
      writable: true,
      configurable: true
    },
    createPropertyObserver: {
      value: function createPropertyObserver(obj, propertyName) {
        var observerLookup, descriptor, handler, observationAdapter;

        if (obj instanceof Element) {
          handler = this.eventManager.getElementHandler(obj);
          if (handler) {
            return new ElementObserver(handler, obj, propertyName);
          }
        }

        descriptor = Object.getPropertyDescriptor(obj, propertyName);
        if (descriptor && (descriptor.get || descriptor.set)) {
          observationAdapter = this.getObservationAdapter(obj, propertyName);
          if (observationAdapter) return observationAdapter.getObserver(obj, propertyName);
          return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
        }

        if (hasObjectObserve) {
          observerLookup = obj.__observer__ || createObserverLookup(obj);
          return observerLookup.getObserver(propertyName);
        }

        if (obj instanceof Array) {
          observerLookup = this.getArrayObserver(obj);
          return observerLookup.getObserver(propertyName);
        }

        return new SetterObserver(this.taskQueue, obj, propertyName);
      },
      writable: true,
      configurable: true
    },
    getArrayObserver: {
      value: (function (_getArrayObserver) {
        var _getArrayObserverWrapper = function getArrayObserver() {
          return _getArrayObserver.apply(this, arguments);
        };

        _getArrayObserverWrapper.toString = function () {
          return _getArrayObserver.toString();
        };

        return _getArrayObserverWrapper;
      })(function (array) {
        if ("__array_observer__" in array) {
          return array.__array_observer__;
        }

        return array.__array_observer__ = getArrayObserver(this.taskQueue, array);
      }),
      writable: true,
      configurable: true
    }
  });

  return ObserverLocator;
})();
var ObjectObservationAdapter = exports.ObjectObservationAdapter = (function () {
  function ObjectObservationAdapter() {}

  _prototypeProperties(ObjectObservationAdapter, null, {
    handlesProperty: {
      value: function handlesProperty(object, propertyName) {
        throw new Error("BindingAdapters must implement handlesProperty(object, propertyName).");
      },
      writable: true,
      configurable: true
    },
    getObserver: {
      value: function getObserver(object, propertyName) {
        throw new Error("BindingAdapters must implement createObserver(object, propertyName).");
      },
      writable: true,
      configurable: true
    }
  });

  return ObjectObservationAdapter;
})();
exports.__esModule = true;