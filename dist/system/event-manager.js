System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, DefaultEventStrategy, EventManager;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      DefaultEventStrategy = (function () {
        function DefaultEventStrategy() {
          _classCallCheck(this, DefaultEventStrategy);

          this.delegatedEvents = {};
        }

        _prototypeProperties(DefaultEventStrategy, null, {
          ensureDelegatedEvent: {
            value: function ensureDelegatedEvent(eventName) {
              if (this.delegatedEvents[eventName]) {
                return;
              }

              this.delegatedEvents[eventName] = true;
              document.addEventListener(eventName, this.handleDelegatedEvent.bind(this), false);
            },
            writable: true,
            configurable: true
          },
          handleCallbackResult: {
            value: function handleCallbackResult(result) {},
            writable: true,
            configurable: true
          },
          handleDelegatedEvent: {
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
            },
            writable: true,
            configurable: true
          },
          createDirectEventCallback: {
            value: function createDirectEventCallback(callback) {
              var _this = this;

              return function (event) {
                _this.handleCallbackResult(callback(event));
              };
            },
            writable: true,
            configurable: true
          },
          subscribeToDelegatedEvent: {
            value: function subscribeToDelegatedEvent(target, targetEvent, callback) {
              var lookup = target.delegatedEvents || (target.delegatedEvents = {});

              this.ensureDelegatedEvent(targetEvent);
              lookup[targetEvent] = callback;

              return function () {
                lookup[targetEvent] = null;
              };
            },
            writable: true,
            configurable: true
          },
          subscribeToDirectEvent: {
            value: function subscribeToDirectEvent(target, targetEvent, callback) {
              var directEventCallback = this.createDirectEventCallback(callback);
              target.addEventListener(targetEvent, directEventCallback, false);

              return function () {
                target.removeEventListener(targetEvent, directEventCallback);
              };
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(target, targetEvent, callback, delegate) {
              if (delegate) {
                return this.subscribeToDirectEvent(target, targetEvent, callback);
              } else {
                return this.subscribeToDelegatedEvent(target, targetEvent, callback);
              }
            },
            writable: true,
            configurable: true
          }
        });

        return DefaultEventStrategy;
      })();

      EventManager = _export("EventManager", (function () {
        function EventManager() {
          _classCallCheck(this, EventManager);

          this.elementHandlerLookup = {};
          this.eventStrategyLookup = {};

          this.registerElementConfig({
            tagName: "input",
            properties: {
              value: ["change", "input"],
              checked: ["change", "input"]
            }
          });

          this.registerElementConfig({
            tagName: "textarea",
            properties: {
              value: ["change", "input"]
            }
          });

          this.registerElementConfig({
            tagName: "select",
            properties: {
              value: ["change"]
            }
          });

          this.defaultEventStrategy = new DefaultEventStrategy();
        }

        _prototypeProperties(EventManager, null, {
          registerElementConfig: {
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
            },
            writable: true,
            configurable: true
          },
          registerElementPropertyConfig: {
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
            },
            writable: true,
            configurable: true
          },
          registerElementHandler: {
            value: function registerElementHandler(tagName, handler) {
              this.elementHandlerLookup[tagName.toLowerCase()] = handler;
            },
            writable: true,
            configurable: true
          },
          registerEventStrategy: {
            value: function registerEventStrategy(eventName, strategy) {
              this.eventStrategyLookup[eventName] = strategy;
            },
            writable: true,
            configurable: true
          },
          getElementHandler: {
            value: function getElementHandler(target, propertyName) {
              var tagName,
                  lookup = this.elementHandlerLookup;
              if (target.tagName) {
                tagName = target.tagName.toLowerCase();
                if (lookup[tagName] && lookup[tagName][propertyName]) {
                  return lookup[tagName][propertyName];
                }
                if (propertyName === "textContent" || propertyName === "innerHTML") {
                  return lookup.input.value;
                }
              }

              return null;
            },
            writable: true,
            configurable: true
          },
          addEventListener: {
            value: function addEventListener(target, targetEvent, callback, delegate) {
              return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy).subscribe(target, targetEvent, callback, delegate);
            },
            writable: true,
            configurable: true
          }
        });

        return EventManager;
      })());
    }
  };
});

//todo: coroutine via result?