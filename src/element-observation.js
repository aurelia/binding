import {subscriberCollection} from './subscriber-collection';
import {DOM} from 'aurelia-pal';

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

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
  }
}

export const dataAttributeAccessor = {
  getValue: (obj, propertyName) => obj.getAttribute(propertyName),
  setValue: (value, obj, propertyName) => obj.setAttribute(propertyName, value)
};

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

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
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

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
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

@subscriberCollection()
export class ValueAttributeObserver {
  constructor(element, propertyName, handler) {
    this.element = element;
    this.propertyName = propertyName;
    this.handler = handler;
    if (propertyName === 'files') {
      // input.files cannot be assigned.
      this.setValue = () => {};
    }
  }

  getValue() {
    return this.element[this.propertyName];
  }

  setValue(newValue) {
    newValue = newValue === undefined || newValue === null ? '' : newValue;
    if (this.element[this.propertyName] !== newValue) {
      this.element[this.propertyName] = newValue;
      this.notify();
    }
  }

  notify() {
    let oldValue = this.oldValue;
    let newValue = this.getValue();

    this.callSubscribers(newValue, oldValue);

    this.oldValue = newValue;
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.getValue();
      this.disposeHandler = this.handler.subscribe(this.element, this.notify.bind(this));
    }

    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.disposeHandler();
      this.disposeHandler = null;
    }
  }
}

const selectArrayContext = 'SelectValueObserver:array'

@subscriberCollection()
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
    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(selectArrayContext, this);
      this.arrayObserver = null;
    }
    // subscribe to new array.
    if (Array.isArray(newValue)) {
      this.arrayObserver = this.observerLocator.getArrayObserver(newValue);
      this.arrayObserver.subscribe(selectArrayContext, this);
    }
    // assign and sync element.
    this.value = newValue;
    this.synchronizeOptions();
    // queue up an initial sync after the bindings have been evaluated.
    if (!this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask(this);
    }
  }

  call(context, splices) {
    // called by task queue and array observer.
    this.synchronizeOptions();
  }

  synchronizeOptions() {
    let value = this.value, clear, isArray;

    if (value === null || value === undefined) {
      clear = true;
    } else if (Array.isArray(value)) {
      isArray = true;
    }

    let options = this.element.options;
    let i = options.length;
    let matcher = this.element.matcher || ((a, b) => a === b);
    while(i--) {
      let option = options.item(i);
      if (clear) {
        option.selected = false;
        continue;
      }
      let optionValue = option.hasOwnProperty('model') ? option.model : option.value;
      if (isArray) {
        option.selected = !!value.find(item => !!matcher(optionValue, item));
        continue;
      }
      option.selected = !!matcher(optionValue, value);
    }
  }

  synchronizeValue() {
    let options = this.element.options,
        count = 0,
        value = [];

    for (let i = 0, ii = options.length; i < ii; i++) {
      let option = options.item(i);
      if (!option.selected) {
        continue;
      }
      value.push(option.hasOwnProperty('model') ? option.model : option.value);
      count++;
    }

    if (this.element.multiple) {
      // multi-select
      if (Array.isArray(this.value)) {
        let matcher = this.element.matcher || ((a, b) => a === b);
        // remove items that are no longer selected.
        let i = 0;
        while (i < this.value.length) {
          let a = this.value[i];
          if (value.findIndex(b => matcher(a, b)) === -1) {
            this.value.splice(i, 1);
          } else {
            i++;
          }
        }
        // add items that have been selected.
        i = 0;
        while (i < value.length) {
          let a = value[i];
          if (this.value.findIndex(b => matcher(a, b)) === -1) {
            this.value.push(a);
          }
          i++;
        }
        return; // don't notify.
      }
    } else {
      // single-select
      if (count === 0) {
        value = null;
      } else {
        value = value[0];
      }
    }

    if (value !== this.value) {
      this.oldValue = this.value;
      this.value = value;
      this.notify();
    }
  }

  notify() {
    let oldValue = this.oldValue;
    let newValue = this.value;

    this.callSubscribers(newValue, oldValue);
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.disposeHandler();
      this.disposeHandler = null;
    }
  }

  bind() {
    this.domObserver = DOM.createMutationObserver(() => {
      this.synchronizeOptions();
      this.synchronizeValue();
    });
    this.domObserver.observe(this.element, { childList: true, subtree: true });
  }

  unbind() {
    this.domObserver.disconnect();
    this.domObserver = null;

    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(selectArrayContext, this);
      this.arrayObserver = null;
    }
  }
}

const checkedArrayContext = 'CheckedObserver:array';

@subscriberCollection()
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
    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(checkedArrayContext, this);
      this.arrayObserver = null;
    }
    // subscribe to new array.
    if (this.element.type === 'checkbox' && Array.isArray(newValue)) {
      this.arrayObserver = this.observerLocator.getArrayObserver(newValue);
      this.arrayObserver.subscribe(checkedArrayContext, this);
    }
    // assign and sync element.
    this.value = newValue;
    this.synchronizeElement();
    // queue up an initial sync after the bindings have been evaluated.
    if (!this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask(this);
    }
  }

  call(context, splices) {
    // called by task queue and array observer.
    this.synchronizeElement();
  }

  synchronizeElement() {
    let value = this.value,
        element = this.element,
        elementValue = element.hasOwnProperty('model') ? element.model : element.value,
        isRadio = element.type === 'radio',
        matcher = element.matcher || ((a, b) => a === b);

    element.checked =
      isRadio && !!matcher(value, elementValue)
      || !isRadio && value === true
      || !isRadio && Array.isArray(value) && !!value.find(item => !!matcher(item, elementValue));
  }

  synchronizeValue(){
    let value = this.value,
        element = this.element,
        elementValue = element.hasOwnProperty('model') ? element.model : element.value,
        index,
        matcher = element.matcher || ((a, b) => a === b);

    if (element.type === 'checkbox') {
      if (Array.isArray(value)) {
        index = value.findIndex(item => !!matcher(item, elementValue));
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
    this.notify();
  }

  notify() {
    let oldValue = this.oldValue;
    let newValue = this.value;

    this.callSubscribers(newValue, oldValue);
  }

  subscribe(context, callable) {
    if(!this.hasSubscribers()) {
      this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if(this.removeSubscriber(context, callable) && !this.hasSubscribers()){
      this.disposeHandler();
      this.disposeHandler = null;
    }
  }

  unbind() {
    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(checkedArrayContext, this);
      this.arrayObserver = null;
    }
  }
}
