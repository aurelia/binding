define(["exports"], function (exports) {
  "use strict";

  var ListenerExpression = (function () {
    var ListenerExpression = function ListenerExpression(eventManager, targetEvent, sourceExpression, delegate) {
      this.eventManager = eventManager;
      this.targetEvent = targetEvent;
      this.sourceExpression = sourceExpression;
      this.delegate = delegate;
      this.discrete = true;
    };

    ListenerExpression.prototype.createBinding = function (target) {
      return new Listener(this.eventManager, this.targetEvent, this.delegate, this.sourceExpression, target);
    };

    return ListenerExpression;
  })();

  exports.ListenerExpression = ListenerExpression;
  var Listener = (function () {
    var Listener = function Listener(eventManager, targetEvent, delegate, sourceExpression, target) {
      this.eventManager = eventManager;
      this.targetEvent = targetEvent;
      this.delegate = delegate;
      this.sourceExpression = sourceExpression;
      this.target = target;
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
        return result;
      }, this.delegate);
    };

    Listener.prototype.unbind = function () {
      if (this._disposeListener) {
        this._disposeListener();
        this._disposeListener = null;
      }
    };

    return Listener;
  })();
});