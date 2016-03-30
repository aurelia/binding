export class CallExpression {
  constructor(observerLocator, targetProperty, sourceExpression, lookupFunctions) {
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.lookupFunctions = lookupFunctions;
  }

  createBinding(target) {
    return new Call(
      this.observerLocator,
      this.sourceExpression,
      target,
      this.targetProperty,
      this.lookupFunctions
      );
  }
}

export class Call {
  constructor(observerLocator, sourceExpression, target, targetProperty, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.lookupFunctions = lookupFunctions;
  }

  callSource($event) {
    let overrideContext = this.source.overrideContext;
    Object.assign(overrideContext, $event);
    overrideContext.$event = $event; // deprecate this?
    let mustEvaluate = true;
    let result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
    delete overrideContext.$event;
    for (let prop in $event) {
      delete overrideContext[prop];
    }
    return result;
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

    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this.targetProperty.setValue($event => this.callSource($event));
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
    this.targetProperty.setValue(null);
  }
}
