import {declarePropertyDependencies} from '../src/computed-observation';
import {ComputedPropertyObserver} from '../src/computed-observation';
import {createObserverLocator, Person, Foo} from './shared';
import {initialize} from 'aurelia-pal-browser';

describe('declarePropertyDependencies', () => {
  beforeAll(() => initialize());

  it('should declare dependencies for properties with a getter', () => {
    var dependencies = ['firstName', 'lastName'],
        person = new Person();
    declarePropertyDependencies(Person, 'fullName', dependencies);
    expect(Object.getOwnPropertyDescriptor(person.constructor.prototype, 'fullName').get.dependencies)
      .toBe(dependencies);
  });

  it('should declare dependencies for properties with a setter', () => {
    var dependencies = ['baz'],
        foo = new Foo();

    declarePropertyDependencies(Foo, 'bar', dependencies);
    expect(Object.getOwnPropertyDescriptor(foo.constructor.prototype, 'bar').get.dependencies)
      .toBe(dependencies);
  });
});

describe('ComputedObservationAdapter', () => {
  var person, observer, locator;

  beforeAll(() => {
    locator = createObserverLocator();
    person = new Person();
    observer = locator.getObserver(person, 'fullName');
  });

  it('should be an ComputedPropertyObserver', () => {
    expect(observer instanceof ComputedPropertyObserver).toBe(true);
  });

  it('gets the value', () => {
    expect(observer.getValue()).toBe(person.fullName);
  });

  it('sets the value', () => {
    var foo = new Foo(),
        fooObserver = locator.getObserver(foo, 'bar');

    fooObserver.setValue(7);

    expect(foo.bar).toBe(7);
  });

  it('notifies when value changes', done => {
    var callback = callback = jasmine.createSpy('callback'),
        oldValue = observer.getValue();

    expect(observer.oldValue).toBeUndefined();
    observer.subscribe(callback);
    expect(observer.oldValue).toBe(observer.getValue());

    person.lastName = 'Dough';
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(person.fullName, oldValue);
      oldValue = observer.getValue();
      person.firstName = 'Jon';
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(person.fullName, oldValue);
        observer.unsubscribe(callback);
        expect(observer.oldValue).toBeUndefined();
        done();
      }, 0);
    }, 0);
  });
});
