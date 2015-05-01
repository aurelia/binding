System.register(['aurelia-task-queue', './environment', './array-observation', './map-observation', './event-manager', './dirty-checking', './property-observation', './element-observation', 'aurelia-dependency-injection', './computed-observation'], function (_export) {
  var TaskQueue, hasObjectObserve, getArrayObserver, getMapObserver, EventManager, DirtyChecker, DirtyCheckProperty, SetterObserver, OoObjectObserver, OoPropertyObserver, SelectValueObserver, CheckedObserver, ValueAttributeObserver, XLinkAttributeObserver, DataAttributeObserver, StyleObserver, All, hasDeclaredDependencies, ComputedPropertyObserver, _classCallCheck, ObserverLocator, ObjectObservationAdapter;

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
    var value = new OoObjectObserver(obj, observerLocator);

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

  return {
    setters: [function (_aureliaTaskQueue) {
      TaskQueue = _aureliaTaskQueue.TaskQueue;
    }, function (_environment) {
      hasObjectObserve = _environment.hasObjectObserve;
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
    }, function (_elementObservation) {
      SelectValueObserver = _elementObservation.SelectValueObserver;
      CheckedObserver = _elementObservation.CheckedObserver;
      ValueAttributeObserver = _elementObservation.ValueAttributeObserver;
      XLinkAttributeObserver = _elementObservation.XLinkAttributeObserver;
      DataAttributeObserver = _elementObservation.DataAttributeObserver;
      StyleObserver = _elementObservation.StyleObserver;
    }, function (_aureliaDependencyInjection) {
      All = _aureliaDependencyInjection.All;
    }, function (_computedObservation) {
      hasDeclaredDependencies = _computedObservation.hasDeclaredDependencies;
      ComputedPropertyObserver = _computedObservation.ComputedPropertyObserver;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

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
      ObserverLocator = (function () {
        function ObserverLocator(taskQueue, eventManager, dirtyChecker, observationAdapters) {
          _classCallCheck(this, ObserverLocator);

          this.taskQueue = taskQueue;
          this.eventManager = eventManager;
          this.dirtyChecker = dirtyChecker;
          this.observationAdapters = observationAdapters;
        }

        ObserverLocator.inject = function inject() {
          return [TaskQueue, EventManager, DirtyChecker, All.of(ObjectObservationAdapter)];
        };

        ObserverLocator.prototype.getObserversLookup = function getObserversLookup(obj) {
          return obj.__observers__ || createObserversLookup(obj);
        };

        ObserverLocator.prototype.getObserver = function getObserver(obj, propertyName) {
          var observersLookup = this.getObserversLookup(obj);

          if (propertyName in observersLookup) {
            return observersLookup[propertyName];
          }

          return observersLookup[propertyName] = this.createPropertyObserver(obj, propertyName);
        };

        ObserverLocator.prototype.getObservationAdapter = function getObservationAdapter(obj, propertyName, descriptor) {
          var i, ii, observationAdapter;
          for (i = 0, ii = this.observationAdapters.length; i < ii; i++) {
            observationAdapter = this.observationAdapters[i];
            if (observationAdapter.handlesProperty(obj, propertyName, descriptor)) {
              return observationAdapter;
            }
          }
          return null;
        };

        ObserverLocator.prototype.createPropertyObserver = function createPropertyObserver(obj, propertyName) {
          var observerLookup, descriptor, handler, observationAdapter, xlinkResult;

          if (obj instanceof Element) {
            handler = this.eventManager.getElementHandler(obj, propertyName);
            if (propertyName === 'value' && obj.tagName.toLowerCase() === 'select') {
              return new SelectValueObserver(obj, handler, this);
            }
            if (propertyName === 'checked' && obj.tagName.toLowerCase() === 'input') {
              return new CheckedObserver(obj, handler, this);
            }
            if (handler) {
              return new ValueAttributeObserver(obj, propertyName, handler);
            }
            xlinkResult = /^xlink:(.+)$/.exec(propertyName);
            if (xlinkResult) {
              return new XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
            }
            if (/^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof SVGElement) {
              return new DataAttributeObserver(obj, propertyName);
            }
            if (propertyName === 'style' || propertyName === 'css') {
              return new StyleObserver(obj, propertyName);
            }
          }

          descriptor = Object.getPropertyDescriptor(obj, propertyName);

          if (hasDeclaredDependencies(descriptor)) {
            return new ComputedPropertyObserver(obj, propertyName, descriptor, this);
          }

          if (descriptor && (descriptor.get || descriptor.set)) {
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
            if (propertyName === 'length') {
              return this.getArrayObserver(obj).getLengthObserver();
            } else {
              return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
            }
          } else if (obj instanceof Map) {
            if (propertyName === 'size') {
              return this.getMapObserver(obj).getLengthObserver();
            } else {
              return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
            }
          }

          return new SetterObserver(this.taskQueue, obj, propertyName);
        };

        ObserverLocator.prototype.getArrayObserver = (function (_getArrayObserver) {
          function getArrayObserver(_x) {
            return _getArrayObserver.apply(this, arguments);
          }

          getArrayObserver.toString = function () {
            return _getArrayObserver.toString();
          };

          return getArrayObserver;
        })(function (array) {
          if ('__array_observer__' in array) {
            return array.__array_observer__;
          }

          return array.__array_observer__ = getArrayObserver(this.taskQueue, array);
        });

        ObserverLocator.prototype.getMapObserver = (function (_getMapObserver) {
          function getMapObserver(_x2) {
            return _getMapObserver.apply(this, arguments);
          }

          getMapObserver.toString = function () {
            return _getMapObserver.toString();
          };

          return getMapObserver;
        })(function (map) {
          if ('__map_observer__' in map) {
            return map.__map_observer__;
          }

          return map.__map_observer__ = getMapObserver(this.taskQueue, map);
        });

        return ObserverLocator;
      })();

      _export('ObserverLocator', ObserverLocator);

      ObjectObservationAdapter = (function () {
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

      _export('ObjectObservationAdapter', ObjectObservationAdapter);
    }
  };
});