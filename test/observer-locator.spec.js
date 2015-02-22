import {ObserverLocator, EventManager, DirtyChecker} from '../src/index';
import {TaskQueue} from 'aurelia-task-queue';
import {TestObservationAdapter, AdapterPropertyObserver} from './adapter';
import {DirtyCheckProperty} from '../src/dirty-checking';
import {
  OoPropertyObserver,
  UndefinedPropertyObserver,
  ElementObserver
} from '../src/property-observation';

export function createElement(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

describe('ObserverLocator', () => {
  var locator;

  beforeAll(() => {
    locator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), [new TestObservationAdapter(() => locator)]);
  });

  it('uses OoPropertyObserver for defined, primitive properties on pojos', () => {
    var obj = { foo: 'bar' },
        observer = locator.getObserver(obj, 'foo');
    expect(observer instanceof OoPropertyObserver).toBe(true);
  });

  it('uses UndefinedPropertyObserver for undefined properties on pojos', () => {
    var obj = {},
        observer = locator.getObserver(obj, 'foo');
    expect(observer instanceof UndefinedPropertyObserver).toBe(true);
  });

  it('uses ElementObserver for Elements', () => {
    var obj = createElement('<h1></h1>'),
        observer = locator.getObserver(obj, 'foo');
    expect(obj instanceof Element).toBe(true);
    expect(observer instanceof ElementObserver).toBe(true);
  });

  it('uses ElementObserver for SVGElements', () => {
    var obj = createElement('<svg></svg>'),
        observer = locator.getObserver(obj, 'foo');
    expect(obj instanceof SVGElement).toBe(true);
    expect(observer instanceof ElementObserver).toBe(true);
  });

  it('uses DirtyCheckProperty for defined, complex properties on pojos', () => {
    var obj = {}, foo, observer;
    Object.defineProperty(obj, 'foo', {
      get: function() { return foo; },
      set: function(newValue) { foo = newValue; },
      enumerable: true,
      configurable: true
    });
    observer = locator.getObserver(obj, 'foo');
    expect(observer instanceof DirtyCheckProperty).toBe(true);
  });

  it('uses Adapter for for defined, complex properties on pojos that adapter canObserve', () => {
    var obj = { handleWithAdapter: true }, foo, observer, adapter, descriptor;

    adapter = locator.observationAdapters[0];
    spyOn(adapter, 'handlesProperty').and.callThrough();
    spyOn(adapter, 'getObserver').and.callThrough();

    Object.defineProperty(obj, 'foo', {
      get: function() { return foo; },
      set: function(newValue) { foo = newValue; },
      enumerable: true,
      configurable: true
    });

    descriptor = Object.getOwnPropertyDescriptor(obj, 'foo');

    observer = locator.getObserver(obj, 'foo');
    expect(observer instanceof AdapterPropertyObserver).toBe(true);
    expect(adapter.handlesProperty).toHaveBeenCalledWith(obj, 'foo', descriptor);
    expect(adapter.getObserver).toHaveBeenCalledWith(obj, 'foo', descriptor);
  });
});
