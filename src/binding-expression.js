import {bindingMode} from './binding-mode';
import {connectable, sourceContext} from './connectable-binding';

export class BindingExpression {
  constructor(observerLocator, targetProperty, sourceExpression,
    mode, valueConverterLookupFunction, attribute){
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.mode = mode;
    this.valueConverterLookupFunction = valueConverterLookupFunction;
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
      this.valueConverterLookupFunction
      );
  }
}

const targetContext = 'Binding:target';

@connectable()
class Binding {
  constructor(observerLocator, sourceExpression, target, targetProperty, mode, valueConverterLookupFunction) {
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.mode = mode;
    this.valueConverterLookupFunction = valueConverterLookupFunction;
  }

  call(context, newValue, oldValue) {
    if (!this.isBound) {
      return;
    }
    if (context === sourceContext) {
      oldValue = this.targetProperty.getValue();
      newValue = this.sourceExpression.evaluate(this.source, this.valueConverterLookupFunction);
      if (newValue !== oldValue) {
        this.targetProperty.setValue(newValue);
      }
      this._version++;
      this.sourceExpression.connect(this, this.source);
      this.unobserve(false);
      return;
    }
    if (context === targetContext) {
      this.sourceExpression.assign(this.source, newValue, this.valueConverterLookupFunction);
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

    let targetProperty = this.targetProperty;
    if ('bind' in targetProperty){
      targetProperty.bind();
    }

    let mode = this.mode;
    if (mode === bindingMode.oneWay || mode === bindingMode.twoWay) {
      this.sourceExpression.connect(this, source);

      if (mode === bindingMode.twoWay) {
        targetProperty.subscribe(targetContext, this);
      }
    }

    let value = this.sourceExpression.evaluate(source, this.valueConverterLookupFunction);
    targetProperty.setValue(value);
  }

  unbind() {
    this.isBound = false;
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
