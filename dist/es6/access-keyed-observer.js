export class AccessKeyedObserver {
  constructor(objectInfo, keyInfo, observerLocator, evaluate) {
    this.objectInfo = objectInfo;
    this.keyInfo = keyInfo;
    this.evaluate = evaluate;
    this.observerLocator = observerLocator;

    if (keyInfo.observer) {
      this.disposeKey = keyInfo.observer.subscribe(newValue => this.objectOrKeyChanged(undefined, newValue));
    }

    if (objectInfo.observer) {
      this.disposeObject = objectInfo.observer.subscribe(newValue => this.objectOrKeyChanged(newValue));
    }

    this.updatePropertySubscription(objectInfo.value, keyInfo.value);
  }

  updatePropertySubscription(object, key) {
    var callback;
    if (this.disposeProperty) {
      this.disposeProperty();
      this.disposeProperty = null;
    }
    if (object instanceof Object) {  // objects, arrays, etc - (non primitives)
      this.disposeProperty = this.observerLocator.getObserver(object, key)
        .subscribe(() => this.notify());
    }
  }

  objectOrKeyChanged(object, key) {
    var oo, ko;
    object = object || ((oo = this.objectInfo.observer) && oo.getValue ? oo.getValue() : this.objectInfo.value);
    key = key || ((ko = this.keyInfo.observer) && ko.getValue ? ko.getValue() : this.keyInfo.value);
    this.updatePropertySubscription(object, key);

    this.notify();
  }

  subscribe(callback) {
    var that = this;
    that.callback = callback;
    return function() {
      that.callback = null;
    };
  }

  notify() {
    var callback = this.callback;

    if(callback){
      callback(this.evaluate());
    }
  }

  dispose() {
    this.objectInfo = null;
    this.keyInfo = null;
    this.evaluate = null;
    this.observerLocator = null;
    if (this.disposeObject) {
      this.disposeObject();
    }
    if (this.disposeKey) {
      this.disposeKey();
    }
    if (this.disposeProperty) {
      this.disposeProperty();
    }
  }
}
