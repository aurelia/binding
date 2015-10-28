import 'core-js';
import {subscriberCollection} from './subscriber-collection';

export class PrimitiveObserver {
  doNotCache = true;

  constructor(primitive, propertyName) {
    this.primitive = primitive;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.primitive[this.propertyName];
  }

  setValue() {
    let type = typeof this.primitive;
    throw new Error(`The ${this.propertyName} property of a ${type} (${this.primitive}) cannot be assigned.`);
  }

  subscribe() {
  }

  unsubscribe() {
  }
}

@subscriberCollection()
export class SetterObserver {
  constructor(taskQueue, obj, propertyName){
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.queued = false;
    this.observing = false;
  }

  getValue() {
    return this.obj[this.propertyName];
  }

  setValue(newValue) {
    this.obj[this.propertyName] = newValue;
  }

  getterValue() {
    return this.currentValue;
  }

  setterValue(newValue) {
    let oldValue = this.currentValue;

    if(oldValue !== newValue){
      if(!this.queued){
        this.oldValue = oldValue;
        this.queued = true;
        this.taskQueue.queueMicroTask(this);
      }

      this.currentValue = newValue;
    }
  }

  call() {
    let oldValue = this.oldValue;
    let newValue = this.currentValue;

    this.queued = false;

    this.callSubscribers(newValue, oldValue);
  }

  subscribe(context, callable) {
    if(!this.observing) {
      this.convertProperty();
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }

  convertProperty() {
    this.observing = true;
    this.currentValue = this.obj[this.propertyName];
    this.setValue = this.setterValue;
    this.getValue = this.getterValue;

    try{
      Object.defineProperty(this.obj, this.propertyName, {
        configurable: true,
        enumerable: true,
        get: this.getValue.bind(this),
        set: this.setValue.bind(this)
      });
    }catch(_){}
  }
}

@subscriberCollection()
export class OoPropertyObserver {
  constructor(obj, propertyName) {
    this.obj = obj;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.obj[this.propertyName];
  }

  setValue(newValue) {
    this.obj[this.propertyName] = newValue;
  }

  subscribe(context, callable) {
    if (this.addSubscriber(context, callable)) {
      this.obj.__observer__.subscriberAdded();
    }
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable)) {
      this.obj.__observer__.subscriberRemoved();
    }
  }
}

let version = Number.MIN_SAFE_INTEGER;
function ooHandler(changes) {
  version++;
  for (let i = 0, ii = changes.length; i < ii; i++) {
    let change = changes[i];
    let name = change.name;
    let objectObserver = change.object.__observer__;
    let observer;
    if (!objectObserver || !(observer = objectObserver.observers[name]) || observer.__version === version) {
      continue;
    }
    observer.__version = version;
    observer.callSubscribers(change.object[name], change.oldValue);
  }
}

export class OoObjectObserver {
  constructor(obj, observerLocator){
    this.obj = obj;
    this.observerLocator = observerLocator;
    this.observers = {};
    this.subscribers = 0;
  }

  subscriberAdded() {
    if (this.subscribers === 0) {
      try {
        Object.observe(this.obj, ooHandler, ['update', 'add']);
      } catch(_) {}
    }

    this.subscribers++;
  }

  subscriberRemoved(propertyName, callback) {
    this.subscribers--;

    if (this.subscribers === 0) {
      try {
        Object.unobserve(this.obj, ooHandler);
      } catch(_) {}
    }
  }

  getObserver(propertyName, descriptor) {
    let propertyObserver = this.observers[propertyName];
    if (!propertyObserver) {
      propertyObserver = this.observers[propertyName] = new OoPropertyObserver(this.obj, propertyName);
    }
    return propertyObserver;
  }
}
