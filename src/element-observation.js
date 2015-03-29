export class XLinkAttributeObserver {
  // xlink namespaced attributes require getAttributeNS/setAttributeNS
  // (even though the NS version doesn't work for other namespaces
  // in html5 documents)
  constructor(element, propertyName, attributeName) {
    this.element = element;
    this.propertyName = propertyName;
    this.attributeName = attributeName;
  }

  getValue() {
    return this.element.getAttributeNS('http://www.w3.org/1999/xlink', this.attributeName);
  }

  setValue(newValue) {
    return this.element.setAttributeNS('http://www.w3.org/1999/xlink', this.attributeName, newValue);
  }

  subscribe(callback) {
    throw new Error(`Observation of an Element\'s "${this.propertyName}" property is not supported.`);
  }
}

export class DataAttributeObserver {
  constructor(element, propertyName) {
    this.element = element;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.element.getAttribute(this.propertyName);
  }

  setValue(newValue) {
    return this.element.setAttribute(this.propertyName, newValue);
  }

  subscribe(callback) {
    throw new Error(`Observation of an Element\'s "${this.propertyName}" property is not supported.`);
  }
}

export class StyleObserver {
  constructor(element, propertyName) {
    this.element = element;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.element.style.cssText;
  }

  setValue(newValue) {
    if (newValue instanceof Object) {
      newValue = this.flattenCss(newValue);
    }
    this.element.style.cssText = newValue;
  }

  subscribe(callback) {
    throw new Error(`Observation of an Element\'s "${this.propertyName}" property is not supported.`);
  }

  flattenCss(object) {
    var s = '';
    for(var propertyName in object) {
      if (object.hasOwnProperty(propertyName)){
        s += propertyName + ': ' + object[propertyName] + '; ';
      }
    }
    return s;
  }
}

export class ValueAttributeObserver {
  constructor(element, propertyName, handler){
    this.element = element;
    this.propertyName = propertyName;
    this.handler = handler;
    this.callbacks = [];
  }

  getValue() {
    return this.element[this.propertyName];
  }

  setValue(newValue) {
    this.element[this.propertyName] = newValue;
    this.call();
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.getValue();

    while(i--) {
      callbacks[i](newValue, oldValue);
    }

    this.oldValue = newValue;
  }

  subscribe(callback){
    var that = this;

    if(!this.disposeHandler){
      this.oldValue = this.getValue();
      this.disposeHandler = this.handler.subscribe(this.element, this.call.bind(this));
    }

    this.callbacks.push(callback);

    return this.unsubscribe.bind(this, callback);
  }

  unsubscribe(callback) {
    var callbacks = this.callbacks;
    callbacks.splice(callbacks.indexOf(callback), 1);
    if(callbacks.length === 0){
      this.disposeHandler();
      this.disposeHandler = null;
    }
  }
}

export class SelectValueObserver {
  constructor(element, handler, observerLocator){
    this.element = element;
    this.handler = handler;
    this.observerLocator = observerLocator;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    if (newValue !== null && newValue !== undefined && this.element.multiple && !Array.isArray(newValue)) {
      throw new Error('Only null or Array instances can be bound to a multi-select.')
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
      this.arraySubscription = this.observerLocator.getArrayObserver(newValue)
        .subscribe(this.synchronizeOptions.bind(this));
    }
    // assign and sync element.
    this.value = newValue;
    this.synchronizeOptions();
    // queue up an initial sync after the bindings have been evaluated.
    if (this.element.options.length > 0 && !this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask({ call: () => this.synchronizeOptions() });
    }
  }

  synchronizeOptions() {
    var value = this.value, i, options, option, optionValue, clear, isArray;

    if (value === null || value === undefined) {
      clear = true;
    } else if (Array.isArray(value)) {
      isArray = true;
    }

    options = this.element.options;
    i = options.length;
    while(i--) {
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

  synchronizeValue(){
    var options = this.element.options, option, i, ii, count = 0, value = [];

    for(i = 0, ii = options.length; i < ii; i++) {
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

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.value;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  subscribe(callback) {
    if(!this.callbacks) {
      this.callbacks = [];
      this.disposeHandler = this.handler
        .subscribe(this.element, this.synchronizeValue.bind(this, false));
    }

    this.callbacks.push(callback);
    return this.unsubscribe.bind(this, callback);
  }

  unsubscribe(callback) {
    var callbacks = this.callbacks;
    callbacks.splice(callbacks.indexOf(callback), 1);
    if(callbacks.length === 0){
      this.disposeHandler();
      this.disposeHandler = null;
      this.callbacks = null;
    }
  }

  bind() {
    this.domObserver = new MutationObserver(this.synchronizeOptions.bind(this));
    this.domObserver.observe(this.element, { childList: true, subtree: true });
  }

  unbind() {
    this.domObserver.disconnect();
    this.domObserver = null;

    if (this.arraySubscription) {
      this.arraySubscription();
      this.arraySubscription = null;
    }
  }
}

export class CheckedObserver {
  constructor(element, handler, observerLocator){
    this.element = element;
    this.handler = handler;
    this.observerLocator = observerLocator;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    if (this.value === newValue) {
      return;
    }
    // unsubscribe from old array.
    if (this.arraySubscription) {
      this.arraySubscription();
      this.arraySubscription = null;
    }
    // subscribe to new array.
    if (this.element.type === 'checkbox' && Array.isArray(newValue)) {
      this.arraySubscription = this.observerLocator.getArrayObserver(newValue)
        .subscribe(this.synchronizeElement.bind(this));
    }
    // assign and sync element.
    this.value = newValue;
    this.synchronizeElement();
    // queue up an initial sync after the bindings have been evaluated.
    if (!this.element.hasOwnProperty('model') && !this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask({ call: () => this.synchronizeElement() });
    }
  }

  synchronizeElement() {
    var value = this.value,
        element = this.element,
        elementValue = element.hasOwnProperty('model') ? element.model : element.value,
        isRadio = element.type === 'radio';

    element.checked =
      isRadio && value === elementValue
      || !isRadio && value === true
      || !isRadio && Array.isArray(value) && value.indexOf(elementValue) !== -1;
  }

  synchronizeValue(){
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
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.value;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  subscribe(callback) {
    if(!this.callbacks) {
      this.callbacks = [];
      this.disposeHandler = this.handler
        .subscribe(this.element, this.synchronizeValue.bind(this, false));
    }

    this.callbacks.push(callback);
    return this.unsubscribe.bind(this, callback);
  }

  unsubscribe(callback) {
    var callbacks = this.callbacks;
    callbacks.splice(callbacks.indexOf(callback), 1);
    if(callbacks.length === 0){
      this.disposeHandler();
      this.disposeHandler = null;
      this.callbacks = null;
    }
  }

  unbind() {
    if (this.arraySubscription) {
      this.arraySubscription();
      this.arraySubscription = null;
    }
  }
}
