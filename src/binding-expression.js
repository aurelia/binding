import {bindingMode} from './binding-mode';
import {connectable, sourceContext} from './connectable-binding';

export class BindingExpression {
  constructor(observerLocator, targetProperty, sourceExpression,
    mode, lookupFunctions, attribute){
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
    this.attribute = attribute;
    this.discrete = false;
  }

  createBinding(target) {
    return new Binding(
      this.observerLocator,
      this.sourceExpression,
      target,
      this.targetProperty,
      this.mode,
      this.lookupFunctions
      );
  }
}

const targetContext = 'Binding:target';

@connectable()
export class Binding {
  constructor(observerLocator, sourceExpression, target, targetProperty, mode, lookupFunctions) {
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
  }

  updateTarget(value) {
    this.targetProperty.setValue(value);
  }

  updateSource(value) {
    this.sourceExpression.assign(this.source, value, this.lookupFunctions);
  }

  call(context, newValue, oldValue) {
    if (!this.isBound) {
      return;
    }
    if (context === sourceContext) {
      oldValue = this.targetProperty.getValue();
      newValue = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
      if (newValue !== oldValue) {
        this.updateTarget(newValue);
      }
      if (this.mode !== bindingMode.oneTime) {
        this._version++;
        this.sourceExpression.connect(this, this.source);
        this.unobserve(false);
      }
      return;
    }
    if (context === targetContext) {
      this.updateSource(newValue);
      return;
    }
    throw new Error(`Unexpected call context ${context}`);
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    let sourceExpression = this.sourceExpression;
    if (sourceExpression.bind) {
      sourceExpression.bind(this, source, this.lookupFunctions);
    }

    let targetProperty = this.targetProperty;
    if ('bind' in targetProperty){
      targetProperty.bind();
    }

    let value = sourceExpression.evaluate(source, this.lookupFunctions);
    this.updateTarget(value);

    let mode = this.mode;
    if (mode === bindingMode.oneWay || mode === bindingMode.twoWay) {
      sourceExpression.connect(this, source);

      if (mode === bindingMode.twoWay) {
        targetProperty.subscribe(targetContext, this);
      }
    }
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    if ('unbind' in this.targetProperty) {
      this.targetProperty.unbind();
    }
    if (this.mode === bindingMode.twoWay) {
      this.targetProperty.unsubscribe(targetContext, this);
    }
    this.unobserve(true);
  }
}
