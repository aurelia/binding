System.register([], function (_export) {
  "use strict";

  var ListenerExpression, Listener;
  return {
    setters: [],
    execute: function () {
      ListenerExpression = function ListenerExpression(eventManager, targetEvent, sourceExpression, delegate, preventDefault) {
        this.eventManager = eventManager;
        this.targetEvent = targetEvent;
        this.sourceExpression = sourceExpression;
        this.delegate = delegate;
        this.discrete = true;
        this.preventDefault = preventDefault;
      };

      ListenerExpression.prototype.createBinding = function (target) {
        return new Listener(this.eventManager, this.targetEvent, this.delegate, this.sourceExpression, target, this.preventDefault);
      };

      _export("ListenerExpression", ListenerExpression);

      Listener = function Listener(eventManager, targetEvent, delegate, sourceExpression, target, preventDefault) {
        this.eventManager = eventManager;
        this.targetEvent = targetEvent;
        this.delegate = delegate;
        this.sourceExpression = sourceExpression;
        this.target = target;
        this.preventDefault = preventDefault;
      };

      Listener.prototype.bind = function (source) {
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
          var result = _this.sourceExpression.eval(source);
          source.$event = prevEvent;
          if (_this.preventDefault) {
            event.preventDefault();
          }
          return result;
        }, this.delegate);
      };

      Listener.prototype.unbind = function () {
        if (this._disposeListener) {
          this._disposeListener();
          this._disposeListener = null;
        }
      };
    }
  };
});