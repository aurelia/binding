import {TaskQueue} from 'aurelia-task-queue';
import {bindingMode} from '../src/binding-mode';
import {DirtyChecker} from '../src/dirty-checking';
import {EventManager} from '../src/event-manager';
import {ObserverLocator} from '../src/observer-locator';
import {Parser} from '../src/parser';
import {BindingExpression} from '../src/binding-expression';
import {bindingEngine, __uninitializeBindingEngine, __initialized} from '../src/binding-engine';
import {Expression} from '../src/ast';

describe('bindingEngine', () => {
  let mockContainer;

  beforeAll(() => {
    let taskQueue = new TaskQueue();
    let eventManager = new EventManager();
    let dirtyChecker = new DirtyChecker();
    let observerLocator = new ObserverLocator(taskQueue, eventManager, dirtyChecker);
    let parser = new Parser();

    mockContainer = {
      get: key => {
        switch(key) {
          case TaskQueue:
            return taskQueue;
          case EventManager:
            return eventManager;
          case DirtyChecker:
            return dirtyChecker;
          case ObserverLocator:
            return observerLocator;
          case Parser:
            return parser;
        }
      }
    }
  });

  it('initializes automatically', () => {
    __uninitializeBindingEngine();
    expect(__initialized).toBe(false);
    bindingEngine.propertyObserver({ foo: 'bar' }).subscribe(() => null);
    expect(__initialized).toBe(true);
  });

  it('initializes without container', () => {
    __uninitializeBindingEngine();
    expect(__initialized).toBe(false);
    bindingEngine.initialize();
    expect(__initialized).toBe(true);
  });

  it('initializes with container', () => {
    __uninitializeBindingEngine();
    expect(__initialized).toBe(false);
    spyOn(mockContainer, 'get').and.callThrough();
    bindingEngine.initialize(mockContainer);
    expect(mockContainer.get).toHaveBeenCalled();
    expect(__initialized).toBe(true);
  });

  it('gets BindingExpressions', () => {
    let target = document.createElement('input');
    let targetProperty = 'value';
    let source = { foo: 'bar' };
    let sourceExpression = 'foo';
    let bindingExpression = bindingEngine.createBindingExpression(targetProperty, sourceExpression);
    expect(bindingExpression instanceof BindingExpression).toBe(true);
    let binding = bindingExpression.createBinding(target);
    binding.bind(source);
    expect(target.value).toBe('bar');
    binding.unbind();
  });

  it('observes and unobserves property changes', done => {
    let obj = { foo: 'bar' };
    let callback = jasmine.createSpy('callback');
    let subscription = bindingEngine.propertyObserver(obj, 'foo').subscribe(callback);
    obj.foo = 'baz';
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith('baz', 'bar');
      subscription.dispose();
      callback.calls.reset();
      obj.foo = 'test';
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      })
    });
  });

  it('observes and unobserves array changes', done => {
    let obj = [];
    let callback = jasmine.createSpy('callback');
    let subscription = bindingEngine.collectionObserver(obj).subscribe(callback);
    obj.push('foo');
    setTimeout(() => {
      expect(callback).toHaveBeenCalled();
      subscription.dispose();
      callback.calls.reset();
      obj.push('bar');
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      })
    });
  });

  it('observes and unobserves map changes', done => {
    let obj = new Map();
    let callback = jasmine.createSpy('callback');
    let subscription = bindingEngine.collectionObserver(obj).subscribe(callback);
    obj.set('foo', 'bar');
    setTimeout(() => {
      expect(callback).toHaveBeenCalled();
      subscription.dispose();
      callback.calls.reset();
      obj.set('foo', 'baz');
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      })
    });
  });

  it('observes and unobserves expressions', done => {
    let obj = { foo: { bar: 'baz' } };
    let callback = jasmine.createSpy('callback');
    let observer = bindingEngine.expressionObserver(obj, 'foo.bar');
    let subscription = observer.subscribe(callback);
    obj.foo.bar = 'xup';
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith('xup', 'baz');
      subscription.dispose();
      expect(observer.hasSubscribers()).toBe(false);
      callback.calls.reset();
      obj.foo.bar = 'hello world';
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      })
    });
  });

  it('parses', () => {
    let expression = bindingEngine.parseExpression('foo.bar');
    expect(expression instanceof Expression).toBe(true);
  });

  it('registers adapters', () => {
    let mockAdapter = { getObserver: () => null };
    bindingEngine.registerAdapter(mockAdapter);
    expect(mockContainer.get(ObserverLocator).adapters[0]).toBe(mockAdapter);
  });
});
