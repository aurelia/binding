define(["exports", "./binding-modes"], function (exports, _bindingModes) {
  "use strict";

  var ONE_WAY = _bindingModes.ONE_WAY;
  var TWO_WAY = _bindingModes.TWO_WAY;
  var BindingExpression = (function () {
    var BindingExpression = function BindingExpression(observerLocator, targetProperty, sourceExpression, mode, filterLookupFunction, attribute) {
      this.observerLocator = observerLocator;
      this.targetProperty = targetProperty;
      this.sourceExpression = sourceExpression;
      this.mode = mode;
      this.filterLookupFunction = filterLookupFunction;
      this.attribute = attribute;
      this.discrete = false;
    };

    BindingExpression.prototype.createBinding = function (target) {
      return new Binding(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.mode, this.filterLookupFunction);
    };

    return BindingExpression;
  })();

  exports.BindingExpression = BindingExpression;
  var Binding = (function () {
    var Binding = function Binding(observerLocator, sourceExpression, target, targetProperty, mode, filterLookupFunction) {
      this.observerLocator = observerLocator;
      this.sourceExpression = sourceExpression;
      this.targetProperty = observerLocator.getObserver(target, targetProperty);
      this.mode = mode;
      this.filterLookupFunction = filterLookupFunction;
    };

    Binding.prototype.getObserver = function (obj, propertyName) {
      return this.observerLocator.getObserver(obj, propertyName);
    };

    Binding.prototype.bind = function (source) {
      var _this = this;
      var targetProperty = this.targetProperty, info;

      if (this.mode == ONE_WAY || this.mode == TWO_WAY) {
        if (this._disposeObserver) {
          if (this.source === source) {
            return;
          }

          this.unbind();
        }

        info = this.sourceExpression.connect(this, source);

        if (info.observer) {
          console.log("bind: " + this.sourceExpression.toString());
          this._disposeObserver = info.observer.subscribe(function (newValue) {
            var existing = targetProperty.getValue();
            if (newValue !== existing) {
              targetProperty.setValue(newValue);
            }
          });
        }

        if (info.value !== undefined) {
          targetProperty.setValue(info.value);
        }

        if (this.mode == TWO_WAY) {
          this._disposeListener = targetProperty.subscribe(function (newValue) {
            _this.sourceExpression.assign(source, newValue);
          });
        }

        this.source = source;
      } else {
        var value = this.sourceExpression.eval(source, this.filterLookupFunction);

        if (value !== undefined) {
          targetProperty.setValue(value);
        }
      }
    };

    Binding.prototype.unbind = function () {
      if (this._disposeObserver) {
        console.log("unbind: " + this.sourceExpression.toString());
        this._disposeObserver();
        this._disposeObserver = null;
      }

      if (this._disposeListener) {
        this._disposeListener();
        this._disposeListener = null;
      }
    };

    return Binding;
  })();
});