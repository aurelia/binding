import {bindingMode} from './binding-mode';
import {ObserverLocator, ObjectObservationAdapter} from './observer-locator';
import {Parser} from './parser';
import {BindingExpression} from './binding-expression';
import {Expression} from './ast';
import {connectable} from './connectable-binding';
import {subscriberCollection} from './subscriber-collection';
import {createOverrideContext} from './scope';

interface Disposable {
  dispose(): void;
}

interface PropertyObserver {
  subscribe(callback: (newValue: any, oldValue: any) => void): Disposable;
}

interface CollectionObserver {
  subscribe(callback: (changeRecords: any) => void): Disposable;
}

interface LookupFunctions {
  bindingBehaviors(name: string): any;
  valueConverters(name: string): any;
}

const lookupFunctions = {
  bindingBehaviors: name => null,
  valueConverters: name => null
};

export class BindingEngine {
  static inject = [ObserverLocator, Parser];

  constructor(observerLocator, parser) {
    this.observerLocator = observerLocator;
    this.parser = parser;
  }

  createBindingExpression(targetProperty: string, sourceExpression: string, mode = bindingMode.oneWay, lookupFunctions?: LookupFunctions = lookupFunctions): BindingExpression {
    return new BindingExpression(
      this.observerLocator,
      targetProperty,
      this.parser.parse(sourceExpression),
      mode,
      lookupFunctions);
  }

  propertyObserver(obj: Object, propertyName: string): PropertyObserver {
    return {
      subscribe: callback => {
        let observer = this.observerLocator.getObserver(obj, propertyName);
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  }

  collectionObserver(collection: Array<any>|Map<any, any>): CollectionObserver {
    return {
      subscribe: callback => {
        let observer;
        if (collection instanceof Array) {
          observer = this.observerLocator.getArrayObserver(collection);
        } else if (collection instanceof Map) {
          observer = this.observerLocator.getMapObserver(collection);
        } else {
          throw new Error('collection must be an instance of Array or Map.');
        }
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  }

  expressionObserver(bindingContext: any, expression: string): PropertyObserver {
    let scope = { bindingContext, overrideContext: createOverrideContext(bindingContext) };
    return new ExpressionObserver(scope, this.parser.parse(expression), this.observerLocator);
  }

  parseExpression(expression: string): Expression {
    return this.parser.parse(expression);
  }

  registerAdapter(adapter: ObjectObservationAdapter): void {
    this.observerLocator.addAdapter(adapter);
  }
}

@connectable()
@subscriberCollection()
class ExpressionObserver {
  constructor(scope, expression, observerLocator) {
    this.scope = scope;
    this.expression = expression;
    this.observerLocator = observerLocator;
  }

  subscribe(callback) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.expression.evaluate(this.scope, lookupFunctions);
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
    let newValue = this.expression.evaluate(this.scope, lookupFunctions);
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
