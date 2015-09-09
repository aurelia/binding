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

  createBinding(target){
    return new Binding(
      this.observerLocator,
      this.sourceExpression,
      target,
      this.targetProperty,
      this.mode,
      this.valueConverterLookupFunction
      );
  }

  static create(targetProperty, sourceExpression, mode=bindingMode.oneWay){
    let parser = Container.instance.get(Parser),
        observerLocator = Container.instance.get(ObserverLocator);

    return new BindingExpression(
      observerLocator,
      targetProperty,
      parser.parse(sourceExpression),
      mode
    );
  }
}

class Binding {
  constructor(observerLocator, sourceExpression, target, targetProperty, mode, valueConverterLookupFunction){
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.mode = mode;
    this.valueConverterLookupFunction = valueConverterLookupFunction;
  }

  getObserver(obj, propertyName) {
    return this.observerLocator.getObserver(obj, propertyName);
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;

    let targetProperty = this.targetProperty;
    if ('bind' in targetProperty){
      targetProperty.bind();
    }

    if (this.mode === bindingMode.oneWay || this.mode === bindingMode.twoWay) {
      let sourceInfo = this.sourceExpression.connect(this, source);
      this.sourceProperty = sourceInfo.observer;

      if (this.sourceProperty) {
        this.sourceChanged = newValue => {
          let existing = targetProperty.getValue();
          if (newValue !== existing) {
            targetProperty.setValue(newValue);
          }
        };
        this.sourceProperty.subscribe(this.sourceChanged);
      }

      targetProperty.setValue(sourceInfo.value);

      if (this.mode === bindingMode.twoWay) {
        this.targetChanged = newValue => {
          this.sourceExpression.assign(source, newValue, this.valueConverterLookupFunction);
        };
        targetProperty.subscribe(this.targetChanged);
      }

      this.source = source;
    } else {
      let value = this.sourceExpression.evaluate(source, this.valueConverterLookupFunction);
      targetProperty.setValue(value);
    }
  }

  unbind() {
    this.isBound = false;
    if ('unbind' in this.targetProperty){
      this.targetProperty.unbind();
    }
    if(this.targetChanged){
      this.targetProperty.unsubscribe(this.targetChanged);
      this.targetChanged = null;
    }
    if(this.sourceChanged){
      this.sourceProperty.unsubscribe(this.sourceChanged);
      this.sourceChanged = null;
    }
  }
}
