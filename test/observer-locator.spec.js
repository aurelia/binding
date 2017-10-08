import './setup';
import {TestObservationAdapter} from './adapter';
import {DirtyCheckProperty} from '../src/dirty-checking';
import {SetterObserver} from '../src/property-observation';
import {
  ValueAttributeObserver,
  XLinkAttributeObserver,
  DataAttributeObserver,
  StyleObserver,
  dataAttributeAccessor
} from '../src/element-observation';
import {SelectValueObserver} from '../src/select-value-observer';
import {CheckedObserver} from '../src/checked-observer';
import {createElement, createObserverLocator} from './shared';
import {FEATURE} from 'aurelia-pal';
import {Logger} from 'aurelia-logging';

describe('ObserverLocator', () => {
  var locator;

  beforeAll(() => {
    locator = createObserverLocator();
    locator.addAdapter(new TestObservationAdapter(() => locator));
  });

  it('uses SetterObserver for defined, primitive properties on pojos', () => {
    var obj = { foo: 'bar' },
        observer = locator.getObserver(obj, 'foo');
    expect(observer instanceof SetterObserver).toBe(true);
  });

  it('uses SetterObserver for ad-hoc properties on Elements', () => {
    var obj = createElement('<h1></h1>'),
        observer;
    obj.foo = 'bar';
    observer = locator.getObserver(obj, 'foo');
    expect(obj instanceof Element).toBe(true);
    expect(observer instanceof SetterObserver).toBe(true);
  });

  it('warns when its not able to subscribe to a SetterObserver', () => {
    spyOn(Logger.prototype, 'warn');

    var obj = {};
    Object.defineProperties(obj, {
      'foo': {configurable: true},
      'bar': {configurable: false}
    });

    locator.getObserver(obj, 'foo').convertProperty();
    expect(Logger.prototype.warn).not.toHaveBeenCalled();

    locator.getObserver(obj, 'bar').convertProperty();
    expect(Logger.prototype.warn).toHaveBeenCalledWith('Cannot observe property \'bar\' of object', obj);
  });

  it('respects the enumerability in the SetterObserver', () => {
    var obj = {};
    Object.defineProperties(obj, {
      'foo': {
        configurable: true,
        enumerable: true
      },
      'bar': {
        configurable: true,
        enumerable: false
      }
    });
    ['foo', 'bar', 'baz'].forEach(prop => {
      locator.getObserver(obj, prop).convertProperty();
    });
    expect(Object.keys(obj)).toEqual(['foo', 'baz']);
  });

  it('uses ValueAttributeObserver for element value attributes', () => {
    var obj = createElement('<input />'),
        observer = locator.getObserver(obj, 'value');
    expect(observer instanceof ValueAttributeObserver).toBe(true);
    obj = createElement('<textarea></textarea'),
    observer = locator.getObserver(obj, 'value');
    expect(observer instanceof ValueAttributeObserver).toBe(true);
  });

  it('uses DataAttributeObserver for data-* attributes', () => {
    var obj = createElement('<input data-foo="bar" />'),
        observer = locator.getObserver(obj, 'data-foo');
    expect(observer instanceof DataAttributeObserver).toBe(true);
  });

  it('uses DataAttributeObserver for aria-* attributes', () => {
    var obj = createElement('<input aria-hidden="bar" />'),
        observer = locator.getObserver(obj, 'aria-hidden');
    expect(observer instanceof DataAttributeObserver).toBe(true);
  });

  it('uses DataAttributeObserver for role attributes on elements', () => {
    var obj = createElement('<div></div>'),
        observer = locator.getObserver(obj, 'role');
    expect(observer instanceof DataAttributeObserver).toBe(true);
  });

  it('uses DataAttributeObserver for role attributes on svg elements', () => {
    var obj = createElement('<svg></svg>'),
        observer = locator.getObserver(obj, 'role');
    expect(observer instanceof DataAttributeObserver).toBe(true);
  });

  it('uses SetterObserver for role properties on objects', () => {
    var obj = {},
        observer = locator.getObserver(obj, 'role');
    expect(observer instanceof SetterObserver).toBe(true);
  });

  it('uses CheckedObserver for input checked attributes', () => {
    var obj = createElement('<input />'),
        observer = locator.getObserver(obj, 'checked');
    expect(observer instanceof CheckedObserver).toBe(true);
  });

  it('uses SelectValueObserver for select value attributes', () => {
    var obj = createElement('<select></select>'),
        observer = locator.getObserver(obj, 'value');
    expect(observer instanceof SelectValueObserver).toBe(true);
  });

  it('uses StyleObserver for style attributes', () => {
    var obj = createElement('<select></select>'),
        observer = locator.getObserver(obj, 'style');
    expect(observer instanceof StyleObserver).toBe(true);
  });

  it('uses StyleObserver for css attributes', () => {
    var obj = createElement('<select></select>'),
        observer = locator.getObserver(obj, 'css');
    expect(observer instanceof StyleObserver).toBe(true);
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

  it('uses custom getObserver when provided on the descriptor\'s getter', () => {
    var obj = {},
        foo,
        customObserver = {},
        observer,
        descriptor = {
          get: function() { return foo; },
          set: function(newValue) { foo = newValue; },
          enumerable: true,
          configurable: true
        };

    descriptor.get.getObserver = function(obj){
      customObserver.target = obj;
      return customObserver;
    };

    Object.defineProperty(obj, 'foo', descriptor);

    observer = locator.getObserver(obj, 'foo');

    expect(observer).toBe(customObserver);
    expect(observer.target).toBe(obj);
  });

  it('uses custom getObserver when provided on the descriptor\'s setter without getter', () => {
    var obj = {},
        foo,
        customObserver = {},
        observer,
        descriptor = {
          set: function(newValue) { foo = newValue; },
          enumerable: true,
          configurable: true
        };

    descriptor.set.getObserver = function(obj){
      customObserver.target = obj;
      return customObserver;
    };

    Object.defineProperty(obj, 'foo', descriptor);

    observer = locator.getObserver(obj, 'foo');

    expect(observer).toBe(customObserver);
    expect(observer.target).toBe(obj);
  });

  it('warns when its not able to bind to an object', () => {
    spyOn(Logger.prototype, 'warn');

    var obj1 = {};
    locator.createObserversLookup(obj1);
    expect(Logger.prototype.warn).not.toHaveBeenCalled();
    expect('__observers__' in obj1).toBeTruthy();

    var obj2 = Object.seal({});
    locator.createObserversLookup(obj2);
    expect(Logger.prototype.warn).toHaveBeenCalledWith('Cannot add observers to object', obj2);
    expect('__observers__' in obj2).toBeFalsy();
  });

  it('uses Adapter for for defined, complex properties on pojos that adapter canObserve', () => {
    var obj = { handleWithAdapter: true }, foo, observer, adapter, descriptor;

    adapter = locator.adapters[0];
    spyOn(adapter, 'getObserver').and.callThrough();

    Object.defineProperty(obj, 'foo', {
      get: function() { return foo; },
      set: function(newValue) { foo = newValue; },
      enumerable: true,
      configurable: true
    });

    descriptor = Object.getOwnPropertyDescriptor(obj, 'foo');

    observer = locator.getObserver(obj, 'foo');
    expect(observer.___from_adapter).toBe(true);
    expect(adapter.getObserver).toHaveBeenCalledWith(obj, 'foo', descriptor);
  });

  it('getAccessor returns ValueAttributeObserver for input.value', () => {
    expect(locator.getAccessor(document.createElement('input'), 'value') instanceof ValueAttributeObserver).toBe(true);
  });

  it('getAccessor returns SetterObserver for input.model', () => {
    expect(locator.getAccessor(document.createElement('input'), 'model') instanceof SetterObserver).toBe(true);
  });

  it('getAccesor returns dataAttributeAccesor for anything else', () => {
    [
      { tag: 'a', attr: 'href' },
      { tag: 'img', attr: 'src' }
    ].forEach(test => {
      let el = document.createElement(test.tag);
      expect(locator.getAccessor(el, test.attr)).toBe(dataAttributeAccessor);
    });
  });
});
