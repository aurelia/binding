System.register(["./binding-modes"], function (_export) {
  var ONE_WAY, TWO_WAY, _prototypeProperties, _classCallCheck, BindingExpression, Binding;

  return {
    setters: [function (_bindingModes) {
      ONE_WAY = _bindingModes.ONE_WAY;
      TWO_WAY = _bindingModes.TWO_WAY;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      BindingExpression = _export("BindingExpression", (function () {
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

        _prototypeProperties(BindingExpression, null, {
          createBinding: {
            value: function createBinding(target) {
              return new Binding(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.mode, this.valueConverterLookupFunction);
            },
            writable: true,
            configurable: true
          }
        });

        return BindingExpression;
      })());

      Binding = (function () {
        function Binding(observerLocator, sourceExpression, target, targetProperty, mode, valueConverterLookupFunction) {
          _classCallCheck(this, Binding);

          this.observerLocator = observerLocator;
          this.sourceExpression = sourceExpression;
          this.targetProperty = observerLocator.getObserver(target, targetProperty);
          this.mode = mode;
          this.valueConverterLookupFunction = valueConverterLookupFunction;
        }

        _prototypeProperties(Binding, null, {
          getObserver: {
            value: function getObserver(obj, propertyName) {
              return this.observerLocator.getObserver(obj, propertyName);
            },
            writable: true,
            configurable: true
          },
          bind: {
            value: function bind(source) {
              var _this = this;

              var targetProperty = this.targetProperty,
                  info;

              if ("bind" in targetProperty) {
                targetProperty.bind();
              }

              if (this.mode == ONE_WAY || this.mode == TWO_WAY) {
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

                if (this.mode == TWO_WAY) {
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
            },
            writable: true,
            configurable: true
          },
          unbind: {
            value: function unbind() {
              if ("unbind" in this.targetProperty) {
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
            },
            writable: true,
            configurable: true
          }
        });

        return Binding;
      })();
    }
  };
});