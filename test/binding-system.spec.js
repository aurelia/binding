import {TaskQueue} from 'aurelia-task-queue';
import {bindingMode} from '../src/binding-mode';
import {DirtyChecker} from '../src/dirty-checking';
import {EventManager} from '../src/event-manager';
import {ObserverLocator} from '../src/observer-locator';
import {Parser} from '../src/parser';
import {BindingExpression} from '../src/binding-expression';
import {bindingSystem, __uninitializeBindingSystem, __initialized} from '../src/binding-system';

describe('bindingSystem', () => {
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
    __uninitializeBindingSystem();
    expect(__initialized).toBe(false);
    bindingSystem.observePropertyChanges({ foo: 'bar' }, 'foo', () => {});
    expect(__initialized).toBe(true);
  });

  it('initializes without container', () => {
    __uninitializeBindingSystem();
    expect(__initialized).toBe(false);
    bindingSystem.initialize();
    expect(__initialized).toBe(true);
  });

  it('initializes with container', () => {
    __uninitializeBindingSystem();
    expect(__initialized).toBe(false);
    spyOn(mockContainer, 'get').and.callThrough();
    bindingSystem.initialize(mockContainer);
    expect(mockContainer.get).toHaveBeenCalled();
    expect(__initialized).toBe(true);
  });

  it('observes and unobserves property changes', done => {
    let obj = { foo: 'bar' };
    let callback = jasmine.createSpy('callback');
    bindingSystem.observePropertyChanges(obj, 'foo', callback);
    obj.foo = 'baz';
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith('baz', 'bar');
      bindingSystem.unobservePropertyChanges(obj, 'foo', callback);
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
    bindingSystem.observeCollectionChanges(obj, callback);
    obj.push('foo');
    setTimeout(() => {
      expect(callback).toHaveBeenCalled();
      bindingSystem.unobserveCollectionChanges(obj, callback);
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
    bindingSystem.observeCollectionChanges(obj, callback);
    obj.set('foo', 'bar');
    setTimeout(() => {
      expect(callback).toHaveBeenCalled();
      bindingSystem.unobserveCollectionChanges(obj, callback);
      callback.calls.reset();
      obj.set('foo', 'baz');
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      })
    });
  });

  it('gets BindingExpressions', () => {
    let target = document.createElement('input');
    let targetProperty = 'value';
    let source = { foo: 'bar' };
    let sourceExpression = 'foo';
    let bindingExpression = bindingSystem.createBindingExpression(targetProperty, sourceExpression);
    expect(bindingExpression instanceof BindingExpression).toBe(true);
    let binding = bindingExpression.createBinding(target);
    binding.bind(source);
    expect(target.value).toBe('bar');
    binding.unbind();
  });
});
