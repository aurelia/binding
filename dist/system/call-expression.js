System.register([], function (_export) {
  "use strict";

  var CallExpression, Call;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [],
    execute: function () {
      CallExpression = (function () {
        function CallExpression(observerLocator, targetProperty, sourceExpression, valueConverterLookupFunction) {
          _classCallCheck(this, CallExpression);

          this.observerLocator = observerLocator;
          this.targetProperty = targetProperty;
          this.sourceExpression = sourceExpression;
          this.valueConverterLookupFunction = valueConverterLookupFunction;
        }

        CallExpression.prototype.createBinding = function createBinding(target) {
          return new Call(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.valueConverterLookupFunction);
        };

        return CallExpression;
      })();

      _export("CallExpression", CallExpression);

      Call = (function () {
        function Call(observerLocator, sourceExpression, target, targetProperty, valueConverterLookupFunction) {
          _classCallCheck(this, Call);

          this.sourceExpression = sourceExpression;
          this.target = target;
          this.targetProperty = observerLocator.getObserver(target, targetProperty);
          this.valueConverterLookupFunction = valueConverterLookupFunction;
        }

        Call.prototype.bind = function bind(source) {
          var _this = this;

          if (this.source === source) {
            return;
          }

          if (this.source) {
            this.unbind();
          }

          this.source = source;
          this.targetProperty.setValue(function ($event) {
            var result,
                temp = source.$event;
            source.$event = $event;
            result = _this.sourceExpression.evaluate(source, _this.valueConverterLookupFunction);
            source.$event = temp;
            return result;
          });
        };

        Call.prototype.unbind = function unbind() {
          this.targetProperty.setValue(null);
        };

        return Call;
      })();
    }
  };
});