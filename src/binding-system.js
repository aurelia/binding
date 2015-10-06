import {TaskQueue} from 'aurelia-task-queue';
import {bindingMode} from './binding-mode';
import {DirtyChecker} from './dirty-checking';
import {EventManager} from './event-manager';
import {ObserverLocator} from './observer-locator';
import {Parser} from './parser';
import {BindingExpression} from './binding-expression';

let taskQueue;
let eventManager;
let dirtyChecker;
let observerLocator;
let parser;

export let __initialized = false;

function initialize(container = null) {
  container = container || { get: () => null };
  taskQueue = container.get(TaskQueue) || new TaskQueue();
  eventManager = container.get(EventManager) || new EventManager();
  dirtyChecker = container.get(DirtyChecker) || new DirtyChecker();
  observerLocator = container.get(ObserverLocator) || new ObserverLocator(taskQueue, eventManager, dirtyChecker);
  parser = container.get(Parser) || new Parser();
  __initialized = true;
}

export function __uninitializeBindingSystem() {
  taskQueue = null;
  eventManager = null;
  dirtyChecker = null;
  observerLocator = null
  parser = null;
  __initialized = false;
}

function assertInitialized() {
  if (!__initialized) {
    initialize();
  }
}

export const BindingSystem = {
  initialize: initialize,

  createBindingExpression(targetProperty, sourceExpression, mode = bindingMode.oneWay) {
    assertInitialized();
    return new BindingExpression(observerLocator, targetProperty, parser.parse(sourceExpression), mode);
  },

  observePropertyChanges(obj, propertyName, callback) {
    assertInitialized();
    let observer = observerLocator.getObserver(obj, propertyName);
    observer.subscribe(callback);
  },

  unobservePropertyChanges(obj, propertyName, callback) {
    assertInitialized();
    let observer = observerLocator.getObserver(obj, propertyName);
    observer.unsubscribe(callback);
  },

  observeCollectionChanges(collection, callback) {
    assertInitialized();
    let observer;
    if (collection instanceof Array) {
      observer = observerLocator.getArrayObserver(collection);
    } else if (collection instanceof Map) {
      observer = observerLocator.getMapObserver(collection);
    } else {
      throw new Error('collection must be an instance of Array or Map.');
    }
    observer.subscribe(callback);
  },

  unobserveCollectionChanges(collection, callback) {
    assertInitialized();
    let observer;
    if (collection instanceof Array) {
      observer = observerLocator.getArrayObserver(collection);
    } else if (collection instanceof Map) {
      observer = observerLocator.getMapObserver(collection);
    } else {
      throw new Error('collection must be an instance of Array or Map.');
    }
    observer.unsubscribe(callback);
  }
}
