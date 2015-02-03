export class DirtyChecker {
  constructor(){
    this.tracked = [];
    this.checkDelay = 120;
  }

  addProperty(property){
    var tracked = this.tracked;

    tracked.push(property);

    if(tracked.length === 1) {
      this.scheduleDirtyCheck();
    }
  }

  removeProperty(property){
    var tracked = this.tracked;
    tracked.splice(tracked.indexOf(property), 1);
  }

  scheduleDirtyCheck(){
    setTimeout(() => this.check(), this.checkDelay);
  }

  check() {
    var tracked = this.tracked,
        i = tracked.length;

    while(i--) {
      var current = tracked[i];

      if(current.isDirty()){
        current.call();
      }
    }

    if(tracked.length) {
      this.scheduleDirtyCheck();
    }
  }
}

export class DirtyCheckProperty {
  constructor(dirtyChecker, obj, propertyName){
    this.dirtyChecker = dirtyChecker;
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

  isDirty(){
    return this.oldValue !== this.getValue();
  }

  beginTracking(){
    this.tracking = true;
    this.oldValue = this.newValue = this.getValue();
    this.dirtyChecker.addProperty(this);
  }

  endTracking(){
    this.tracking = false;
    this.dirtyChecker.removeProperty(this);
  }

  subscribe(callback){
    var callbacks = this.callbacks,
        that = this;

    callbacks.push(callback);

    if(!this.tracking){
      this.beginTracking();
    }

    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
      if(callbacks.length === 0){
        that.endTracking();
      }
    };
  }
}
