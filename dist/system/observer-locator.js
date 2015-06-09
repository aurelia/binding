System.register(['aurelia-task-queue', './environment', './array-observation', './map-observation', './event-manager', './dirty-checking', './property-observation', './element-observation', './class-observer', 'aurelia-dependency-injection', './computed-observation', './svg'], function (_export) {
  'use strict';

  var TaskQueue, hasObjectObserve, _getArrayObserver, _getMapObserver, EventManager, DirtyChecker, DirtyCheckProperty, SetterObserver, OoObjectObserver, OoPropertyObserver, SelectValueObserver, CheckedObserver, ValueAttributeObserver, XLinkAttributeObserver, DataAttributeObserver, StyleObserver, ClassObserver, All, hasDeclaredDependencies, ComputedPropertyObserver, isStandardSvgAttribute, ObserverLocator, ObjectObservationAdapter;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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
      _getArrayObserver = _arrayObservation.getArrayObserver;
    }, function (_mapObservation) {
      _getMapObserver = _mapObservation.getMapObserver;
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
    }, function (_classObserver) {
      ClassObserver = _classObserver.ClassObserver;
    }, function (_aureliaDependencyInjection) {
      All = _aureliaDependencyInjection.All;
    }, function (_computedObservation) {
      hasDeclaredDependencies = _computedObservation.hasDeclaredDependencies;
      ComputedPropertyObserver = _computedObservation.ComputedPropertyObserver;
    }, function (_svg) {
      isStandardSvgAttribute = _svg.isStandardSvgAttribute;
    }],
    execute: function () {

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
              return new ClassObserver(obj);
            }
            if (propertyName === 'style' || propertyName === 'css') {
              return new StyleObserver(obj, propertyName);
            }
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
            if (/^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof SVGElement && isStandardSvgAttribute(obj.nodeName, propertyName)) {
              return new DataAttributeObserver(obj, propertyName);
            }
          }

          descriptor = Object.getPropertyDescriptor(obj, propertyName);

          if (hasDeclaredDependencies(descriptor)) {
            return new ComputedPropertyObserver(obj, propertyName, descriptor, this);
          }

          var existingGetterOrSetter = undefined;
          if (descriptor && (existingGetterOrSetter = descriptor.get || descriptor.set)) {
            if (existingGetterOrSetter.getObserver) {
              return existingGetterOrSetter.getObserver(obj);
            }

            observationAdapter = this.getObservationAdapter(obj, propertyName, descriptor);
            if (observationAdapter) return observationAdapter.getObserver(obj, propertyName, descriptor);
            return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
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

        ObserverLocator.prototype.getArrayObserver = function getArrayObserver(array) {
          if ('__array_observer__' in array) {
            return array.__array_observer__;
          }

          return array.__array_observer__ = _getArrayObserver(this.taskQueue, array);
        };

        ObserverLocator.prototype.getMapObserver = function getMapObserver(map) {
          if ('__map_observer__' in map) {
            return map.__map_observer__;
          }

          return map.__map_observer__ = _getMapObserver(this.taskQueue, map);
        };

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