'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var DefaultEventStrategy = (function () {
  function DefaultEventStrategy() {
    _classCallCheck(this, DefaultEventStrategy);

    this.delegatedEvents = {};
  }

  _createClass(DefaultEventStrategy, [{
    key: 'ensureDelegatedEvent',
    value: function ensureDelegatedEvent(eventName) {
      if (this.delegatedEvents[eventName]) {
        return;
      }

      this.delegatedEvents[eventName] = true;
      document.addEventListener(eventName, this.handleDelegatedEvent.bind(this), false);
    }
  }, {
    key: 'handleCallbackResult',
    value: function handleCallbackResult(result) {}
  }, {
    key: 'handleDelegatedEvent',
    value: function handleDelegatedEvent(event) {
      event = event || window.event;
      var target = event.target || event.srcElement,
          callback;

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
    }
  }, {
    key: 'createDirectEventCallback',
    value: function createDirectEventCallback(callback) {
      var _this = this;

      return function (event) {
        _this.handleCallbackResult(callback(event));
      };
    }
  }, {
    key: 'subscribeToDelegatedEvent',
    value: function subscribeToDelegatedEvent(target, targetEvent, callback) {
      var lookup = target.delegatedEvents || (target.delegatedEvents = {});

      this.ensureDelegatedEvent(targetEvent);
      lookup[targetEvent] = callback;

      return function () {
        lookup[targetEvent] = null;
      };
    }
  }, {
    key: 'subscribeToDirectEvent',
    value: function subscribeToDirectEvent(target, targetEvent, callback) {
      var directEventCallback = this.createDirectEventCallback(callback);
      target.addEventListener(targetEvent, directEventCallback, false);

      return function () {
        target.removeEventListener(targetEvent, directEventCallback);
      };
    }
  }, {
    key: 'subscribe',
    value: function subscribe(target, targetEvent, callback, delegate) {
      if (delegate) {
        return this.subscribeToDirectEvent(target, targetEvent, callback);
      } else {
        return this.subscribeToDelegatedEvent(target, targetEvent, callback);
      }
    }
  }]);

  return DefaultEventStrategy;
})();

var EventManager = (function () {
  function EventManager() {
    _classCallCheck(this, EventManager);

    this.elementHandlerLookup = {};
    this.eventStrategyLookup = {};

    this.registerElementConfig({
      tagName: 'input',
      properties: {
        value: ['change', 'input'],
        checked: ['change', 'input']
      }
    });

    this.registerElementConfig({
      tagName: 'textarea',
      properties: {
        value: ['change', 'input']
      }
    });

    this.registerElementConfig({
      tagName: 'select',
      properties: {
        value: ['change']
      }
    });

    this.defaultEventStrategy = new DefaultEventStrategy();
  }

  _createClass(EventManager, [{
    key: 'registerElementConfig',
    value: function registerElementConfig(config) {
      var tagName = config.tagName.toLowerCase(),
          properties = config.properties,
          propertyName;
      this.elementHandlerLookup[tagName] = {};
      for (propertyName in properties) {
        if (properties.hasOwnProperty(propertyName)) {
          this.registerElementPropertyConfig(tagName, propertyName, properties[propertyName]);
        }
      }
    }
  }, {
    key: 'registerElementPropertyConfig',
    value: function registerElementPropertyConfig(tagName, propertyName, events) {
      this.elementHandlerLookup[tagName][propertyName] = {
        subscribe: function subscribe(target, callback) {
          events.forEach(function (changeEvent) {
            target.addEventListener(changeEvent, callback, false);
          });

          return function () {
            events.forEach(function (changeEvent) {
              target.removeEventListener(changeEvent, callback);
            });
          };
        }
      };
    }
  }, {
    key: 'registerElementHandler',
    value: function registerElementHandler(tagName, handler) {
      this.elementHandlerLookup[tagName.toLowerCase()] = handler;
    }
  }, {
    key: 'registerEventStrategy',
    value: function registerEventStrategy(eventName, strategy) {
      this.eventStrategyLookup[eventName] = strategy;
    }
  }, {
    key: 'getElementHandler',
    value: function getElementHandler(target, propertyName) {
      var tagName,
          lookup = this.elementHandlerLookup;
      if (target.tagName) {
        tagName = target.tagName.toLowerCase();
        if (lookup[tagName] && lookup[tagName][propertyName]) {
          return lookup[tagName][propertyName];
        }
        if (propertyName === 'textContent' || propertyName === 'innerHTML') {
          return lookup.input.value;
        }
      }

      return null;
    }
  }, {
    key: 'addEventListener',
    value: function addEventListener(target, targetEvent, callback, delegate) {
      return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy).subscribe(target, targetEvent, callback, delegate);
    }
  }]);

  return EventManager;
})();

exports.EventManager = EventManager;