function handleDelegatedEvent(event){
  event = event || window.event;
  var target = event.target || event.srcElement,
      callback;

  while(target && !callback) {
    if(target.delegatedCallbacks){
      callback = target.delegatedCallbacks[event.type];
    }

    if(!callback){
      target = target.parentNode;
    }
  }

  if(callback){
    event.stopPropagation();
    callback(event);
  }
}

class DelegateHandlerEntry {
  constructor(boundary, eventName){
    this.boundary = boundary;
    this.eventName = eventName;
    this.count = 0;
  }

  increment(){
    this.count++;

    if(this.count === 1){
      this.boundary.addEventListener(this.eventName, handleDelegatedEvent, false);
    }
  }

  decrement(){
    this.count--;

    if(this.count === 0){
      this.boundary.removeEventListener(this.eventName, handleDelegatedEvent);
    }
  }
}

class DefaultEventStrategy {
  subscribe(target, targetEvent, callback, delegate){
    if(delegate){
      let boundary = target.domBoundary || document,
          delegatedHandlers = boundary.delegatedHandlers || (boundary.delegatedHandlers = {}),
          handlerEntry = delegatedHandlers[targetEvent] || (delegatedHandlers[targetEvent] = new DelegateHandlerEntry(boundary, targetEvent)),
          delegatedCallbacks = target.delegatedCallbacks || (target.delegatedCallbacks = {});

      handlerEntry.increment();
      delegatedCallbacks[targetEvent] = callback;

      return function(){
        handlerEntry.decrement();
        delegatedCallbacks[targetEvent] = null;
      };
    }else{
      target.addEventListener(targetEvent, callback, false);

      return function(){
        target.removeEventListener(targetEvent, callback);
      };
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
        checked:['change','input'],
        files:['change','input']
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

    this.registerElementConfig({
      tagName:'content editable',
      properties: {
        value:['change','input','blur','keyup','paste'],
      }
    });

    this.registerElementConfig({
      tagName:'scrollable element',
      properties: {
        scrollTop:['scroll'],
        scrollLeft:['scroll']
      }
    });

    this.defaultEventStrategy = new DefaultEventStrategy();
  }

  registerElementConfig(config){
    var tagName = config.tagName.toLowerCase(), properties = config.properties, propertyName;
    this.elementHandlerLookup[tagName] = {};
    for(propertyName in properties){
      if (properties.hasOwnProperty(propertyName)){
        this.registerElementPropertyConfig(tagName, propertyName, properties[propertyName]);
      }
    }
  }

  registerElementPropertyConfig(tagName, propertyName, events) {
    this.elementHandlerLookup[tagName][propertyName] = {
      subscribe(target, callback) {
        events.forEach(changeEvent => {
          target.addEventListener(changeEvent, callback, false);
        });

        return function(){
          events.forEach(changeEvent => {
            target.removeEventListener(changeEvent, callback);
          });
        }
      }
    }
  }

  registerElementHandler(tagName, handler){
    this.elementHandlerLookup[tagName.toLowerCase()] = handler;
  }

  registerEventStrategy(eventName, strategy){
    this.eventStrategyLookup[eventName] = strategy;
  }

  getElementHandler(target, propertyName){
    var tagName, lookup = this.elementHandlerLookup;
    if(target.tagName){
      tagName = target.tagName.toLowerCase();
      if(lookup[tagName] && lookup[tagName][propertyName]){
        return lookup[tagName][propertyName];
      }
      if (propertyName === 'textContent' || propertyName === 'innerHTML'){
        return lookup['content editable']['value'];
      }
      if (propertyName === 'scrollTop' || propertyName === 'scrollLeft'){
        return lookup['scrollable element'][propertyName];
      }
    }

    return null;
  }

  addEventListener(target, targetEvent, callback, delegate){
    return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy)
      .subscribe(target, targetEvent, callback, delegate);
  }
}
