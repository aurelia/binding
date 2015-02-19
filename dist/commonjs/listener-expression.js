"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var ListenerExpression = exports.ListenerExpression = (function () {
  function ListenerExpression(eventManager, targetEvent, sourceExpression, delegate, preventDefault) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.sourceExpression = sourceExpression;
    this.delegate = delegate;
    this.discrete = true;
    this.preventDefault = preventDefault;
  }

  _prototypeProperties(ListenerExpression, null, {
    createBinding: {
      value: function createBinding(target) {
        return new Listener(this.eventManager, this.targetEvent, this.delegate, this.sourceExpression, target, this.preventDefault);
      },
      writable: true,
      configurable: true
    }
  });

  return ListenerExpression;
})();
var Listener = (function () {
  function Listener(eventManager, targetEvent, delegate, sourceExpression, target, preventDefault) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.delegate = delegate;
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.preventDefault = preventDefault;
  }

  _prototypeProperties(Listener, null, {
    bind: {
      value: function bind(source) {
        var _this = this;
        if (this._disposeListener) {
          if (this.source === source) {
            return;
          }

          this.unbind();
        }

        this.source = source;
        this._disposeListener = this.eventManager.addEventListener(this.target, this.targetEvent, function (event) {
          var prevEvent = source.$event;
          source.$event = event;
          var result = _this.sourceExpression.evaluate(source);
          source.$event = prevEvent;
          if (result !== true && _this.preventDefault) {
            event.preventDefault();
          }
          return result;
        }, this.delegate);
      },
      writable: true,
      configurable: true
    },
    unbind: {
      value: function unbind() {
        if (this._disposeListener) {
          this._disposeListener();
          this._disposeListener = null;
        }
      },
      writable: true,
      configurable: true
    }
  });

  return Listener;
})();

exports.__esModule = true;