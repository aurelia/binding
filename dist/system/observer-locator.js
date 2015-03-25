System.register(["aurelia-task-queue", "./array-observation", "./map-observation", "./event-manager", "./dirty-checking", "./property-observation", "aurelia-dependency-injection", "./computed-observation"], function (_export) {
  var TaskQueue, getArrayObserver, getMapObserver, EventManager, DirtyChecker, DirtyCheckProperty, SetterObserver, OoObjectObserver, OoPropertyObserver, ElementObserver, SelectValueObserver, All, hasDeclaredDependencies, ComputedPropertyObserver, _prototypeProperties, _classCallCheck, hasObjectObserve, ObserverLocator, ObjectObservationAdapter;

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

  function createObserverLookup(obj, observerLocator) {
    var value = new OoObjectObserver(obj, observerLocator);

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

  return {
    setters: [function (_aureliaTaskQueue) {
      TaskQueue = _aureliaTaskQueue.TaskQueue;
    }, function (_arrayObservation) {
      getArrayObserver = _arrayObservation.getArrayObserver;
    }, function (_mapObservation) {
      getMapObserver = _mapObservation.getMapObserver;
    }, function (_eventManager) {
      EventManager = _eventManager.EventManager;
    }, function (_dirtyChecking) {
      DirtyChecker = _dirtyChecking.DirtyChecker;
      DirtyCheckProperty = _dirtyChecking.DirtyCheckProperty;
    }, function (_propertyObservation) {
      SetterObserver = _propertyObservation.SetterObserver;
      OoObjectObserver = _propertyObservation.OoObjectObserver;
      OoPropertyObserver = _propertyObservation.OoPropertyObserver;
      ElementObserver = _propertyObservation.ElementObserver;
      SelectValueObserver = _propertyObservation.SelectValueObserver;
    }, function (_aureliaDependencyInjection) {
      All = _aureliaDependencyInjection.All;
    }, function (_computedObservation) {
      hasDeclaredDependencies = _computedObservation.hasDeclaredDependencies;
      ComputedPropertyObserver = _computedObservation.ComputedPropertyObserver;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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

      hasObjectObserve = (function detectObjectObserve() {
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
        if (records.length !== 3) {
          return false;
        }if (records[0].type != "add" || records[1].type != "update" || records[2].type != "delete") {
          return false;
        }

        Object.unobserve(test, callback);

        return true;
      })();

      ObserverLocator = _export("ObserverLocator", (function () {
        function ObserverLocator(taskQueue, eventManager, dirtyChecker, observationAdapters) {
          _classCallCheck(this, ObserverLocator);

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
            value: function getObservationAdapter(obj, propertyName, descriptor) {
              var i, ii, observationAdapter;
              for (i = 0, ii = this.observationAdapters.length; i < ii; i++) {
                observationAdapter = this.observationAdapters[i];
                if (observationAdapter.handlesProperty(obj, propertyName, descriptor)) {
                  return observationAdapter;
                }
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
                handler = this.eventManager.getElementHandler(obj, propertyName);
                if (propertyName === "value" && obj.tagName.toLowerCase() === "select") {
                  return new SelectValueObserver(obj, handler, this);
                }
                return new ElementObserver(obj, propertyName, handler);
              }

              descriptor = Object.getPropertyDescriptor(obj, propertyName);

              if (hasDeclaredDependencies(descriptor)) {
                return new ComputedPropertyObserver(obj, propertyName, descriptor, this);
              }

              if (descriptor && (descriptor.get || descriptor.set)) {
                // attempt to use an adapter before resorting to dirty checking.
                observationAdapter = this.getObservationAdapter(obj, propertyName, descriptor);
                if (observationAdapter) {
                  return observationAdapter.getObserver(obj, propertyName, descriptor);
                }return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
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

              return new SetterObserver(this.taskQueue, obj, propertyName);
            },
            writable: true,
            configurable: true
          },
          getArrayObserver: {
            value: (function (_getArrayObserver) {
              var _getArrayObserverWrapper = function getArrayObserver(_x) {
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
          },
          getMapObserver: {
            value: (function (_getMapObserver) {
              var _getMapObserverWrapper = function getMapObserver(_x2) {
                return _getMapObserver.apply(this, arguments);
              };

              _getMapObserverWrapper.toString = function () {
                return _getMapObserver.toString();
              };

              return _getMapObserverWrapper;
            })(function (map) {
              if ("__map_observer__" in map) {
                return map.__map_observer__;
              }

              return map.__map_observer__ = getMapObserver(this.taskQueue, map);
            }),
            writable: true,
            configurable: true
          }
        });

        return ObserverLocator;
      })());
      ObjectObservationAdapter = _export("ObjectObservationAdapter", (function () {
        function ObjectObservationAdapter() {
          _classCallCheck(this, ObjectObservationAdapter);
        }

        _prototypeProperties(ObjectObservationAdapter, null, {
          handlesProperty: {
            value: function handlesProperty(object, propertyName, descriptor) {
              throw new Error("BindingAdapters must implement handlesProperty(object, propertyName).");
            },
            writable: true,
            configurable: true
          },
          getObserver: {
            value: function getObserver(object, propertyName, descriptor) {
              throw new Error("BindingAdapters must implement createObserver(object, propertyName).");
            },
            writable: true,
            configurable: true
          }
        });

        return ObjectObservationAdapter;
      })());
    }
  };
});