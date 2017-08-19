import './setup';
import {
  declarePropertyDependencies,
  computedFrom,
  hasDeclaredDependencies
} from '../src/computed-observation';
import {ExpressionObserver} from '../src/expression-observer';
import {createObserverLocator, Person, Foo} from './shared';

describe('declarePropertyDependencies', () => {
  it('should declare dependencies for properties with a getter', () => {
    class Person {
      constructor() {
        this.firstName = 'John';
        this.lastName = 'Doe';
      }
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    }

    let dependencies = ['firstName', 'lastName'],
        person = new Person();
    declarePropertyDependencies(Person, 'fullName', dependencies);
    expect(Object.getOwnPropertyDescriptor(person.constructor.prototype, 'fullName').get.dependencies)
      .toBe(dependencies);
    expect(hasDeclaredDependencies(Object.getPropertyDescriptor(person, 'fullName'))).toBe(true);
  });

  it('should declare dependencies for properties with a setter', () => {
    class Foo {
      constructor() {
        this._bar = null;
      }
      get bar() {
        return this._bar;
      }
      set bar(newValue) {
        this._bar = newValue;
      }
    }

    let dependencies = ['baz'],
        foo = new Foo();
    declarePropertyDependencies(Foo, 'bar', dependencies);
    expect(Object.getOwnPropertyDescriptor(foo.constructor.prototype, 'bar').get.dependencies)
      .toBe(dependencies);
  });
});

describe('createComputedObserver', () => {
  var person, observer, locator;

  class Person {
    constructor() {
      this.obj = { firstName: 'John', lastName: 'Doe' };
    }
    @computedFrom('obj.firstName', 'obj.lastName')
    get fullName() {
      return `${this.obj.firstName} ${this.obj.lastName}`;
    }
  }

  class Foo {
    constructor() {
      this._bar = null;
    }
    @computedFrom('_bar')
    get bar() {
      return this._bar;
    }
    set bar(newValue) {
      this._bar = newValue;
    }
  }

  beforeAll(() => {
    locator = createObserverLocator();
    person = new Person();
    observer = locator.getObserver(person, 'fullName');
  });

  it('should have declared dependencies after observer is created', () => {
    expect(hasDeclaredDependencies(Object.getPropertyDescriptor(person, 'fullName'))).toBe(true);
  });

  it('should be an ExpressionObserver', () => {
    expect(observer instanceof ExpressionObserver).toBe(true);
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

    person.obj.lastName = 'Dough';
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(person.fullName, oldValue);
      oldValue = observer.getValue();
      person.obj.firstName = 'Jon';
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(person.fullName, oldValue);
        observer.unsubscribe(callback);
        expect(observer.oldValue).toBeUndefined();
        done();
      }, 0);
    }, 0);
  });
});
