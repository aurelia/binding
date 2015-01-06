"use strict";

var DefaultEventStrategy = function DefaultEventStrategy() {
  this.delegatedEvents = {};
};

DefaultEventStrategy.prototype.ensureDelegatedEvent = function (eventName) {
  if (this.delegatedEvents[eventName]) {
    return;
  }

  this.delegatedEvents[eventName] = true;
  document.addEventListener(eventName, this.handleDelegatedEvent.bind(this), false);
};

DefaultEventStrategy.prototype.handleCallbackResult = function (result) {};

DefaultEventStrategy.prototype.handleDelegatedEvent = function (event) {
  event = event || window.event;
  var target = event.target || event.srcElement, callback;

  while (target && !callback) {
    if (target.delegatedEvents) {
      callback = target.delegatedEvents[event.type];
    }

    if (!callback) {
      target = target.parentNode;
    }
  }

  if (callback) {
    this.handleCallbackResult(callback(event));
  }
};

DefaultEventStrategy.prototype.createDirectEventCallback = function (callback) {
  var _this = this;
  return function (event) {
    _this.handleCallbackResult(callback(event));
  };
};

DefaultEventStrategy.prototype.subscribeToDelegatedEvent = function (target, targetEvent, callback) {
  var lookup = target.delegatedEvents || (target.delegatedEvents = {});

  this.ensureDelegatedEvent(targetEvent);
  lookup[targetEvent] = callback;

  return function () {
    lookup[targetEvent] = null;
  };
};

DefaultEventStrategy.prototype.subscribeToDirectEvent = function (target, targetEvent, callback) {
  var directEventCallback = this.createDirectEventCallback(callback);
  target.addEventListener(targetEvent, directEventCallback, false);

  return function () {
    target.removeEventListener(targetEvent, directEventCallback);
  };
};

DefaultEventStrategy.prototype.subscribe = function (target, targetEvent, callback, delegate) {
  if (delegate) {
    return this.subscribeToDirectEvent(target, targetEvent, callback);
  } else {
    return this.subscribeToDelegatedEvent(target, targetEvent, callback);
  }
};

var EventManager = function EventManager() {
  this.elementHandlerLookup = {};
  this.eventStrategyLookup = {};
  this.registerElementConfig("input", {
    value: ["change", "input"],
    checked: ["change", "input"]
  });
  this.registerElementConfig("textarea", { value: ["change", "input"] });
  this.registerElementConfig("select", { value: ["change"] });
  this.defaultEventStrategy = new DefaultEventStrategy();
};

EventManager.prototype.registerElementConfig = function (tagName, config) {
  this.elementHandlerLookup[tagName.toLowerCase()] = {
    subscribe: function subscribe(target, property, callback) {
      var events = config[property];
      if (events) {
        events.forEach(function (changeEvent) {
          target.addEventListener(changeEvent, callback, false);
        });

        return function () {
          events.forEach(function (changeEvent) {
            target.removeEventListener(changeEvent, callback);
          });
        };
      } else {
        throw new Error("Cannot observe property " + property + " of " + tagName + ". No events found.");
      }
    }
  };
};

EventManager.prototype.registerElementHandler = function (tagName, handler) {
  this.elementHandlerLookup[tagName.toLowerCase()] = handler;
};

EventManager.prototype.registerEventStrategy = function (eventName, strategy) {
  this.eventStrategyLookup[eventName] = strategy;
};

EventManager.prototype.getElementHandler = function (target) {
  if (target.tagName) {
    var handler = this.elementHandlerLookup[target.tagName.toLowerCase()];
    if (handler) {
      return handler;
    }
  }

  return null;
};

EventManager.prototype.addEventListener = function (target, targetEvent, callback, delegate) {
  return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy).subscribe(target, targetEvent, callback, delegate);
};

exports.EventManager = EventManager;