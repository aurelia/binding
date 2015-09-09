import {subscriberCollection} from './subscriber-collection';

@subscriberCollection()
export class ComputedPropertyObserver {
  constructor(obj, propertyName, descriptor, observerLocator) {
    this.obj = obj;
    this.propertyName = propertyName;
    this.descriptor = descriptor;
    this.observerLocator = observerLocator;
    this.dependencyChanged = this.evaluate.bind(this);
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    this.obj[this.propertyName] = newValue;
  }

  evaluate() {
    var newValue = this.getValue();
    if (this.oldValue === newValue)
      return;
    this.callSubscribers(newValue, this.oldValue);
    this.oldValue = newValue;
  }

  subscribe(callback) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.getValue();

      let dependencies = this.descriptor.get.dependencies;
      this.observers = [];
      for (let i = 0, ii = dependencies.length; i < ii; i++) {
        let observer = this.observerLocator.getObserver(this.obj, dependencies[i]);
        // todo:  consider throwing when a dependency's observer is an instance of DirtyCheckProperty.
        this.observers.push(observer);
        observer.subscribe(this.dependencyChanged);
      }
    }

    this.addSubscriber(callback);
  }

  unsubscribe(callback) {
    if (this.removeSubscriber(callback) && !this.hasSubscribers()) {
      this.oldValue = undefined;

      let i = this.observers.length;
      while(i--) {
        this.observers[i].unsubscribe(this.dependencyChanged);
      }
      this.observers = null;
    }
  }
}

export function hasDeclaredDependencies(descriptor) {
  return descriptor && descriptor.get && descriptor.get.dependencies && descriptor.get.dependencies.length > 0;
}

export function declarePropertyDependencies(ctor, propertyName, dependencies) {
  var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
  descriptor.get.dependencies = dependencies;
}
