import {bindingMode} from './binding-mode';
import {ObserverLocator} from './observer-locator';
import {Parser} from './parser';
import {BindingExpression} from './binding-expression';
import {createOverrideContext} from './scope';
import {ExpressionObserver} from './expression-observer';

const LookupFunctions = {
  bindingBehaviors: name => null,
  valueConverters: name => null
};

export class BindingEngine {
  static inject = [ObserverLocator, Parser];

  constructor(observerLocator, parser) {
    this.observerLocator = observerLocator;
    this.parser = parser;
  }

  createBindingExpression(targetProperty, sourceExpression, mode = bindingMode.toView, lookupFunctions = LookupFunctions) {
    return new BindingExpression(
      this.observerLocator,
      targetProperty,
      this.parser.parse(sourceExpression),
      mode,
      lookupFunctions);
  }

  propertyObserver(obj, propertyName) {
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

  collectionObserver(collection) {
    return {
      subscribe: callback => {
        let observer;
        if (collection instanceof Array) {
          observer = this.observerLocator.getArrayObserver(collection);
        } else if (collection instanceof Map) {
          observer = this.observerLocator.getMapObserver(collection);
        } else if (collection instanceof Set) {
          observer = this.observerLocator.getSetObserver(collection);
        }  else {
          throw new Error('collection must be an instance of Array, Map or Set.');
        }
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  }

  expressionObserver(bindingContext, expression) {
    let scope = { bindingContext, overrideContext: createOverrideContext(bindingContext) };
    return new ExpressionObserver(scope, this.parser.parse(expression), this.observerLocator, LookupFunctions);
  }

  parseExpression(expression) {
    return this.parser.parse(expression);
  }

  registerAdapter(adapter) {
    this.observerLocator.addAdapter(adapter);
  }
}
