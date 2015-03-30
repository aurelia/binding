System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, XLinkAttributeObserver, DataAttributeObserver, StyleObserver, ValueAttributeObserver, SelectValueObserver, CheckedObserver;

  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      XLinkAttributeObserver = _export("XLinkAttributeObserver", (function () {
        // xlink namespaced attributes require getAttributeNS/setAttributeNS
        // (even though the NS version doesn't work for other namespaces
        // in html5 documents)

        function XLinkAttributeObserver(element, propertyName, attributeName) {
          _classCallCheck(this, XLinkAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
          this.attributeName = attributeName;
        }

        _prototypeProperties(XLinkAttributeObserver, null, {
          getValue: {
            value: function getValue() {
              return this.element.getAttributeNS("http://www.w3.org/1999/xlink", this.attributeName);
            },
            writable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              return this.element.setAttributeNS("http://www.w3.org/1999/xlink", this.attributeName, newValue);
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              throw new Error("Observation of an Element's \"" + this.propertyName + "\" property is not supported.");
            },
            writable: true,
            configurable: true
          }
        });

        return XLinkAttributeObserver;
      })());
      DataAttributeObserver = _export("DataAttributeObserver", (function () {
        function DataAttributeObserver(element, propertyName) {
          _classCallCheck(this, DataAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
        }

        _prototypeProperties(DataAttributeObserver, null, {
          getValue: {
            value: function getValue() {
              return this.element.getAttribute(this.propertyName);
            },
            writable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              return this.element.setAttribute(this.propertyName, newValue);
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              throw new Error("Observation of an Element's \"" + this.propertyName + "\" property is not supported.");
            },
            writable: true,
            configurable: true
          }
        });

        return DataAttributeObserver;
      })());
      StyleObserver = _export("StyleObserver", (function () {
        function StyleObserver(element, propertyName) {
          _classCallCheck(this, StyleObserver);

          this.element = element;
          this.propertyName = propertyName;
        }

        _prototypeProperties(StyleObserver, null, {
          getValue: {
            value: function getValue() {
              return this.element.style.cssText;
            },
            writable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              if (newValue instanceof Object) {
                newValue = this.flattenCss(newValue);
              }
              this.element.style.cssText = newValue;
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              throw new Error("Observation of an Element's \"" + this.propertyName + "\" property is not supported.");
            },
            writable: true,
            configurable: true
          },
          flattenCss: {
            value: function flattenCss(object) {
              var s = "";
              for (var propertyName in object) {
                if (object.hasOwnProperty(propertyName)) {
                  s += propertyName + ": " + object[propertyName] + "; ";
                }
              }
              return s;
            },
            writable: true,
            configurable: true
          }
        });

        return StyleObserver;
      })());
      ValueAttributeObserver = _export("ValueAttributeObserver", (function () {
        function ValueAttributeObserver(element, propertyName, handler) {
          _classCallCheck(this, ValueAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
          this.handler = handler;
          this.callbacks = [];
        }

        _prototypeProperties(ValueAttributeObserver, null, {
          getValue: {
            value: function getValue() {
              return this.element[this.propertyName];
            },
            writable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              this.element[this.propertyName] = newValue;
              this.call();
            },
            writable: true,
            configurable: true
          },
          call: {
            value: function call() {
              var callbacks = this.callbacks,
                  i = callbacks.length,
                  oldValue = this.oldValue,
                  newValue = this.getValue();

              while (i--) {
                callbacks[i](newValue, oldValue);
              }

              this.oldValue = newValue;
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              var that = this;

              if (!this.disposeHandler) {
                this.oldValue = this.getValue();
                this.disposeHandler = this.handler.subscribe(this.element, this.call.bind(this));
              }

              this.callbacks.push(callback);

              return this.unsubscribe.bind(this, callback);
            },
            writable: true,
            configurable: true
          },
          unsubscribe: {
            value: function unsubscribe(callback) {
              var callbacks = this.callbacks;
              callbacks.splice(callbacks.indexOf(callback), 1);
              if (callbacks.length === 0) {
                this.disposeHandler();
                this.disposeHandler = null;
              }
            },
            writable: true,
            configurable: true
          }
        });

        return ValueAttributeObserver;
      })());
      SelectValueObserver = _export("SelectValueObserver", (function () {
        function SelectValueObserver(element, handler, observerLocator) {
          _classCallCheck(this, SelectValueObserver);

          this.element = element;
          this.handler = handler;
          this.observerLocator = observerLocator;
        }

        _prototypeProperties(SelectValueObserver, null, {
          getValue: {
            value: function getValue() {
              return this.value;
            },
            writable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              var _this = this;

              if (newValue !== null && newValue !== undefined && this.element.multiple && !Array.isArray(newValue)) {
                throw new Error("Only null or Array instances can be bound to a multi-select.");
              }
              if (this.value === newValue) {
                return;
              }
              // unsubscribe from old array.
              if (this.arraySubscription) {
                this.arraySubscription();
                this.arraySubscription = null;
              }
              // subscribe to new array.
              if (Array.isArray(newValue)) {
                this.arraySubscription = this.observerLocator.getArrayObserver(newValue).subscribe(this.synchronizeOptions.bind(this));
              }
              // assign and sync element.
              this.value = newValue;
              this.synchronizeOptions();
              // queue up an initial sync after the bindings have been evaluated.
              if (this.element.options.length > 0 && !this.initialSync) {
                this.initialSync = true;
                this.observerLocator.taskQueue.queueMicroTask({ call: function () {
                    return _this.synchronizeOptions();
                  } });
              }
            },
            writable: true,
            configurable: true
          },
          synchronizeOptions: {
            value: function synchronizeOptions() {
              var value = this.value,
                  i,
                  options,
                  option,
                  optionValue,
                  clear,
                  isArray;

              if (value === null || value === undefined) {
                clear = true;
              } else if (Array.isArray(value)) {
                isArray = true;
              }

              options = this.element.options;
              i = options.length;
              while (i--) {
                option = options.item(i);
                if (clear) {
                  option.selected = false;
                  continue;
                }
                optionValue = option.hasOwnProperty("model") ? option.model : option.value;
                if (isArray) {
                  option.selected = value.indexOf(optionValue) !== -1;
                  continue;
                }
                option.selected = value === optionValue;
              }
            },
            writable: true,
            configurable: true
          },
          synchronizeValue: {
            value: function synchronizeValue() {
              var options = this.element.options,
                  option,
                  i,
                  ii,
                  count = 0,
                  value = [];

              for (i = 0, ii = options.length; i < ii; i++) {
                option = options.item(i);
                if (!option.selected) {
                  continue;
                }
                value[count] = option.hasOwnProperty("model") ? option.model : option.value;
                count++;
              }

              if (!this.element.multiple) {
                if (count === 0) {
                  value = null;
                } else {
                  value = value[0];
                }
              }

              this.oldValue = this.value;
              this.value = value;
              this.call();
            },
            writable: true,
            configurable: true
          },
          call: {
            value: function call() {
              var callbacks = this.callbacks,
                  i = callbacks.length,
                  oldValue = this.oldValue,
                  newValue = this.value;

              while (i--) {
                callbacks[i](newValue, oldValue);
              }
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              if (!this.callbacks) {
                this.callbacks = [];
                this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
              }

              this.callbacks.push(callback);
              return this.unsubscribe.bind(this, callback);
            },
            writable: true,
            configurable: true
          },
          unsubscribe: {
            value: function unsubscribe(callback) {
              var callbacks = this.callbacks;
              callbacks.splice(callbacks.indexOf(callback), 1);
              if (callbacks.length === 0) {
                this.disposeHandler();
                this.disposeHandler = null;
                this.callbacks = null;
              }
            },
            writable: true,
            configurable: true
          },
          bind: {
            value: function bind() {
              this.domObserver = new MutationObserver(this.synchronizeOptions.bind(this));
              this.domObserver.observe(this.element, { childList: true, subtree: true });
            },
            writable: true,
            configurable: true
          },
          unbind: {
            value: function unbind() {
              this.domObserver.disconnect();
              this.domObserver = null;

              if (this.arraySubscription) {
                this.arraySubscription();
                this.arraySubscription = null;
              }
            },
            writable: true,
            configurable: true
          }
        });

        return SelectValueObserver;
      })());
      CheckedObserver = _export("CheckedObserver", (function () {
        function CheckedObserver(element, handler, observerLocator) {
          _classCallCheck(this, CheckedObserver);

          this.element = element;
          this.handler = handler;
          this.observerLocator = observerLocator;
        }

        _prototypeProperties(CheckedObserver, null, {
          getValue: {
            value: function getValue() {
              return this.value;
            },
            writable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              var _this = this;

              if (this.value === newValue) {
                return;
              }
              // unsubscribe from old array.
              if (this.arraySubscription) {
                this.arraySubscription();
                this.arraySubscription = null;
              }
              // subscribe to new array.
              if (this.element.type === "checkbox" && Array.isArray(newValue)) {
                this.arraySubscription = this.observerLocator.getArrayObserver(newValue).subscribe(this.synchronizeElement.bind(this));
              }
              // assign and sync element.
              this.value = newValue;
              this.synchronizeElement();
              // queue up an initial sync after the bindings have been evaluated.
              if (!this.element.hasOwnProperty("model") && !this.initialSync) {
                this.initialSync = true;
                this.observerLocator.taskQueue.queueMicroTask({ call: function () {
                    return _this.synchronizeElement();
                  } });
              }
            },
            writable: true,
            configurable: true
          },
          synchronizeElement: {
            value: function synchronizeElement() {
              var value = this.value,
                  element = this.element,
                  elementValue = element.hasOwnProperty("model") ? element.model : element.value,
                  isRadio = element.type === "radio";

              element.checked = isRadio && value === elementValue || !isRadio && value === true || !isRadio && Array.isArray(value) && value.indexOf(elementValue) !== -1;
            },
            writable: true,
            configurable: true
          },
          synchronizeValue: {
            value: function synchronizeValue() {
              var value = this.value,
                  element = this.element,
                  elementValue = element.hasOwnProperty("model") ? element.model : element.value,
                  index;

              if (element.type === "checkbox") {
                if (Array.isArray(value)) {
                  index = value.indexOf(elementValue);
                  if (element.checked && index === -1) {
                    value.push(elementValue);
                  } else if (!element.checked && index !== -1) {
                    value.splice(index, 1);
                  }
                  // don't invoke callbacks.
                  return;
                } else {
                  value = element.checked;
                }
              } else if (element.checked) {
                value = elementValue;
              } else {
                // don't invoke callbacks.
                return;
              }

              this.oldValue = this.value;
              this.value = value;
              this.call();
            },
            writable: true,
            configurable: true
          },
          call: {
            value: function call() {
              var callbacks = this.callbacks,
                  i = callbacks.length,
                  oldValue = this.oldValue,
                  newValue = this.value;

              while (i--) {
                callbacks[i](newValue, oldValue);
              }
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              if (!this.callbacks) {
                this.callbacks = [];
                this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
              }

              this.callbacks.push(callback);
              return this.unsubscribe.bind(this, callback);
            },
            writable: true,
            configurable: true
          },
          unsubscribe: {
            value: function unsubscribe(callback) {
              var callbacks = this.callbacks;
              callbacks.splice(callbacks.indexOf(callback), 1);
              if (callbacks.length === 0) {
                this.disposeHandler();
                this.disposeHandler = null;
                this.callbacks = null;
              }
            },
            writable: true,
            configurable: true
          },
          unbind: {
            value: function unbind() {
              if (this.arraySubscription) {
                this.arraySubscription();
                this.arraySubscription = null;
              }
            },
            writable: true,
            configurable: true
          }
        });

        return CheckedObserver;
      })());
    }
  };
});