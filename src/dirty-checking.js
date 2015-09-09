import {subscriberCollection} from './subscriber-collection';

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

@subscriberCollection()
export class DirtyCheckProperty {
  constructor(dirtyChecker, obj, propertyName) {
    this.dirtyChecker = dirtyChecker;
    this.obj = obj;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.obj[this.propertyName];
  }

  setValue(newValue) {
    this.obj[this.propertyName] = newValue;
  }

  call() {
    let oldValue = this.oldValue;
    let newValue = this.getValue();

    this.callSubscribers(newValue, oldValue);

    this.oldValue = newValue;
  }

  isDirty() {
    return this.oldValue !== this.obj[this.propertyName];
  }

  subscribe(callback) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.getValue();
      this.dirtyChecker.addProperty(this);
    }
    this.addSubscriber(callback);
  }

  unsubscribe(callback) {
    if (this.removeSubscriber(callback) && !this.hasSubscribers()) {
      this.dirtyChecker.removeProperty(this);
    }
  }
}
