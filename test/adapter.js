// An ObjectObservationAdapter for test purposes.
// Delegates work to a real observer provided by the observer locator.
export class TestObservationAdapter {
  constructor(locatorProvider) {
    this.locatorProvider = locatorProvider;
  }

  getObserver(object, propertyName, descriptor) {
    if (!object.handleWithAdapter) {
      return null;
    }
    object.handleWithAdapter = false;
    let observer = this.locatorProvider().getObserver(object, propertyName);
    object.handleWithAdapter = true;
    observer.___from_adapter = true; // for unit-tests
    return observer;
  }
}
