import {TaskQueue} from 'aurelia-task-queue';
import {bindingMode} from './binding-mode';
import {DirtyChecker} from './dirty-checking';
import {EventManager} from './event-manager';
import {ObserverLocator, ObjectObservationAdapter} from './observer-locator';
import {Parser} from './parser';
import {BindingExpression} from './binding-expression';
import {Expression} from './ast';
import {connectable} from './connectable-binding';
import {subscriberCollection} from './subscriber-collection';

interface Disposable {
  dispose(): void;
}

interface PropertyObserver {
  subscribe(callback: (newValue: any, oldValue: any) => void): Disposable;
}

interface CollectionObserver {
  subscribe(callback: (changeRecords: any) => void): Disposable;
}

const valueConverterLookupFunction = () => null;

let taskQueue;
let eventManager;
let dirtyChecker;
let observerLocator;
let parser;

export let __initialized = false;

function initialize(container = null): void {
  container = container || { get: () => null };
  taskQueue = container.get(TaskQueue) || new TaskQueue();
  eventManager = container.get(EventManager) || new EventManager();
  dirtyChecker = container.get(DirtyChecker) || new DirtyChecker();
  observerLocator = container.get(ObserverLocator) || new ObserverLocator(taskQueue, eventManager, dirtyChecker);
  parser = container.get(Parser) || new Parser();
  __initialized = true;
}

export function __uninitializeBindingEngine() {
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

export const bindingEngine = {
  initialize: initialize,

  createBindingExpression(targetProperty: string, sourceExpression: string, mode = bindingMode.oneWay): BindingExpression {
    assertInitialized();
    return new BindingExpression(observerLocator, targetProperty, parser.parse(sourceExpression), mode, valueConverterLookupFunction);
  },

  propertyObserver(obj: Object, propertyName: string): PropertyObserver {
    return {
      subscribe: callback => {
        assertInitialized();
        let observer = observerLocator.getObserver(obj, propertyName);
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  },

  collectionObserver(collection: Array|Map): CollectionObserver {
    return {
      subscribe: callback => {
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
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  },

  expressionObserver(scope: any, expression: string): PropertyObserver {
    assertInitialized();
    return new ExpressionObserver(scope, parser.parse(expression));
  },

  parseExpression(expression: string): Expression {
    assertInitialized();
    return parser.parse(expression);
  },

  registerAdapter(adapter: ObjectObservationAdapter): void {
    assertInitialized();
    observerLocator.addAdapter(adapter);
  }
}

@connectable()
@subscriberCollection()
class ExpressionObserver {
  constructor(scope, expression) {
    this.scope = scope;
    this.expression = expression;
    this.observerLocator = observerLocator;
  }

  subscribe(callback) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.expression.evaluate(this.scope, valueConverterLookupFunction);
      this.expression.connect(this, this.scope);
    }
    this.addSubscriber(callback);
    return {
      dispose: () => {
        if (this.removeSubscriber(callback) && !this.hasSubscribers()) {
          this.unobserve(true);
        }
      }
    }
  }

  call() {
    let newValue = this.expression.evaluate(this.scope, valueConverterLookupFunction);
    let oldValue = this.oldValue;
    if (newValue !== oldValue) {
      this.oldValue = newValue;
      this.callSubscribers(newValue, oldValue);
    }
    this._version++;
    this.expression.connect(this, this.scope);
    this.unobserve(false);
  }
}
