export class ListenerExpression {
  constructor(eventManager, targetEvent, sourceExpression, eventHandlingMethod, preventDefault, lookupFunctions) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.sourceExpression = sourceExpression;
    this.eventHandlingMethod = eventHandlingMethod;
    this.discrete = true;
    this.preventDefault = preventDefault;
    this.lookupFunctions = lookupFunctions;
  }

  createBinding(target) {
    return new Listener(
      this.eventManager,
      this.targetEvent,
      this.eventHandlingMethod,
      this.sourceExpression,
      target,
      this.preventDefault,
      this.lookupFunctions
      );
  }
}

export class Listener {
  constructor(eventManager, targetEvent, eventHandlingMethod, sourceExpression, target, preventDefault, lookupFunctions) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.eventHandlingMethod = eventHandlingMethod;
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.preventDefault = preventDefault;
    this.lookupFunctions = lookupFunctions;
  }

  callSource(event) {
    let overrideContext = this.source.overrideContext;
    overrideContext.$event = event;
    let mustEvaluate = true;
    let result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
    delete overrideContext.$event;
    if (result !== true && this.preventDefault) {
      event.preventDefault();
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
    this._disposeListener = this.eventManager.addEventListener(
      this.target,
      this.targetEvent,
      event => this.callSource(event),
      this.eventHandlingMethod);
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
    this._disposeListener();
    this._disposeListener = null;
  }
}
