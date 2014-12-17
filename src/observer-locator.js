import {TaskQueue} from 'aurelia-task-queue';
import {getArrayObserver} from './array-observation';
import {EventManager} from './event-manager';
import {DirtyChecker, DirtyCheckProperty} from './dirty-checking';
import {
  SetterObserver, 
  OoObjectObserver, 
  OoPropertyObserver, 
  ElementObserver
} from './property-observation';

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

  Object.defineProperty(obj, "__observers__", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: value
  });

  return value;
}

function createObserverLookup(obj) {
  var value = new OoObjectObserver(obj);

  Object.defineProperty(obj, "__observer__", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: value
  });

  return value;
}

export class ObserverLocator {
  static inject(){ return [TaskQueue, EventManager, DirtyChecker]; }
  constructor(taskQueue, eventManager, dirtyChecker){
    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
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

  createPropertyObserver(obj, propertyName){
    var observerLookup, descriptor, handler;

    if(obj instanceof Element){
      handler = this.eventManager.getElementHandler(obj);
      if(handler){
        return new ElementObserver(handler, obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);
    if(descriptor && (descriptor.get || descriptor.set)){
      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    }

    if(hasObjectObserve){
      observerLookup = obj.__observer__ || createObserverLookup(obj);
      return observerLookup.getObserver(propertyName);
    }

    if(obj instanceof Array){
      observerLookup = this.getArrayObserver(obj);
      return observerLookup.getObserver(propertyName);
    }

    return new SetterObserver(this.taskQueue, obj, propertyName);
  }

  getArrayObserver(array){
    if('__observer__' in array){
      return array.__observer__;
    }

    return array.__observer__ = getArrayObserver(this.taskQueue, array);
  }
}