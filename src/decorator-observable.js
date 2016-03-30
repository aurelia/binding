export function observable(targetOrConfig, key, descriptor) {
  let deco = function(target, key2, descriptor2) {
    // use a convention to compute the inner property name and the callback
    // function name.
    let innerPropertyName = `_${key2}`;
    let callbackName = (targetOrConfig && targetOrConfig.changeHandler) || `${key2}Changed`;

    // typescript or babel?
    let babel = descriptor2 !== undefined;

    if (babel) {
      // babel passes in the property descriptor with a method to get the initial value.

      // set the initial value of the property if it is defined.
      if (typeof descriptor2.initializer === 'function') {
        target[innerPropertyName] = descriptor2.initializer();
      }
    } else {
      descriptor2 = {};
    }

    // we're adding a getter and setter which means the property descriptor
    // cannot have a "value" or "writable" attribute
    delete descriptor2.writable;
    delete descriptor2.initializer;

    // add the getter and setter to the property descriptor.
    descriptor2.get = function() { return this[innerPropertyName]; };
    descriptor2.set = function(newValue) {
      let oldValue = this[innerPropertyName];
      this[innerPropertyName] = newValue;
      if (this[callbackName]) {
        this[callbackName](newValue, oldValue);
      }
    };

    // make sure Aurelia doesn't use dirty-checking by declaring the property's
    // dependencies. This is the equivalent of "@computedFrom(...)".
    descriptor2.get.dependencies = [innerPropertyName];

    if (!babel) {
      Object.defineProperty(target, key2, descriptor2);
    }
  };

  if (key) {
    let target = targetOrConfig;
    targetOrConfig = null;
    return deco(target, key, descriptor);
  }

  return deco;
}
