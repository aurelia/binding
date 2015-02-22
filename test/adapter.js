// An ObjectObservationAdapter for test purposes.
// Delegates work to a real observer provided by the observer locator.
// Adapter handles objects with a truthy "handleWithAdapter" property.
export class TestObservationAdapter {
  constructor(locatorProvider) {
    this.locatorProvider = locatorProvider;
  }

  handlesProperty(object, propertyName, descriptor) {
    return !!object.handleWithAdapter;
  }

  getObserver(object, propertyName, descriptor) {
    var observer;
    if (!this.handlesProperty(object, propertyName, descriptor))
      throw new Error('Check handlesProperty before calling getObserver');
    object.handleWithAdapter = false;
    observer = this.locatorProvider().getObserver(object, propertyName);
    object.handleWithAdapter = true;
    return new AdapterPropertyObserver(observer)
  }
}

export class AdapterPropertyObserver {
  constructor(observer) {
    this.getValue = () => observer.getValue();
    this.setValue = newValue => observer.setValue(newValue);
    this.subscribe = callback => observer.subscribe(callback);
  }
}
