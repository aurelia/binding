import {ONE_WAY, TWO_WAY} from './binding-modes';

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
}

class Binding {
  constructor(observerLocator, sourceExpression, target, targetProperty, mode, valueConverterLookupFunction){
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.mode = mode;
    this.valueConverterLookupFunction = valueConverterLookupFunction;
  }

  getObserver(obj, propertyName){
    return this.observerLocator.getObserver(obj, propertyName);
  }

  bind(source){
    var targetProperty = this.targetProperty,
        info;

    if(this.mode == ONE_WAY || this.mode == TWO_WAY){
      if(this._disposeObserver){
        if(this.source === source){
          return;
        }

        this.unbind();
      }

      info = this.sourceExpression.connect(this, source);

      if(info.observer){
        this._disposeObserver = info.observer.subscribe(newValue =>{
          var existing = targetProperty.getValue();
          if(newValue !== existing){
            targetProperty.setValue(newValue);
          }
        });
      }

      if(info.value !== undefined){
        targetProperty.setValue(info.value);
      }

      if(this.mode == TWO_WAY){
        this._disposeListener = targetProperty.subscribe(newValue => {
          this.sourceExpression.assign(source, newValue, this.valueConverterLookupFunction);
        });
      }

      this.source = source;
    }else{
      var value = this.sourceExpression.evaluate(source, this.valueConverterLookupFunction);

      if(value !== undefined){
        targetProperty.setValue(value);
      }
    }
  }

  unbind(){
    if(this._disposeObserver){
      this._disposeObserver();
      this._disposeObserver = null;
    }

    if(this._disposeListener){
      this._disposeListener();
      this._disposeListener = null;
    }
  }
}
