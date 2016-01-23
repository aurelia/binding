import {subscriberCollection} from './subscriber-collection';

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
