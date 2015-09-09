import {ObserverLocator} from '../src/observer-locator';
import {DirtyChecker} from '../src/dirty-checking';
import {EventManager} from '../src/event-manager';
import {Parser} from '../src/parser';
import {BindingExpression} from '../src/binding-expression';
import {TaskQueue} from 'aurelia-task-queue';

export var checkDelay = 20;

export function createElement(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

export function createEvent(name) {
  var event = document.createEvent('Event');
  event.initEvent(name, true, true);
  return event;
}

export function fireEvent(element, name) {
  var event = createEvent(name);
  element.dispatchEvent(event);
}

export function createObserverLocator(adapters = []) {
  var locator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), adapters);
  locator.dirtyChecker.checkDelay = checkDelay;
  return locator;
}

export function getBinding(observerLocator, model, modelProperty, view, viewProperty, mode) {
  var targetProperty, sourceExpression, bindingExpression, binding, parser;
  parser = new Parser();
  targetProperty = observerLocator.getObserver(view, viewProperty);
  sourceExpression = parser.parse(modelProperty);
  bindingExpression = new BindingExpression(
    observerLocator,
    viewProperty,
    sourceExpression,
    mode,
    name => null,
    undefined);
  binding = bindingExpression.createBinding(view);

  return {
    targetProperty: targetProperty,
    sourceExpression: sourceExpression,
    bindingExpression: bindingExpression,
    binding: binding,
    view: view,
    model: model
  };
}

export class Person {
  constructor() {
    this.firstName = 'John';
    this.lastName = 'Doe';
  }
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

export class Foo {
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

export class FooNoDep {
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

function countSubscribers(observer) {
  let count = 0;
  if (observer._subscriber0) { count++; }
  if (observer._subscriber1) { count++; }
  if (observer._subscriber2) { count++; }
  if (observer._subscribersRest) { count += observer._subscribersRest.length; }
  return count;
}

export function executeSharedPropertyObserverTests(obj, observer, done) {
  let callback0 = jasmine.createSpy('callback0');
  let callback1 = jasmine.createSpy('callback1');
  let callback2 = jasmine.createSpy('callback2');
  let callback3 = jasmine.createSpy('callback3');
  let callback4 = jasmine.createSpy('callback4');
  let callback5 = jasmine.createSpy('callback5');
  let oldValue;
  let newValue;
  let values = ['alkjdfs', 0, false, {}, [], null, undefined, 'foo'];
  let next;
  spyOn(observer, 'addSubscriber').and.callThrough();
  spyOn(observer, 'removeSubscriber').and.callThrough();
  // hasSubscribers, hasSubscriber
  expect(observer.hasSubscribers()).toBe(false);
  expect(observer.hasSubscriber(callback0)).toBe(false);
  observer.subscribe(callback0);
  expect(observer.addSubscriber).toHaveBeenCalledWith(callback0);
  expect(countSubscribers(observer)).toBe(1);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback0)).toBe(true);
  // doesn't allow multiple subscribe
  observer.subscribe(callback0);
  expect(observer.addSubscriber).toHaveBeenCalledWith(callback0);
  expect(countSubscribers(observer)).toBe(1);
  // doesn't allow multiple unsubscribe
  observer.unsubscribe(callback0);
  expect(observer.removeSubscriber).toHaveBeenCalledWith(callback0);
  expect(countSubscribers(observer)).toBe(0);
  observer.unsubscribe(callback0);
  expect(observer.removeSubscriber).toHaveBeenCalledWith(callback0);
  expect(countSubscribers(observer)).toBe(0);

  // overflows into "rest" array
  observer.subscribe(callback0);
  expect(observer._subscriber0).toBe(callback0);
  expect(countSubscribers(observer)).toBe(1);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback0)).toBe(true);

  observer.subscribe(callback1);
  expect(observer._subscriber1).toBe(callback1);
  expect(countSubscribers(observer)).toBe(2);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback1)).toBe(true);

  observer.subscribe(callback2);
  expect(observer._subscriber2).toBe(callback2);
  expect(countSubscribers(observer)).toBe(3);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback2)).toBe(true);

  observer.subscribe(callback3);
  expect(observer._subscribersRest[0]).toBe(callback3);
  expect(countSubscribers(observer)).toBe(4);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback3)).toBe(true);

  observer.subscribe(callback4);
  expect(observer._subscribersRest[1]).toBe(callback4);
  expect(countSubscribers(observer)).toBe(5);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback4)).toBe(true);

  observer.subscribe(callback5);
  expect(observer._subscribersRest[2]).toBe(callback5);
  expect(countSubscribers(observer)).toBe(6);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback5)).toBe(true);

  // reuses empty slots
  observer.unsubscribe(callback2);
  expect(observer._subscriber2).toBe(null);
  expect(countSubscribers(observer)).toBe(5);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback2)).toBe(false);

  observer.subscribe(callback2);
  expect(observer._subscriber2).toBe(callback2);
  expect(countSubscribers(observer)).toBe(6);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(callback2)).toBe(true);

  // handles unsubscribe during callback0
  let unsubscribeDuringCallbackTested = false;
  observer.unsubscribe(callback0);
  callback0 = (newValue, oldValue) => {
    observer.unsubscribe(callback1);
    observer.unsubscribe(callback2);
    observer.unsubscribe(callback3);
    observer.unsubscribe(callback4);
    observer.unsubscribe(callback5);
  }
  callback0 = jasmine.createSpy('callback0', callback0).and.callThrough();
  observer.subscribe(callback0);

  next = () => {
    if (values.length) {
      oldValue = observer.getValue();
      newValue = values.splice(0, 1)[0];
      observer.setValue(newValue);
      setTimeout(() => {
        expect(callback0).toHaveBeenCalledWith(newValue, oldValue);
        if (!unsubscribeDuringCallbackTested) {
          unsubscribeDuringCallbackTested = true;
          expect(callback1).toHaveBeenCalledWith(newValue, oldValue);
          expect(callback2).toHaveBeenCalledWith(newValue, oldValue);
          expect(callback3).toHaveBeenCalledWith(newValue, oldValue);
          expect(callback4).toHaveBeenCalledWith(newValue, oldValue);
          expect(callback5).toHaveBeenCalledWith(newValue, oldValue);
        }
        next();
      }, checkDelay * 2);
    } else {
      observer.unsubscribe(callback0);
      callback0.calls.reset();
      observer.setValue('bar');
      setTimeout(() => {
        expect(callback0.calls.count()).toEqual(0);
        expect(observer._subscriber0).toBe(null);
        expect(observer._subscriber1).toBe(null);
        expect(observer._subscriber2).toBe(null);
        expect(observer._subscribersRest.length).toBe(0);
        done();
      }, checkDelay * 2);
    }
  };

  next();
}
