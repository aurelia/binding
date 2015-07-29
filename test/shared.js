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

export function executeSharedPropertyObserverTests(obj, observer, done) {
  var callback = jasmine.createSpy('callback'),
      oldValue, newValue,
      dispose = observer.subscribe(callback),
      values = ['alkjdfs', 0, false, {}, [], null, undefined, 'foo'],
      next;

  next = () => {
    if (values.length) {
      oldValue = observer.getValue();
      newValue = values.splice(0, 1)[0];
      observer.setValue(newValue);
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(newValue, oldValue);
        next();
      }, checkDelay * 2);
    } else {
      dispose();
      callback.calls.reset();
      observer.setValue('bar');
      setTimeout(() => {
        expect(callback.calls.count()).toEqual(0);
        done();
      }, checkDelay * 2);
    }
  };

  next();
}
