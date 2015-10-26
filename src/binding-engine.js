import {bindingMode} from './binding-mode';
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

  observer(scope: Object, expression: string): PropertyObserver {
    // Fast path if the expression is just a property on scope.
    // The Regex is not perfect but shortcuts all usual cases, notably it lacks unicode letters.
    if (/^[$A-Za-z_][$A-Za-z0-9_]*$/.test(expression)) {
      return {
        subscribe: callback => {
          let observer = this.observerLocator.getObserver(scope, expression);
          observer.subscribe(callback);
          return {
            dispose: () => observer.unsubscribe(callback)
          };
        },
        evaluate: () => scope[expression]
      };
    }
    // Slow path: observe any expression
    return new ExpressionObserver(scope, this.parser.parse(expression), this.observerLocator);
  }

  collectionObserver(scope: Array|Map|Object, expression?: string): CollectionObserver {
    // If called with just scope, we assume it is a collection that we want to directly observe
    if (expression === undefined) {
      // Fail fast when called with invalid arguments
      if (!(scope instanceof Array || scope instanceof Map)) {
        throw new Error('collection must be an instance of Array or Map.');
      }
      return {
        subscribe: callback => {
          let observer = scope instanceof Array ?
            this.observerLocator.getArrayObserver(scope) :            
            this.observerLocator.getMapObserver(scope);     // scope instanceof Map
          observer.subscribe(callback);
          return {
            dispose: () => observer.unsubscribe(callback)
          };
        }
      };
    }
    
    // Otherwise we observe expression on scope, which should evaluate to a collection
    let expressionObserver = this.observer(scope, expression);        
    return {
      subscribe: callback => {        
        let collectionSubscription = null;
        let collectionChanged = (newValue, oldValue, mute?: boolean) => {
          if (collectionSubscription)
            collectionSubscription.dispose();
          collectionSubscription = newValue ? 
            this.collectionObserver(newValue).subscribe(callback) :
            null;
          if (!mute)
            callback([{type: "reset", object: newValue, oldValue: oldValue}]);
        };        
        let expressionSubscription = expressionObserver.subscribe(collectionChanged);        
        let collection = expressionObserver.evaluate();        
        collectionChanged(collection, true);
        
        return {
          dispose: () => {
            expressionSubscription.dispose();
            if (collectionSubscription)
              collectionSubscription.dispose();
          }
        };
      }
    };    
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
  
  evaluate() {
    return this.expression.evaluate(this.scope, lookupFunctions);
  }
}
