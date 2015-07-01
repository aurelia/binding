import {declarePropertyDependencies} from '../src/computed-observation';
import {ComputedPropertyObserver} from '../src/computed-observation';
import {createObserverLocator, Person, Foo} from './shared';

describe('declarePropertyDependencies', () => {
  it('should declare dependencies for properties with a getter and no setter', () => {
    var dependencies = ['firstName', 'lastName'],
        person = new Person();
    declarePropertyDependencies(Person, 'fullName', dependencies);
    expect(Object.getOwnPropertyDescriptor(person.constructor.prototype, 'fullName').get.dependencies)
      .toBe(dependencies);
  });

  it('should not declare dependencies for properties with a setter', () => {
    expect(() => declarePropertyDependencies(Foo, 'bar', ['baz']))
      .toThrow(new Error('The property cannot have a setter function.'));
  });
});

describe('ComputedObservationAdapter', () => {
  var person, observer;

  beforeAll(() => {
    var locator = createObserverLocator();
    person = new Person();
    observer = locator.getObserver(person, 'fullName');
  });

  it('should be an ComputedPropertyObserver', () => {
    expect(observer instanceof ComputedPropertyObserver).toBe(true);
  });

  it('gets the value', () => {
    expect(observer.getValue()).toBe(person.fullName);
  });

  it('cannot set the value', () => {
    expect(() => observer.setValue('foo')).toThrow(new Error('Computed properties cannot be assigned.'));
  });

  it('notifies when value changes', done => {
    var callback = callback = jasmine.createSpy('callback'),
        dispose,
        oldValue = observer.getValue();

    expect(observer.oldValue).toBeUndefined();
    dispose = observer.subscribe(callback);
    expect(observer.oldValue).toBe(observer.getValue());

    person.lastName = 'Dough';
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(person.fullName, oldValue);
      oldValue = observer.getValue();
      person.firstName = 'Jon';
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(person.fullName, oldValue);
        dispose();
        expect(observer.oldValue).toBeUndefined();
        done();
      }, 0);
    }, 0);
  });
});
