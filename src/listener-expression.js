export class ListenerExpression {
  constructor(eventManager, targetEvent, sourceExpression, delegate, preventDefault){
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.sourceExpression = sourceExpression;
    this.delegate = delegate;
    this.discrete = true;
    this.preventDefault = preventDefault;
  }

  createBinding(target){
    return new Listener(
      this.eventManager,
      this.targetEvent,
      this.delegate,
      this.sourceExpression,
      target,
      this.preventDefault
      );
  }
}

class Listener {
  constructor(eventManager, targetEvent, delegate, sourceExpression, target, preventDefault){
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.delegate = delegate;
    this.sourceExpression = sourceExpression
    this.target = target;
    this.preventDefault = preventDefault;
  }

  bind(source){
    if(this._disposeListener){
      if(this.source === source){
        return;
      }

      this.unbind();
    }

    this.source = source;
    this._disposeListener = this.eventManager.addEventListener(this.target, this.targetEvent, event =>{
      var prevEvent = source.$event;
      source.$event = event;
      var result = this.sourceExpression.evaluate(source);
      source.$event = prevEvent;
      if(result !== true && this.preventDefault){
        event.preventDefault();
      }
      return result;
    }, this.delegate);
  }

  unbind(){
    if(this._disposeListener){
      this._disposeListener();
      this._disposeListener = null;
    }
  }
}
