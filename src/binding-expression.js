import {bindingMode} from './binding-mode';
import {Parser} from './parser';
import {ObserverLocator} from './observer-locator';
import {Container} from 'aurelia-dependency-injection';

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

  static create(targetProperty, sourceExpression, mode=bindingMode.oneWay) {
    let parser = Container.instance.get(Parser);
    let observerLocator = Container.instance.get(ObserverLocator);

    return new BindingExpression(
      observerLocator,
      targetProperty,
      parser.parse(sourceExpression),
      mode
    );
  }
}

const sourceContext = 'Binding:source';
const targetContext = 'Binding:target';

class Binding {
  constructor(observerLocator, sourceExpression, target, targetProperty, mode, valueConverterLookupFunction) {
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.mode = mode;
    this.valueConverterLookupFunction = valueConverterLookupFunction;
  }

  getObserver(obj, propertyName) {
    return this.observerLocator.getObserver(obj, propertyName);
  }

  call(context, newValue, oldValue) {
    if (context === sourceContext) {
      let current = this.targetProperty.getValue();
      if (newValue !== current) {
        this.targetProperty.setValue(newValue);
      }
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

    if (this.mode === bindingMode.oneWay || this.mode === bindingMode.twoWay) {
      let sourceInfo = this.sourceExpression.connect(this, source);
      this.sourceProperty = sourceInfo.observer;
      if (this.sourceProperty) {
        this.sourceProperty.subscribe(sourceContext, this);
      }

      targetProperty.setValue(sourceInfo.value);

      if (this.mode === bindingMode.twoWay) {
        targetProperty.subscribe(targetContext, this);
      }

      this.source = source;
    } else {
      let value = this.sourceExpression.evaluate(source, this.valueConverterLookupFunction);
      targetProperty.setValue(value);
    }
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
    if (this.sourceProperty) {
      this.sourceProperty.unsubscribe(sourceContext, this);
    }
  }
}
