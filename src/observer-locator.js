import * as LogManager from 'aurelia-logging';
import {DOM} from 'aurelia-pal';
import {TaskQueue} from 'aurelia-task-queue';
import {getArrayObserver} from './array-observation';
import {getMapObserver} from './map-observation';
import {getSetObserver} from './set-observation';
import {EventManager} from './event-manager';
import {Parser} from './parser';
import {DirtyChecker, DirtyCheckProperty} from './dirty-checking';
import {
  SetterObserver,
  PrimitiveObserver,
  propertyAccessor
} from './property-observation';
import {SelectValueObserver} from './select-value-observer';
import {CheckedObserver} from './checked-observer';
import {
  ValueAttributeObserver,
  XLinkAttributeObserver,
  DataAttributeObserver,
  StyleObserver,
  dataAttributeAccessor
} from './element-observation';
import {ClassObserver} from './class-observer';
import {
  hasDeclaredDependencies,
  createComputedObserver
} from './computed-observation';
import {SVGAnalyzer} from './svg';

export class ObserverLocator {
  static inject = [TaskQueue, EventManager, DirtyChecker, SVGAnalyzer, Parser];

  /**
   * @param {TaskQueue} taskQueue
   * @param {EventManager} eventManager
   * @param {DirtyChecker} dirtyChecker
   * @param {SVGAnalyzer} svgAnalyzer
   * @param {Parser} parser
   */
  constructor(taskQueue, eventManager, dirtyChecker, svgAnalyzer, parser) {
    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
    this.svgAnalyzer = svgAnalyzer;
    this.parser = parser;
    /**@type {ObjectObservationAdapter[]} */
    this.adapters = [];
    this.logger = LogManager.getLogger('observer-locator');
  }

  getObserver(obj, propertyName) {
    let observersLookup = obj.__observers__;
    let observer;

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
  }

  getOrCreateObserversLookup(obj) {
    return obj.__observers__ || this.createObserversLookup(obj);
  }

  createObserversLookup(obj) {
    let value = {};

    if (!Reflect.defineProperty(obj, '__observers__', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    })) {
      this.logger.warn('Cannot add observers to object', obj);
    }

    return value;
  }

  /**@param {ObjectObservationAdapter} adapter */
  addAdapter(adapter) {
    this.adapters.push(adapter);
  }

  getAdapterObserver(obj, propertyName, descriptor) {
    for (let i = 0, ii = this.adapters.length; i < ii; i++) {
      let adapter = this.adapters[i];
      let observer = adapter.getObserver(obj, propertyName, descriptor);
      if (observer) {
        return observer;
      }
    }
    return null;
  }

  createPropertyObserver(obj, propertyName) {
    let descriptor;
    let handler;
    let xlinkResult;

    if (!(obj instanceof Object)) {
      return new PrimitiveObserver(obj, propertyName);
    }

    if (obj instanceof DOM.Element) {
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
      if (propertyName === 'role' && (obj instanceof DOM.Element || obj instanceof DOM.SVGElement)
        || /^\w+:|^data-|^aria-/.test(propertyName)
        || obj instanceof DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)) {
        return new DataAttributeObserver(obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);

    if (hasDeclaredDependencies(descriptor)) {
      return createComputedObserver(obj, propertyName, descriptor, this);
    }

    if (descriptor) {
      const existingGetterOrSetter = descriptor.get || descriptor.set;
      if (existingGetterOrSetter) {
        if (existingGetterOrSetter.getObserver) {
          return existingGetterOrSetter.getObserver(obj);
        }

        // attempt to use an adapter before resorting to dirty checking.
        let adapterObserver = this.getAdapterObserver(obj, propertyName, descriptor);
        if (adapterObserver) {
          return adapterObserver;
        }
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }

    if (obj instanceof Array) {
      if (propertyName === 'length') {
        return this.getArrayObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    } else if (obj instanceof Map) {
      if (propertyName === 'size') {
        return this.getMapObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    } else if (obj instanceof Set) {
      if (propertyName === 'size') {
        return this.getSetObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    }

    return new SetterObserver(this.taskQueue, obj, propertyName);
  }

  getAccessor(obj, propertyName) {
    if (obj instanceof DOM.Element) {
      if (propertyName === 'class'
        || propertyName === 'style' || propertyName === 'css'
        || propertyName === 'value' && (obj.tagName.toLowerCase() === 'input' || obj.tagName.toLowerCase() === 'select')
        || propertyName === 'checked' && obj.tagName.toLowerCase() === 'input'
        || propertyName === 'model' && obj.tagName.toLowerCase() === 'input'
        || /^xlink:.+$/.exec(propertyName)) {
        return this.getObserver(obj, propertyName);
      }
      if (/^\w+:|^data-|^aria-/.test(propertyName)
        || obj instanceof DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)
        || obj.tagName.toLowerCase() === 'img' && propertyName === 'src'
        || obj.tagName.toLowerCase() === 'a' && propertyName === 'href'
      ) {
        return dataAttributeAccessor;
      }
    }
    return propertyAccessor;
  }

  getArrayObserver(array) {
    return getArrayObserver(this.taskQueue, array);
  }

  getMapObserver(map) {
    return getMapObserver(this.taskQueue, map);
  }

  getSetObserver(set) {
    return getSetObserver(this.taskQueue, set);
  }
}

export class ObjectObservationAdapter {
  getObserver(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement getObserver(object, propertyName).');
  }
}
