import * as core from 'core-js';
import {subscriberCollection} from './subscriber-collection';

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
    var oldValue = this.currentValue;

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
    var oldValue = this.oldValue,
        newValue = this.currentValue;

    this.queued = false;

    this.callSubscribers(newValue, oldValue);
  }

  subscribe(context, callable) {
    if(!this.observing){
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

export class OoObjectObserver {
  constructor(obj, observerLocator){
    this.obj = obj;
    this.observerLocator = observerLocator;
    this.observers = {};
    this.subscribers = 0;
  }

  subscriberAdded(){
    if (this.subscribers === 0) {
      this.handler = this.handleChanges.bind(this);
      try {
        Object.observe(this.obj, this.handler, ['update', 'add']);
      } catch(_) {}
    }

    this.subscribers++;
  }

  subscriberRemoved(propertyName, callback) {
    this.subscribers--;

    if (this.subscribers === 0) {
      try {
        Object.unobserve(this.obj, this.handler);
      } catch(_) {}
    }
  }

  getObserver(propertyName, descriptor){
    var propertyObserver = this.observers[propertyName];
    if (!propertyObserver) {
      propertyObserver = this.observers[propertyName] = new OoPropertyObserver(this.obj, propertyName);
    }
    return propertyObserver;
  }

  handleChanges(changes) {
    let properties = {};
    // todo: handle property additions
    for (let i = 0, ii = changes.length; i < ii; i++) {
      let change = changes[i];
      properties[change.name] = change;
    }

    for (let name in properties) {
      let observer = this.observers[name];
      if (!observer) {
        continue;
      }
      let change = properties[name];

      observer.callSubscribers(change.object[name], change.oldValue);
    }
  }
}
