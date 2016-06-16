import {connectable} from './connectable-binding';
import {subscriberCollection} from './subscriber-collection';

@connectable()
@subscriberCollection()
export class ExpressionObserver {
  constructor(scope, expression, observerLocator, lookupFunctions) {
    this.scope = scope;
    this.expression = expression;
    this.observerLocator = observerLocator;
    this.lookupFunctions = lookupFunctions;
  }

  getValue() {
    return this.expression.evaluate(this.scope, this.lookupFunctions);
  }

  setValue(newValue) {
    this.expression.assign(this.scope, newValue);
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.expression.evaluate(this.scope, this.lookupFunctions);
      this.expression.connect(this, this.scope);
    }
    this.addSubscriber(context, callable);
    if (arguments.length === 1 && context instanceof Function) {
      return {
        dispose: () => {
          this.unsubscribe(context, callable);
        }
      };
    }
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.unobserve(true);
      this.oldValue = undefined;
    }
  }

  call() {
    let newValue = this.expression.evaluate(this.scope, this.lookupFunctions);
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
