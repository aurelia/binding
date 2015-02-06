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
  constructor(obj){
    this.obj = obj;
    this.observers = {};
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

  getObserver(propertyName){
    var propertyObserver = this.observers[propertyName]
      || (this.observers[propertyName] = new OoPropertyObserver(this, this.obj, propertyName));

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

export class ElementObserver {
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
