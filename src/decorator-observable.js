export function observable(targetOrConfig: any, key: string, descriptor?: PropertyDescriptor) {
  function deco(target, key, descriptor, config) { // eslint-disable-line no-shadow
    // class decorator?
    if (key === undefined) {
      target = target.prototype;
      key = typeof config === 'string' ? config : config.name;
    }

    // use a convention to compute the inner property name
    let innerPropertyName = `_${key}`;

    // determine callback name based on config or convention.
    const callbackName = (config && config.changeHandler) || `${key}Changed`;

    if (descriptor) {
      // babel passes in the property descriptor with a method to get the initial value.

      // set the initial value of the property if it is defined.
      if (typeof descriptor.initializer === 'function') {
        target[innerPropertyName] = descriptor.initializer();
      }
    } else {
      descriptor = {};
    }

    // we're adding a getter and setter which means the property descriptor
    // cannot have a "value" or "writable" attribute
    delete descriptor.writable;
    delete descriptor.initializer;

    // add the getter and setter to the property descriptor.
    descriptor.get = function() { return this[innerPropertyName]; };
    descriptor.set = function(newValue) {
      let oldValue = this[innerPropertyName];
      this[innerPropertyName] = newValue;
      if (this[callbackName]) {
        this[callbackName](newValue, oldValue);
      }
    };

    // make sure Aurelia doesn't use dirty-checking by declaring the property's
    // dependencies. This is the equivalent of "@computedFrom(...)".
    descriptor.get.dependencies = [innerPropertyName];

    Reflect.defineProperty(target, key, descriptor);
  }

  if (key === undefined) {
    // parens...
    return (t, k, d) => deco(t, k, d, targetOrConfig);
  }
  return deco(targetOrConfig, key, descriptor);
}

/*
          | typescript       | babel
----------|------------------|-------------------------
property  | config           | config
w/parens  | target, key      | target, key, descriptor
----------|------------------|-------------------------
property  | target, key      | target, key, descriptor
no parens | n/a              | n/a
----------|------------------|-------------------------
class     | config           | config
          | target           | target
*/
