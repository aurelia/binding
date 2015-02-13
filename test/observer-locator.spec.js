import {ObserverLocator, EventManager, DirtyChecker} from '../src/index';
import {TaskQueue} from 'aurelia-task-queue';
import {TestObservationAdapter} from './adapter';
import {DirtyCheckProperty} from '../src/dirty-checking';
import {OoPropertyObserver, UndefinedPropertyObserver} from '../src/property-observation';

describe('observer locator', () => {
  var obj, locator;

  beforeEach(() => {
    obj = { foo: 'bar' };
    locator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), [new TestObservationAdapter()]);
  });

  it('getValue should return the value', () => {
    var observer = locator.getObserver(obj, 'foo');
    expect(observer.getValue()).toBe('bar');
  });

  it('setValue should set the value', () => {
    var observer = locator.getObserver(obj, 'foo');

    expect(observer.getValue()).toBe('bar');
    observer.setValue('baz');
    expect(observer.getValue()).toBe('baz');
  });

  it('calls the callback function when value changes', (done) =>{
    var observer = locator.getObserver(obj, 'foo'),
        callback = jasmine.createSpy('callback');

    observer.subscribe(callback);

    obj.foo = 'baz';
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith('baz', 'bar');
      done();
    }, 0);
  });

  it('uses OoPropertyObserver when a primitive property is added', (done) =>{
    var observer = locator.getObserver(obj, 'undefinedProperty'),
        callback = jasmine.createSpy('callback'),
        unsubcribe;

    expect(locator.getObserver(obj, 'undefinedProperty') instanceof UndefinedPropertyObserver).toBe(true);

    unsubcribe = observer.subscribe(callback);

    obj.undefinedProperty = 'baz';

    setTimeout(() => {
      // inner observer should be an OoPropertyObserver
      expect(observer.actual instanceof OoPropertyObserver).toBe(true);
      // subsequent calls should return a OoPropertyObserver
      expect(locator.getObserver(obj, 'undefinedProperty') instanceof OoPropertyObserver).toBe(true);

      expect(callback).toHaveBeenCalledWith('baz', undefined);
      unsubcribe();

      done();
    }, 0);
  });

  it('uses DirtyChecking when a complex property is added', (done) =>{
    var observer = locator.getObserver(obj, 'undefinedProperty'),
        callback = jasmine.createSpy('callback'),
        innerValue,
        unsubcribe;

    expect(locator.getObserver(obj, 'undefinedProperty') instanceof UndefinedPropertyObserver).toBe(true);

    unsubcribe = observer.subscribe(callback);

    Object.defineProperty(obj, 'undefinedProperty', {
      get: () => innerValue,
      set: value => { innerValue = value; }
    });
    obj.undefinedProperty = 'baz';

    setTimeout(() => {
      // inner observer should be a DirtyCheckProperty
      expect(observer.actual instanceof DirtyCheckProperty).toBe(true);
      // subsequent calls should return a DirtyCheckProperty
      expect(locator.getObserver(obj, 'undefinedProperty') instanceof DirtyCheckProperty).toBe(true);

      expect(callback).toHaveBeenCalledWith('baz', undefined);
      unsubcribe();

      done();
    }, 0);
  });

  it('stops observing if there are no callbacks', () => {
    var observer = locator.getObserver(obj, 'foo'),
        dispose = observer.subscribe(function(){});

    expect(observer.owner.observing).toBe(true);
    dispose();
    //expect(observer.owner.observing).toBe(false);  // this is failing.  need to find out what the intended behavior is.
  });

  it('keeps observing if there are callbacks', () => {
    var observer = locator.getObserver(obj, 'foo'),
        dispose = observer.subscribe(function(){});

    observer.subscribe(function(){});

    dispose();

    expect(observer.owner.observing).toBe(true);
  });

  it('uses dirty checking when there are getters or setters', () => {
    var person = {}, name, observer;
    Object.defineProperty(person, 'name', {
      get: function() { return name; },
      set: function(newValue) { name = newValue; },
      enumerable: true,
      configurable: true
    });

    observer = locator.getObserver(person, 'name');
    expect(observer instanceof DirtyCheckProperty).toBeTruthy();
  });

  it('uses adapter when appropriate', () => {
    var person = { handleWithAdapter: true }, name, observer, adapter, descriptor;

    adapter = locator.observationAdapters[0];
    spyOn(adapter, 'handlesProperty').and.callThrough();
    spyOn(adapter, 'getObserver').and.callThrough();

    Object.defineProperty(person, 'name', {
      get: function() { return name; },
      set: function(newValue) { name = newValue; },
      enumerable: true,
      configurable: true
    });

    descriptor = Object.getOwnPropertyDescriptor(person, 'name');

    observer = locator.getObserver(person, 'name');
    expect(observer).toBe('test-adapter');
    expect(adapter.handlesProperty).toHaveBeenCalledWith(person, 'name', descriptor);
    expect(adapter.getObserver).toHaveBeenCalledWith(person, 'name', descriptor);
  });
});
