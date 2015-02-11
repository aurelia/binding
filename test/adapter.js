export class TestObservationAdapter {
  handlesProperty(object, propertyName, descriptor) {
    // This adapter handles objects with a truthy handleWithAdapter property.
    return !!object.handleWithAdapter;
  }

  getObserver(object, propertyName, descriptor) {
    if (!this.handlesProperty(object, propertyName, descriptor))
      throw new Error('Check handlesProperty before calling getObserver');
    return 'test-adapter'
  }
}
