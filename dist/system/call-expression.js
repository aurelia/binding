System.register([], function (_export) {
  var _classCallCheck, _createClass, CallExpression, Call;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      CallExpression = (function () {
        function CallExpression(observerLocator, targetProperty, sourceExpression, valueConverterLookupFunction) {
          _classCallCheck(this, CallExpression);

          this.observerLocator = observerLocator;
          this.targetProperty = targetProperty;
          this.sourceExpression = sourceExpression;
          this.valueConverterLookupFunction = valueConverterLookupFunction;
        }

        _createClass(CallExpression, [{
          key: "createBinding",
          value: function createBinding(target) {
            return new Call(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.valueConverterLookupFunction);
          }
        }]);

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

        _createClass(Call, [{
          key: "bind",
          value: function bind(source) {
            var _this = this;

            if (this.source === source) {
              return;
            }

            if (this.source) {
              this.unbind();
            }

            this.source = source;
            this.targetProperty.setValue(function () {
              for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
                rest[_key] = arguments[_key];
              }

              return _this.sourceExpression.evaluate(source, _this.valueConverterLookupFunction, rest);
            });
          }
        }, {
          key: "unbind",
          value: function unbind() {
            this.targetProperty.setValue(null);
          }
        }]);

        return Call;
      })();
    }
  };
});