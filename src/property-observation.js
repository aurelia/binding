export class SetterObserver {
  constructor(taskQueue, obj, propertyName){
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbacks = [];
    this.queued = false;
    this.observing = false;
    this.isSVG = obj instanceof SVGElement;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    if(this.isSVG){
      this.obj.setAttributeNS(null, this.propertyName, newValue);
    }else{
      this.obj[this.propertyName] = newValue;
    }
  }

  getterValue(){
    return this.currentValue;
  }

  setterValue(newValue){
    var oldValue = this.currentValue;

    if(oldValue != newValue){
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

export class OoObjectObserver {
  constructor(obj, observerLocator){
    this.obj = obj;
    this.observers = {};
    this.observerLocator = observerLocator;
  }

  subscribe(propertyObserver, callback){
    var callbacks = propertyObserver.callbacks;
    callbacks.push(callback);

    if(!this.observing){
      this.observing = true;
      try{
        Object.observe(this.obj, changes => this.handleChanges(changes), ['update', 'add']);
      }catch(_){}
    }

    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  getObserver(propertyName, descriptor){
    var propertyObserver = this.observers[propertyName];
    if (!propertyObserver) {
      if (descriptor) {
        propertyObserver = this.observers[propertyName] = new OoPropertyObserver(this, this.obj, propertyName);
      } else {
        propertyObserver = this.observers[propertyName] = new UndefinedPropertyObserver(this, this.obj, propertyName);
      }
    }
    return propertyObserver;
  }

  handleChanges(changeRecords){
    var updates = {},
        observers = this.observers,
        i = changeRecords.length;

    while(i--) {
      var change = changeRecords[i],
          name = change.name;

      if(!(name in updates)){
        var observer = observers[name];
        updates[name] = true;
        if(observer){
          observer.trigger(change.object[name], change.oldValue);
        }
      }
    }
  }
}

export class OoPropertyObserver {
  constructor(owner, obj, propertyName){
    this.owner = owner;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbacks = [];
    this.isSVG = obj instanceof SVGElement;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    if(this.isSVG){
      this.obj.setAttributeNS(null, this.propertyName, newValue);
    }else{
      this.obj[this.propertyName] = newValue;
    }
  }

  trigger(newValue, oldValue){
    var callbacks = this.callbacks,
        i = callbacks.length;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  subscribe(callback){
    return this.owner.subscribe(this, callback);
  }
}

export class UndefinedPropertyObserver {
  constructor(owner, obj, propertyName){
    this.owner = owner;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbackMap = new Map();
    this.callbacks = []; // unused here, but required by owner OoObjectObserver.
    this.isSVG = obj instanceof SVGElement;
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
    if(this.isSVG){
      this.obj.setAttributeNS(null, this.propertyName, newValue);
    }else{
      this.obj[this.propertyName] = newValue;
    }
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
    delete observerLocator.getObserversLookup(this.obj, observerLocator)[this.propertyName];
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
      this.subscription = this.owner.subscribe(this);
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

export class ValueAttributeObserver {
  constructor(handler, element, propertyName){
    this.element = element;
    this.propertyName = propertyName;
    this.callbacks = [];
    this.oldValue = element[propertyName];
    this.handler = handler;
  }

  getValue(){
    return this.element[this.propertyName];
  }

  setValue(newValue){
    this.element[this.propertyName] = newValue
    this.call();
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.getValue();

    while(i--) {
      callbacks[i](newValue, oldValue);
    }

    this.oldValue = newValue;
  }

  subscribe(callback){
    var that = this;

    if(!this.disposeHandler){
      this.disposeHandler = this.handler
        .subscribe(this.element, this.propertyName, this.call.bind(this));
    }

    var callbacks = this.callbacks;

    callbacks.push(callback);

    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
      if(callback.length === 0){
        that.disposeHandler();
        that.disposeHandler = null;
      }
    };
  }
}

export class DataAttributeObserver {
  constructor(element, propertyName){
    this.element = element;
    this.propertyName = propertyName;
  }

  getValue(){
    return this.element.getAttribute(this.propertyName);
  }

  setValue(newValue){
    this.element.setAttribute(this.propertyName, newValue);
  }

  subscribe(callback){
    var propertyName = this.propertyName, tagName = this.element.tagName;
    throw new Error(`Cannot observe property ${propertyName} of ${tagName}. No events found.`);
  }
}

DataAttributeObserver.handlesProperty = propertyName => /^(data)|(aria)-/.test(propertyName);
