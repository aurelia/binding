System.register(['./binding-modes'], function (_export) {
  var bindingMode, _classCallCheck, BindingExpression, Binding;

  return {
    setters: [function (_bindingModes) {
      bindingMode = _bindingModes.bindingMode;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      BindingExpression = (function () {
        function BindingExpression(observerLocator, targetProperty, sourceExpression, mode, valueConverterLookupFunction, attribute) {
          _classCallCheck(this, BindingExpression);

          this.observerLocator = observerLocator;
          this.targetProperty = targetProperty;
          this.sourceExpression = sourceExpression;
          this.mode = mode;
          this.valueConverterLookupFunction = valueConverterLookupFunction;
          this.attribute = attribute;
          this.discrete = false;
        }

        BindingExpression.prototype.createBinding = function createBinding(target) {
          return new Binding(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.mode, this.valueConverterLookupFunction);
        };

        return BindingExpression;
      })();

      _export('BindingExpression', BindingExpression);

      Binding = (function () {
        function Binding(observerLocator, sourceExpression, target, targetProperty, mode, valueConverterLookupFunction) {
          _classCallCheck(this, Binding);

          this.observerLocator = observerLocator;
          this.sourceExpression = sourceExpression;
          this.targetProperty = observerLocator.getObserver(target, targetProperty);
          this.mode = mode;
          this.valueConverterLookupFunction = valueConverterLookupFunction;
        }

        Binding.prototype.getObserver = function getObserver(obj, propertyName) {
          return this.observerLocator.getObserver(obj, propertyName);
        };

        Binding.prototype.bind = function bind(source) {
          var _this = this;

          var targetProperty = this.targetProperty,
              info;

          if ('bind' in targetProperty) {
            targetProperty.bind();
          }

          if (this.mode == bindingMode.oneWay || this.mode == bindingMode.twoWay) {
            if (this._disposeObserver) {
              if (this.source === source) {
                return;
              }

              this.unbind();
            }

            info = this.sourceExpression.connect(this, source);

            if (info.observer) {
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

            if (this.mode == bindingMode.twoWay) {
              this._disposeListener = targetProperty.subscribe(function (newValue) {
                _this.sourceExpression.assign(source, newValue, _this.valueConverterLookupFunction);
              });
            }

            this.source = source;
          } else {
            var value = this.sourceExpression.evaluate(source, this.valueConverterLookupFunction);

            if (value !== undefined) {
              targetProperty.setValue(value);
            }
          }
        };

        Binding.prototype.unbind = function unbind() {
          if ('unbind' in this.targetProperty) {
            this.targetProperty.unbind();
          }
          if (this._disposeObserver) {
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
    }
  };
});