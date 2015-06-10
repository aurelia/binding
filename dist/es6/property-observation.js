import core from 'core-js';

export class SetterObserver {
  constructor(taskQueue, obj, propertyName){
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbacks = [];
    this.queued = false;
    this.observing = false;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    this.obj[this.propertyName] = newValue;
  }

  getterValue(){
    return this.currentValue;
  }

  setterValue(newValue){
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

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.currentValue;

    this.queued = false;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);

    if(!this.observing){
      this.convertProperty();
    }

    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  convertProperty(){
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

export class OoPropertyObserver {
  constructor(obj, propertyName, subscribe){
    this.obj = obj;
    this.propertyName = propertyName;
    this.subscribe = subscribe;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    this.obj[this.propertyName] = newValue;
  }
}

export class OoObjectObserver {
  constructor(obj, observerLocator){
    this.obj = obj;
    this.observerLocator = observerLocator;
    this.observers = {};
    this.callbacks = {};
    this.callbackCount = 0;
  }

  subscribe(propertyName, callback){
    if (this.callbacks[propertyName]) {
      this.callbacks[propertyName].push(callback);
    } else {
      this.callbacks[propertyName] = [callback];
      this.callbacks[propertyName].oldValue = this.obj[propertyName];
    }

    if (this.callbackCount === 0) {
      this.handler = this.handleChanges.bind(this);
      try {
        Object.observe(this.obj, this.handler, ['update', 'add']);
      } catch(_) {}
    }

    this.callbackCount++;

    return this.unsubscribe.bind(this, propertyName, callback);
  }

  unsubscribe(propertyName, callback) {
    var callbacks = this.callbacks[propertyName],
        index = callbacks.indexOf(callback);
    if (index === -1) {
      return;
    }

    callbacks.splice(index, 1);
    if (callbacks.count = 0) {
      callbacks.oldValue = null;
      this.callbacks[propertyName] = null;
    }

    this.callbackCount--;
    if (this.callbackCount === 0) {
      try {
        Object.unobserve(this.obj, this.handler);
      } catch(_) {}
    }
  }

  getObserver(propertyName, descriptor){
    var propertyObserver = this.observers[propertyName];
    if (!propertyObserver) {
      if (descriptor) {
        propertyObserver = this.observers[propertyName] = new OoPropertyObserver(this.obj, propertyName, this.subscribe.bind(this, propertyName));
      } else {
        propertyObserver = this.observers[propertyName] = new UndefinedPropertyObserver(this, this.obj, propertyName);
      }
    }
    return propertyObserver;
  }

  handleChanges(changes) {
    var properties = {}, i, ii, change, propertyName, oldValue, newValue, callbacks;

    for(i = 0, ii = changes.length; i < ii; i++){
      change = changes[i];
      properties[change.name] = change;
    }

    for(name in properties){
      callbacks = this.callbacks[name];
      if (!callbacks) {
        continue;
      }
      change = properties[name];
      newValue = change.object[name];
      oldValue = change.oldValue;

      for (i = 0, ii = callbacks.length; i < ii; i++) {
        callbacks[i](newValue, oldValue);
      }
    }
  }
}

export class UndefinedPropertyObserver {
  constructor(owner, obj, propertyName){
    this.owner = owner;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbackMap = new Map();
  }

  getValue(){
    // delegate this to the actual observer if possible.
    if (this.actual){
      return this.actual.getValue();
    }
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    // delegate this to the actual observer if possible.
    if (this.actual){
      this.actual.setValue(newValue);
      return;
    }
    // define the property and trigger the callbacks.
    this.obj[this.propertyName] = newValue;
    this.trigger(newValue, undefined);
  }

  trigger(newValue, oldValue){
    var callback;

    // we only care about this event one time:  when the property becomes defined.
    if (this.subscription){
      this.subscription();
    }

    // get the actual observer.
    this.getObserver();

    // invoke the callbacks.
    for(callback of this.callbackMap.keys()) {
      callback(newValue, oldValue);
    }
  }

  getObserver() {
    var callback, observerLocator;

    // has the property has been defined?
    if (!Object.getOwnPropertyDescriptor(this.obj, this.propertyName)) {
      return;
    }

    // get the actual observer.
    observerLocator = this.owner.observerLocator;
    delete this.owner.observers[this.propertyName];
    delete observerLocator.getOrCreateObserversLookup(this.obj, observerLocator)[this.propertyName];
    this.actual = observerLocator.getObserver(this.obj, this.propertyName);

    // attach any existing callbacks to the actual observer.
    for(callback of this.callbackMap.keys()) {
      this.callbackMap.set(callback, this.actual.subscribe(callback));
    }
  }

  subscribe(callback){
    // attempt to get the actual observer in case the property has become
    // defined since the ObserverLocator returned [this].
    if (!this.actual) {
      this.getObserver();
    }

    // if we have the actual observer, use it.
    if (this.actual){
      return this.actual.subscribe(callback);
    }

    // start listening for the property to become defined.
    if (!this.subscription){
      this.subscription = this.owner.subscribe(this.propertyName, this.trigger.bind(this));
    }

    // cache the callback.
    this.callbackMap.set(callback, null);

    // return the method to dispose the subscription.
    return () => {
      var actualDispose = this.callbackMap.get(callback);
      if (actualDispose)
        actualDispose();
      this.callbackMap.delete(callback);
    };
  }
}
