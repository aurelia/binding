export class ComputedPropertyObserver {
  constructor(obj, propertyName, descriptor, observerLocator){
    this.obj = obj;
    this.propertyName = propertyName;
    this.descriptor = descriptor;
    this.observerLocator = observerLocator;
    this.callbacks = [];
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    throw new Error('Computed properties cannot be assigned.');
  }

  trigger(newValue, oldValue){
    var callbacks = this.callbacks,
        i = callbacks.length;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  evaluate() {
    var newValue = this.getValue();
    if (this.oldValue === newValue)
      return;
    this.trigger(newValue, this.oldValue);
    this.oldValue = newValue;
  }

  subscribe(callback){
    var dependencies, i, ii;

    this.callbacks.push(callback);

    if (this.oldValue === undefined) {
      this.oldValue = this.getValue();
      this.subscriptions = [];

      dependencies = this.descriptor.get.dependencies;
      for (i = 0, ii = dependencies.length; i < ii; i++) {
        // todo:  consider throwing when a dependency's observer is an instance of DirtyCheckProperty.
        this.subscriptions.push(this.observerLocator.getObserver(this.obj, dependencies[i]).subscribe(() => this.evaluate()));
      }
    }

    return () => {
      this.callbacks.splice(this.callbacks.indexOf(callback), 1);
      if (this.callbacks.length > 0)
        return;
      while(this.subscriptions.length) {
        this.subscriptions.pop()();
      }
      this.oldValue = undefined;
    };
  }
}

export function hasDeclaredDependencies(descriptor) {
  return descriptor && descriptor.get && !descriptor.set
    && descriptor.get.dependencies && descriptor.get.dependencies.length;
}

export function declarePropertyDependencies(ctor, propertyName, dependencies) {
  var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
  if (descriptor.set)
    throw new Error('The property cannot have a setter function.');
  descriptor.get.dependencies = dependencies;
}
