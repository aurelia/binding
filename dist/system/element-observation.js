System.register([], function (_export) {
  var _classCallCheck, XLinkAttributeObserver, DataAttributeObserver, StyleObserver, ValueAttributeObserver, SelectValueObserver, CheckedObserver;

  return {
    setters: [],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      XLinkAttributeObserver = (function () {
        function XLinkAttributeObserver(element, propertyName, attributeName) {
          _classCallCheck(this, XLinkAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
          this.attributeName = attributeName;
        }

        XLinkAttributeObserver.prototype.getValue = function getValue() {
          return this.element.getAttributeNS('http://www.w3.org/1999/xlink', this.attributeName);
        };

        XLinkAttributeObserver.prototype.setValue = function setValue(newValue) {
          return this.element.setAttributeNS('http://www.w3.org/1999/xlink', this.attributeName, newValue);
        };

        XLinkAttributeObserver.prototype.subscribe = function subscribe(callback) {
          throw new Error('Observation of an Element\'s "' + this.propertyName + '" property is not supported.');
        };

        return XLinkAttributeObserver;
      })();

      _export('XLinkAttributeObserver', XLinkAttributeObserver);

      DataAttributeObserver = (function () {
        function DataAttributeObserver(element, propertyName) {
          _classCallCheck(this, DataAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
        }

        DataAttributeObserver.prototype.getValue = function getValue() {
          return this.element.getAttribute(this.propertyName);
        };

        DataAttributeObserver.prototype.setValue = function setValue(newValue) {
          return this.element.setAttribute(this.propertyName, newValue);
        };

        DataAttributeObserver.prototype.subscribe = function subscribe(callback) {
          throw new Error('Observation of an Element\'s "' + this.propertyName + '" property is not supported.');
        };

        return DataAttributeObserver;
      })();

      _export('DataAttributeObserver', DataAttributeObserver);

      StyleObserver = (function () {
        function StyleObserver(element, propertyName) {
          _classCallCheck(this, StyleObserver);

          this.element = element;
          this.propertyName = propertyName;
        }

        StyleObserver.prototype.getValue = function getValue() {
          return this.element.style.cssText;
        };

        StyleObserver.prototype.setValue = function setValue(newValue) {
          if (newValue instanceof Object) {
            newValue = this.flattenCss(newValue);
          }
          this.element.style.cssText = newValue;
        };

        StyleObserver.prototype.subscribe = function subscribe(callback) {
          throw new Error('Observation of an Element\'s "' + this.propertyName + '" property is not supported.');
        };

        StyleObserver.prototype.flattenCss = function flattenCss(object) {
          var s = '';
          for (var propertyName in object) {
            if (object.hasOwnProperty(propertyName)) {
              s += propertyName + ': ' + object[propertyName] + '; ';
            }
          }
          return s;
        };

        return StyleObserver;
      })();

      _export('StyleObserver', StyleObserver);

      ValueAttributeObserver = (function () {
        function ValueAttributeObserver(element, propertyName, handler) {
          _classCallCheck(this, ValueAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
          this.handler = handler;
          this.callbacks = [];
        }

        ValueAttributeObserver.prototype.getValue = function getValue() {
          return this.element[this.propertyName];
        };

        ValueAttributeObserver.prototype.setValue = function setValue(newValue) {
          this.element[this.propertyName] = newValue;
          this.call();
        };

        ValueAttributeObserver.prototype.call = function call() {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.oldValue,
              newValue = this.getValue();

          while (i--) {
            callbacks[i](newValue, oldValue);
          }

          this.oldValue = newValue;
        };

        ValueAttributeObserver.prototype.subscribe = function subscribe(callback) {
          var that = this;

          if (!this.disposeHandler) {
            this.oldValue = this.getValue();
            this.disposeHandler = this.handler.subscribe(this.element, this.call.bind(this));
          }

          this.callbacks.push(callback);

          return this.unsubscribe.bind(this, callback);
        };

        ValueAttributeObserver.prototype.unsubscribe = function unsubscribe(callback) {
          var callbacks = this.callbacks;
          callbacks.splice(callbacks.indexOf(callback), 1);
          if (callbacks.length === 0) {
            this.disposeHandler();
            this.disposeHandler = null;
          }
        };

        return ValueAttributeObserver;
      })();

      _export('ValueAttributeObserver', ValueAttributeObserver);

      SelectValueObserver = (function () {
        function SelectValueObserver(element, handler, observerLocator) {
          _classCallCheck(this, SelectValueObserver);

          this.element = element;
          this.handler = handler;
          this.observerLocator = observerLocator;
        }

        SelectValueObserver.prototype.getValue = function getValue() {
          return this.value;
        };

        SelectValueObserver.prototype.setValue = function setValue(newValue) {
          var _this = this;

          if (newValue !== null && newValue !== undefined && this.element.multiple && !Array.isArray(newValue)) {
            throw new Error('Only null or Array instances can be bound to a multi-select.');
          }
          if (this.value === newValue) {
            return;
          }

          if (this.arraySubscription) {
            this.arraySubscription();
            this.arraySubscription = null;
          }

          if (Array.isArray(newValue)) {
            this.arraySubscription = this.observerLocator.getArrayObserver(newValue).subscribe(this.synchronizeOptions.bind(this));
          }

          this.value = newValue;
          this.synchronizeOptions();

          if (this.element.options.length > 0 && !this.initialSync) {
            this.initialSync = true;
            this.observerLocator.taskQueue.queueMicroTask({ call: function call() {
                return _this.synchronizeOptions();
              } });
          }
        };

        SelectValueObserver.prototype.synchronizeOptions = function synchronizeOptions() {
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
            optionValue = option.hasOwnProperty('model') ? option.model : option.value;
            if (isArray) {
              option.selected = value.indexOf(optionValue) !== -1;
              continue;
            }
            option.selected = value === optionValue;
          }
        };

        SelectValueObserver.prototype.synchronizeValue = function synchronizeValue() {
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
            value[count] = option.hasOwnProperty('model') ? option.model : option.value;
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
        };

        SelectValueObserver.prototype.call = function call() {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.oldValue,
              newValue = this.value;

          while (i--) {
            callbacks[i](newValue, oldValue);
          }
        };

        SelectValueObserver.prototype.subscribe = function subscribe(callback) {
          if (!this.callbacks) {
            this.callbacks = [];
            this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
          }

          this.callbacks.push(callback);
          return this.unsubscribe.bind(this, callback);
        };

        SelectValueObserver.prototype.unsubscribe = function unsubscribe(callback) {
          var callbacks = this.callbacks;
          callbacks.splice(callbacks.indexOf(callback), 1);
          if (callbacks.length === 0) {
            this.disposeHandler();
            this.disposeHandler = null;
            this.callbacks = null;
          }
        };

        SelectValueObserver.prototype.bind = function bind() {
          var _this2 = this;

          this.domObserver = new MutationObserver(function () {
            _this2.synchronizeOptions();
            _this2.synchronizeValue();
          });
          this.domObserver.observe(this.element, { childList: true, subtree: true });
        };

        SelectValueObserver.prototype.unbind = function unbind() {
          this.domObserver.disconnect();
          this.domObserver = null;

          if (this.arraySubscription) {
            this.arraySubscription();
            this.arraySubscription = null;
          }
        };

        return SelectValueObserver;
      })();

      _export('SelectValueObserver', SelectValueObserver);

      CheckedObserver = (function () {
        function CheckedObserver(element, handler, observerLocator) {
          _classCallCheck(this, CheckedObserver);

          this.element = element;
          this.handler = handler;
          this.observerLocator = observerLocator;
        }

        CheckedObserver.prototype.getValue = function getValue() {
          return this.value;
        };

        CheckedObserver.prototype.setValue = function setValue(newValue) {
          var _this3 = this;

          if (this.value === newValue) {
            return;
          }

          if (this.arraySubscription) {
            this.arraySubscription();
            this.arraySubscription = null;
          }

          if (this.element.type === 'checkbox' && Array.isArray(newValue)) {
            this.arraySubscription = this.observerLocator.getArrayObserver(newValue).subscribe(this.synchronizeElement.bind(this));
          }

          this.value = newValue;
          this.synchronizeElement();

          if (!this.element.hasOwnProperty('model') && !this.initialSync) {
            this.initialSync = true;
            this.observerLocator.taskQueue.queueMicroTask({ call: function call() {
                return _this3.synchronizeElement();
              } });
          }
        };

        CheckedObserver.prototype.synchronizeElement = function synchronizeElement() {
          var value = this.value,
              element = this.element,
              elementValue = element.hasOwnProperty('model') ? element.model : element.value,
              isRadio = element.type === 'radio';

          element.checked = isRadio && value === elementValue || !isRadio && value === true || !isRadio && Array.isArray(value) && value.indexOf(elementValue) !== -1;
        };

        CheckedObserver.prototype.synchronizeValue = function synchronizeValue() {
          var value = this.value,
              element = this.element,
              elementValue = element.hasOwnProperty('model') ? element.model : element.value,
              index;

          if (element.type === 'checkbox') {
            if (Array.isArray(value)) {
              index = value.indexOf(elementValue);
              if (element.checked && index === -1) {
                value.push(elementValue);
              } else if (!element.checked && index !== -1) {
                value.splice(index, 1);
              }

              return;
            } else {
              value = element.checked;
            }
          } else if (element.checked) {
            value = elementValue;
          } else {
            return;
          }

          this.oldValue = this.value;
          this.value = value;
          this.call();
        };

        CheckedObserver.prototype.call = function call() {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.oldValue,
              newValue = this.value;

          while (i--) {
            callbacks[i](newValue, oldValue);
          }
        };

        CheckedObserver.prototype.subscribe = function subscribe(callback) {
          if (!this.callbacks) {
            this.callbacks = [];
            this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
          }

          this.callbacks.push(callback);
          return this.unsubscribe.bind(this, callback);
        };

        CheckedObserver.prototype.unsubscribe = function unsubscribe(callback) {
          var callbacks = this.callbacks;
          callbacks.splice(callbacks.indexOf(callback), 1);
          if (callbacks.length === 0) {
            this.disposeHandler();
            this.disposeHandler = null;
            this.callbacks = null;
          }
        };

        CheckedObserver.prototype.unbind = function unbind() {
          if (this.arraySubscription) {
            this.arraySubscription();
            this.arraySubscription = null;
          }
        };

        return CheckedObserver;
      })();

      _export('CheckedObserver', CheckedObserver);
    }
  };
});