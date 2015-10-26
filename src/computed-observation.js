import {subscriberCollection} from './subscriber-collection';

const computedContext = 'ComputedPropertyObserver';

@subscriberCollection()
export class ComputedPropertyObserver {
  constructor(obj, propertyName, descriptor, observerLocator) {
    this.obj = obj;
    this.propertyName = propertyName;
    this.descriptor = descriptor;
    this.observerLocator = observerLocator;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    this.obj[this.propertyName] = newValue;
  }

  call(context) {
    let newValue = this.getValue();
    if (this.oldValue === newValue)
      return;
    this.callSubscribers(newValue, this.oldValue);
    this.oldValue = newValue;
    return;
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.getValue();

      let dependencies = this.descriptor.get.dependencies;
      this.observers = [];
      for (let i = 0, ii = dependencies.length; i < ii; i++) {
        let observer = this.observerLocator.getObserver(this.obj, dependencies[i]);
        // todo:  consider throwing when a dependency's observer is an instance of DirtyCheckProperty.
        this.observers.push(observer);
        observer.subscribe(computedContext, this);
      }
    }

    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.oldValue = undefined;

      let i = this.observers.length;
      while(i--) {
        this.observers[i].unsubscribe(computedContext, this);
      }
      this.observers = null;
    }
  }
}

export function hasDeclaredDependencies(descriptor) {
  return descriptor && descriptor.get && descriptor.get.dependencies && descriptor.get.dependencies.length > 0;
}

export function declarePropertyDependencies(ctor, propertyName, dependencies) {
  let descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
  descriptor.get.dependencies = dependencies;
}

export function computedFrom(...rest){
  return function(target, key, descriptor){
    descriptor.get.dependencies = rest;
    return descriptor;
  }
}
