export class TestObservationAdapter {
  handlesProperty(object, propertyName) {
    // This adapter handles objects with a truthy handleWithAdapter property.
    return !!object.handleWithAdapter;
  }

  getObserver(object, propertyName) {
    if (!this.handlesProperty(object, propertyName))
      throw new Error('Check handlesProperty before calling getObserver');
    return 'test-adapter'  
  }
}