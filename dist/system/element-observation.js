System.register([], function (_export) {
  var _classCallCheck, _createClass, XLinkAttributeObserver, DataAttributeObserver, StyleObserver, ValueAttributeObserver, SelectValueObserver, CheckedObserver;

  return {
    setters: [],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      XLinkAttributeObserver = (function () {
        function XLinkAttributeObserver(element, propertyName, attributeName) {
          _classCallCheck(this, XLinkAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
          this.attributeName = attributeName;
        }

        _createClass(XLinkAttributeObserver, [{
          key: 'getValue',
          value: function getValue() {
            return this.element.getAttributeNS('http://www.w3.org/1999/xlink', this.attributeName);
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            return this.element.setAttributeNS('http://www.w3.org/1999/xlink', this.attributeName, newValue);
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            throw new Error('Observation of an Element\'s "' + this.propertyName + '" property is not supported.');
          }
        }]);

        return XLinkAttributeObserver;
      })();

      _export('XLinkAttributeObserver', XLinkAttributeObserver);

      DataAttributeObserver = (function () {
        function DataAttributeObserver(element, propertyName) {
          _classCallCheck(this, DataAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
        }

        _createClass(DataAttributeObserver, [{
          key: 'getValue',
          value: function getValue() {
            return this.element.getAttribute(this.propertyName);
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            return this.element.setAttribute(this.propertyName, newValue);
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            throw new Error('Observation of an Element\'s "' + this.propertyName + '" property is not supported.');
          }
        }]);

        return DataAttributeObserver;
      })();

      _export('DataAttributeObserver', DataAttributeObserver);

      StyleObserver = (function () {
        function StyleObserver(element, propertyName) {
          _classCallCheck(this, StyleObserver);

          this.element = element;
          this.propertyName = propertyName;
        }

        _createClass(StyleObserver, [{
          key: 'getValue',
          value: function getValue() {
            return this.element.style.cssText;
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            if (newValue instanceof Object) {
              newValue = this.flattenCss(newValue);
            }
            this.element.style.cssText = newValue;
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            throw new Error('Observation of an Element\'s "' + this.propertyName + '" property is not supported.');
          }
        }, {
          key: 'flattenCss',
          value: function flattenCss(object) {
            var s = '';
            for (var propertyName in object) {
              if (object.hasOwnProperty(propertyName)) {
                s += propertyName + ': ' + object[propertyName] + '; ';
              }
            }
            return s;
          }
        }]);

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

        _createClass(ValueAttributeObserver, [{
          key: 'getValue',
          value: function getValue() {
            return this.element[this.propertyName];
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            this.element[this.propertyName] = newValue;
            this.call();
          }
        }, {
          key: 'call',
          value: function call() {
            var callbacks = this.callbacks,
                i = callbacks.length,
                oldValue = this.oldValue,
                newValue = this.getValue();

            while (i--) {
              callbacks[i](newValue, oldValue);
            }

            this.oldValue = newValue;
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            var that = this;

            if (!this.disposeHandler) {
              this.oldValue = this.getValue();
              this.disposeHandler = this.handler.subscribe(this.element, this.call.bind(this));
            }

            this.callbacks.push(callback);

            return this.unsubscribe.bind(this, callback);
          }
        }, {
          key: 'unsubscribe',
          value: function unsubscribe(callback) {
            var callbacks = this.callbacks;
            callbacks.splice(callbacks.indexOf(callback), 1);
            if (callbacks.length === 0) {
              this.disposeHandler();
              this.disposeHandler = null;
            }
          }
        }]);

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

        _createClass(SelectValueObserver, [{
          key: 'getValue',
          value: function getValue() {
            return this.value;
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
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
          }
        }, {
          key: 'synchronizeOptions',
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
              optionValue = option.hasOwnProperty('model') ? option.model : option.value;
              if (isArray) {
                option.selected = value.indexOf(optionValue) !== -1;
                continue;
              }
              option.selected = value === optionValue;
            }
          }
        }, {
          key: 'synchronizeValue',
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
          }
        }, {
          key: 'call',
          value: function call() {
            var callbacks = this.callbacks,
                i = callbacks.length,
                oldValue = this.oldValue,
                newValue = this.value;

            while (i--) {
              callbacks[i](newValue, oldValue);
            }
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            if (!this.callbacks) {
              this.callbacks = [];
              this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
            }

            this.callbacks.push(callback);
            return this.unsubscribe.bind(this, callback);
          }
        }, {
          key: 'unsubscribe',
          value: function unsubscribe(callback) {
            var callbacks = this.callbacks;
            callbacks.splice(callbacks.indexOf(callback), 1);
            if (callbacks.length === 0) {
              this.disposeHandler();
              this.disposeHandler = null;
              this.callbacks = null;
            }
          }
        }, {
          key: 'bind',
          value: function bind() {
            this.domObserver = new MutationObserver(this.synchronizeOptions.bind(this));
            this.domObserver.observe(this.element, { childList: true, subtree: true });
          }
        }, {
          key: 'unbind',
          value: function unbind() {
            this.domObserver.disconnect();
            this.domObserver = null;

            if (this.arraySubscription) {
              this.arraySubscription();
              this.arraySubscription = null;
            }
          }
        }]);

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

        _createClass(CheckedObserver, [{
          key: 'getValue',
          value: function getValue() {
            return this.value;
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            var _this2 = this;

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
                  return _this2.synchronizeElement();
                } });
            }
          }
        }, {
          key: 'synchronizeElement',
          value: function synchronizeElement() {
            var value = this.value,
                element = this.element,
                elementValue = element.hasOwnProperty('model') ? element.model : element.value,
                isRadio = element.type === 'radio';

            element.checked = isRadio && value === elementValue || !isRadio && value === true || !isRadio && Array.isArray(value) && value.indexOf(elementValue) !== -1;
          }
        }, {
          key: 'synchronizeValue',
          value: function synchronizeValue() {
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
          }
        }, {
          key: 'call',
          value: function call() {
            var callbacks = this.callbacks,
                i = callbacks.length,
                oldValue = this.oldValue,
                newValue = this.value;

            while (i--) {
              callbacks[i](newValue, oldValue);
            }
          }
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            if (!this.callbacks) {
              this.callbacks = [];
              this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
            }

            this.callbacks.push(callback);
            return this.unsubscribe.bind(this, callback);
          }
        }, {
          key: 'unsubscribe',
          value: function unsubscribe(callback) {
            var callbacks = this.callbacks;
            callbacks.splice(callbacks.indexOf(callback), 1);
            if (callbacks.length === 0) {
              this.disposeHandler();
              this.disposeHandler = null;
              this.callbacks = null;
            }
          }
        }, {
          key: 'unbind',
          value: function unbind() {
            if (this.arraySubscription) {
              this.arraySubscription();
              this.arraySubscription = null;
            }
          }
        }]);

        return CheckedObserver;
      })();

      _export('CheckedObserver', CheckedObserver);
    }
  };
});