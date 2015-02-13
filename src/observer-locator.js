import {TaskQueue} from 'aurelia-task-queue';
import {getArrayObserver} from './array-observation';
import {getMapObserver} from './map-observation';
import {EventManager} from './event-manager';
import {DirtyChecker, DirtyCheckProperty} from './dirty-checking';
import {
  SetterObserver,
  OoObjectObserver,
  OoPropertyObserver,
  ElementObserver
} from './property-observation';
import {All} from 'aurelia-dependency-injection';

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
      if (records.length !== 3)
        return false;

      if (records[0].type != 'add' ||
          records[1].type != 'update' ||
          records[2].type != 'delete') {
        return false;
      }

      Object.unobserve(test, callback);

      return true;
    })();

function createObserversLookup(obj) {
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

  getObserversLookup(obj){
    return obj.__observers__ || createObserversLookup(obj);
  }

  getObserver(obj, propertyName){
    var observersLookup = this.getObserversLookup(obj);

    if(propertyName in observersLookup){
      return observersLookup[propertyName];
    }

    return observersLookup[propertyName] = this.createPropertyObserver(
      obj,
      propertyName
      );
  }

  getObservationAdapter(obj, propertyName) {
    var i, ii, observationAdapter;
    for(i = 0, ii = this.observationAdapters.length; i < ii; i++){
      observationAdapter = this.observationAdapters[i];
      if (observationAdapter.handlesProperty(obj, propertyName))
        return observationAdapter;
    }
    return null;
  }

  createPropertyObserver(obj, propertyName){
    var observerLookup, descriptor, handler, observationAdapter;

    if(obj instanceof Element){
      handler = this.eventManager.getElementHandler(obj);
      if(handler){
        return new ElementObserver(handler, obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);
    if(descriptor && (descriptor.get || descriptor.set)){
      // attempt to use an adapter before resorting to dirty checking.
      observationAdapter = this.getObservationAdapter(obj, propertyName);
      if (observationAdapter)
        return observationAdapter.getObserver(obj, propertyName);
      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    }

    if(hasObjectObserve){
      observerLookup = obj.__observer__ || createObserverLookup(obj, this);
      return observerLookup.getObserver(propertyName, descriptor);
    }

    if(obj instanceof Array){
      observerLookup = this.getArrayObserver(obj);
      return observerLookup.getObserver(propertyName);
    }else if(obj instanceof Map){
      observerLookup = this.getMapObserver(obj);
      return observerLookup.getObserver(propertyName);
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
  handlesProperty(object, propertyName) {
    throw new Error('BindingAdapters must implement handlesProperty(object, propertyName).');
  }

  getObserver(object, propertyName) {
    throw new Error('BindingAdapters must implement createObserver(object, propertyName).');
  }
}
