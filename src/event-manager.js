class DefaultEventStrategy {
  constructor(){
    this.delegatedEvents = {};
  }

  ensureDelegatedEvent(eventName){
    if(this.delegatedEvents[eventName]){
      return;
    }

    this.delegatedEvents[eventName] = true;
    document.addEventListener(eventName, this.handleDelegatedEvent.bind(this), false);
  }

  handleCallbackResult(result){
    //todo: coroutine via result?
  }

  handleDelegatedEvent(event){
    event = event || window.event;
    var target = event.target || event.srcElement,
        callback;

    while(target && !callback) {
      if(target.delegatedEvents){
        callback = target.delegatedEvents[event.type];
      }

      if(!callback){
        target = target.parentNode;
      }
    }

    if(callback){
      this.handleCallbackResult(callback(event));
    }
  }

  createDirectEventCallback(callback){
    return event => {
      this.handleCallbackResult(callback(event));
    };
  }

  subscribeToDelegatedEvent(target, targetEvent, callback){
    var lookup = target.delegatedEvents || (target.delegatedEvents = {});

    this.ensureDelegatedEvent(targetEvent);
    lookup[targetEvent] = callback;

    return function(){
      lookup[targetEvent] = null;
    };
  }

  subscribeToDirectEvent(target, targetEvent, callback){
    var directEventCallback = this.createDirectEventCallback(callback);
    target.addEventListener(targetEvent, directEventCallback, false);

    return function(){
      target.removeEventListener(targetEvent, directEventCallback);
    };
  }

  subscribe(target, targetEvent, callback, delegate){
    if(delegate){
      return this.subscribeToDirectEvent(target, targetEvent, callback);
    }else{
      return this.subscribeToDelegatedEvent(target,  targetEvent, callback);
    }
  }
}

export class EventManager {
  constructor(){
    this.elementHandlerLookup = {};
    this.eventStrategyLookup = {};

    this.registerElementConfig({
      tagName:'input',
      properties: {
        value:['change','input'],
        checked:['change','input']
      }
    });

    this.registerElementConfig({
      tagName:'textarea',
      properties:{
        value:['change','input']
      }
    });

    this.registerElementConfig({
      tagName:'select',
      properties:{
        value:['change']
      }
    });

    this.defaultEventStrategy = new DefaultEventStrategy();
  }

  registerElementConfig(config){
    this.elementHandlerLookup[config.tagName.toLowerCase()] = {
      subscribe(target, property, callback) {
        var events = config.properties[property];
        if(events){
          events.forEach(changeEvent => {
            target.addEventListener(changeEvent, callback, false);
          });

          return function(){
            events.forEach(changeEvent => {
              target.removeEventListener(changeEvent, callback);
            });
          }
        }else{
          throw new Error(`Cannot observe property ${property} of ${config.tagName}. No events found.`)
        }
      },
      properties: config.properties
    }
  }

  registerElementHandler(tagName, handler){
    this.elementHandlerLookup[tagName.toLowerCase()] = handler;
  }

  registerEventStrategy(eventName, strategy){
    this.eventStrategyLookup[eventName] = strategy;
  }

  getElementHandler(target, propertyName){
    if(target.tagName){
      var handler = this.elementHandlerLookup[target.tagName.toLowerCase()];
      if(handler && handler.properties[propertyName]){
        return handler;
      }
    }

    return null;
  }

  addEventListener(target, targetEvent, callback, delegate){
    return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy)
      .subscribe(target, targetEvent, callback, delegate);
  }
}
