import {Container} from 'aurelia-dependency-injection';
import {ObserverLocator} from '../src/observer-locator';
import {Parser} from '../src/parser';
import {BindingExpression} from '../src/binding-expression';

export const checkDelay = 20;

export function createObserverLocator(container = new Container()) {
  let locator = container.get(ObserverLocator);
  locator.dirtyChecker.checkDelay = checkDelay;
  return locator;
}

export function createElement(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

export function getBinding(observerLocator, model, modelProperty, view, viewProperty, mode) {
  var targetObserver, sourceExpression, bindingExpression, binding, parser;
  parser = new Parser();
  targetObserver = observerLocator.getObserver(view, viewProperty);
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
    targetObserver: targetObserver,
    sourceExpression: sourceExpression,
    bindingExpression: bindingExpression,
    binding: binding,
    view: view,
    model: model
  };
}

function countSubscribers(observer) {
  let count = 0;
  if (observer._context0) { count++; }
  if (observer._context1) { count++; }
  if (observer._context2) { count++; }
  if (observer._contextsRest) { count += observer._contextsRest.length; }
  return count;
}

export function executeSharedPropertyObserverTests(obj, observer, done) {
  let context = 'test-context';
  let callable0 = { call: jasmine.createSpy('callable0') };
  let callable1 = { call: jasmine.createSpy('callable1') };
  let callable2 = { call: jasmine.createSpy('callable2') };
  let callable3 = { call: jasmine.createSpy('callable3') };
  let callable4 = { call: jasmine.createSpy('callable4') };
  let callable5 = { call: jasmine.createSpy('callable5') };
  let oldValue;
  let newValue;
  let values = ['alkjdfs', 0, false, {}, [], null, undefined, 'foo'];
  let next;
  spyOn(observer, 'addSubscriber').and.callThrough();
  spyOn(observer, 'removeSubscriber').and.callThrough();
  // hasSubscribers, hasSubscriber
  expect(observer.hasSubscribers()).toBe(false);
  expect(observer.hasSubscriber(context, callable0)).toBe(false);
  observer.subscribe(context, callable0);
  expect(observer.addSubscriber).toHaveBeenCalledWith(context, callable0);
  expect(countSubscribers(observer)).toBe(1);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable0)).toBe(true);
  // doesn't allow multiple subscribe
  observer.subscribe(context, callable0);
  expect(observer.addSubscriber).toHaveBeenCalledWith(context, callable0);
  expect(countSubscribers(observer)).toBe(1);
  // doesn't allow multiple unsubscribe
  observer.unsubscribe(context, callable0);
  expect(observer.removeSubscriber).toHaveBeenCalledWith(context, callable0);
  expect(countSubscribers(observer)).toBe(0);
  observer.unsubscribe(context, callable0);
  expect(observer.removeSubscriber).toHaveBeenCalledWith(context, callable0);
  expect(countSubscribers(observer)).toBe(0);

  // overflows into "rest" array
  observer.subscribe(context, callable0);
  expect(observer._callable0).toBe(callable0);
  expect(countSubscribers(observer)).toBe(1);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable0)).toBe(true);

  observer.subscribe(context, callable1);
  expect(observer._callable1).toBe(callable1);
  expect(countSubscribers(observer)).toBe(2);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable1)).toBe(true);

  observer.subscribe(context, callable2);
  expect(observer._callable2).toBe(callable2);
  expect(countSubscribers(observer)).toBe(3);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable2)).toBe(true);

  observer.subscribe(context, callable3);
  expect(observer._callablesRest[0]).toBe(callable3);
  expect(countSubscribers(observer)).toBe(4);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable3)).toBe(true);

  observer.subscribe(context, callable4);
  expect(observer._callablesRest[1]).toBe(callable4);
  expect(countSubscribers(observer)).toBe(5);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable4)).toBe(true);

  observer.subscribe(context, callable5);
  expect(observer._callablesRest[2]).toBe(callable5);
  expect(countSubscribers(observer)).toBe(6);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable5)).toBe(true);

  // reuses empty slots
  observer.unsubscribe(context, callable2);
  expect(observer._callable2).toBe(null);
  expect(countSubscribers(observer)).toBe(5);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable2)).toBe(false);

  observer.subscribe(context, callable2);
  expect(observer._callable2).toBe(callable2);
  expect(countSubscribers(observer)).toBe(6);
  expect(observer.hasSubscribers()).toBe(true);
  expect(observer.hasSubscriber(context, callable2)).toBe(true);

  // handles unsubscribe during callable0
  let unsubscribeDuringCallbackTested = false;
  observer.unsubscribe(context, callable0);
  callable0 = {
    call: (context, newValue, oldValue) => {
      observer.unsubscribe(context, callable1);
      observer.unsubscribe(context, callable2);
      observer.unsubscribe(context, callable3);
      observer.unsubscribe(context, callable4);
      observer.unsubscribe(context, callable5);
    }
  };
  callable0.call = jasmine.createSpy('callable0', callable0.call).and.callThrough();
  observer.subscribe(context, callable0);

  next = () => {
    if (values.length) {
      oldValue = observer.getValue();
      newValue = values.splice(0, 1)[0];
      observer.setValue(newValue);
      setTimeout(() => {
        expect(callable0.call).toHaveBeenCalledWith(context, newValue, oldValue);
        if (!unsubscribeDuringCallbackTested) {
          unsubscribeDuringCallbackTested = true;
          expect(callable1.call).toHaveBeenCalledWith(context, newValue, oldValue);
          expect(callable2.call).toHaveBeenCalledWith(context, newValue, oldValue);
          expect(callable3.call).toHaveBeenCalledWith(context, newValue, oldValue);
          expect(callable4.call).toHaveBeenCalledWith(context, newValue, oldValue);
          expect(callable5.call).toHaveBeenCalledWith(context, newValue, oldValue);
        }
        next();
      }, checkDelay * 2);
    } else {
      observer.unsubscribe(context, callable0);
      callable0.call.calls.reset();
      observer.setValue('bar');
      setTimeout(() => {
        expect(callable0.call.calls.count()).toEqual(0);
        expect(observer._callable0).toBe(null);
        expect(observer._callable1).toBe(null);
        expect(observer._callable2).toBe(null);
        expect(observer._callablesRest.length).toBe(0);
        done();
      }, checkDelay * 2);
    }
  };

  next();
}
