import {TaskQueue} from 'aurelia-task-queue';
import {hasObjectObserve} from './environment';
import {getArrayObserver} from './array-observation';
import {getMapObserver} from './map-observation';
import {EventManager} from './event-manager';
import {DirtyChecker, DirtyCheckProperty} from './dirty-checking';
import {
  SetterObserver,
  OoObjectObserver,
  OoPropertyObserver
} from './property-observation';
import {
  SelectValueObserver,
  CheckedObserver,
  ValueAttributeObserver,
  XLinkAttributeObserver,
  DataAttributeObserver,
  StyleObserver
} from './element-observation';
import {ClassObserver} from './class-observer';
import {All} from 'aurelia-dependency-injection';
import {
  hasDeclaredDependencies,
  ComputedPropertyObserver
} from './computed-observation';
import {isStandardSvgAttribute} from './svg';

if(typeof Object.getPropertyDescriptor !== 'function'){
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
  var value = new OoObjectObserver(obj, observerLocator);

  try{
    Object.defineProperty(obj, "__observer__", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    });
  }catch(_){}

  return value;
}

export class ObserverLocator {
  static inject(){ return [TaskQueue, EventManager, DirtyChecker, All.of(ObjectObservationAdapter)]; }
  constructor(taskQueue, eventManager, dirtyChecker, observationAdapters){
    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
    this.observationAdapters = observationAdapters;
  }

  getObserver(obj, propertyName){
    var observersLookup = obj.__observers__,
        observer;

    if(observersLookup && propertyName in observersLookup){
      return observersLookup[propertyName];
    }

    observer = this.createPropertyObserver(obj, propertyName);

    if (!observer.doNotCache){
      if(observersLookup === undefined){
        observersLookup = this.getOrCreateObserversLookup(obj);
      }

      observersLookup[propertyName] = observer;
    }

    return observer;
  }

  getOrCreateObserversLookup(obj){
    return obj.__observers__ || this.createObserversLookup(obj);
  }

  createObserversLookup(obj) {
    var value = {};

    try{
      Object.defineProperty(obj, "__observers__", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: value
      });
    }catch(_){}

    return value;
  }

  getObservationAdapter(obj, propertyName, descriptor) {
    var i, ii, observationAdapter;
    for(i = 0, ii = this.observationAdapters.length; i < ii; i++){
      observationAdapter = this.observationAdapters[i];
      if (observationAdapter.handlesProperty(obj, propertyName, descriptor))
        return observationAdapter;
    }
    return null;
  }

  createPropertyObserver(obj, propertyName){
    var observerLookup, descriptor, handler, observationAdapter, xlinkResult;

    if(obj instanceof Element){
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
      if (propertyName ==='checked' && obj.tagName.toLowerCase() === 'input') {
        return new CheckedObserver(obj, handler, this);
      }
      if (handler) {
        return new ValueAttributeObserver(obj, propertyName, handler);
      }
      xlinkResult = /^xlink:(.+)$/.exec(propertyName);
      if (xlinkResult) {
        return new XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
      }
      if (/^\w+:|^data-|^aria-/.test(propertyName)
        || obj instanceof SVGElement && isStandardSvgAttribute(obj.nodeName, propertyName)) {
        return new DataAttributeObserver(obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);

    if (hasDeclaredDependencies(descriptor)) {
      return new ComputedPropertyObserver(obj, propertyName, descriptor, this)
    }

    let existingGetterOrSetter;
    if(descriptor && (existingGetterOrSetter = descriptor.get || descriptor.set)){
      if(existingGetterOrSetter.getObserver){
        return existingGetterOrSetter.getObserver(obj);
      }

      // attempt to use an adapter before resorting to dirty checking.
      observationAdapter = this.getObservationAdapter(obj, propertyName, descriptor);
      if (observationAdapter)
        return observationAdapter.getObserver(obj, propertyName, descriptor);
      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    }

    if(hasObjectObserve){
      observerLookup = obj.__observer__ || createObserverLookup(obj, this);
      return observerLookup.getObserver(propertyName, descriptor);
    }

    if(obj instanceof Array){
      if (propertyName === 'length') {
        return this.getArrayObserver(obj).getLengthObserver();
      } else {
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }else if(obj instanceof Map){
      if (propertyName === 'size') {
        return this.getMapObserver(obj).getLengthObserver();
      } else {
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }

    return new SetterObserver(this.taskQueue, obj, propertyName);
  }

  getArrayObserver(array){
    if('__array_observer__' in array){
      return array.__array_observer__;
    }

    return array.__array_observer__ = getArrayObserver(this.taskQueue, array);
  }

  getMapObserver(map){
    if('__map_observer__' in map){
      return map.__map_observer__;
    }

    return map.__map_observer__ = getMapObserver(this.taskQueue, map);
  }
}

export class ObjectObservationAdapter {
  handlesProperty(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement handlesProperty(object, propertyName).');
  }

  getObserver(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement createObserver(object, propertyName).');
  }
}
