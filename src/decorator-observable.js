export function observable(keyOrTargetOrConfig: any, _key?: string, _descriptor?: PropertyDescriptor) {
  let deco = function(target, key, descriptor) {
    if (!key) {
      key = typeof keyOrTargetOrConfig === 'string' ? keyOrTargetOrConfig : keyOrTargetOrConfig.name;
    }
    // use a convention to compute the inner property name and the callback
    // function name.
    let innerPropertyName = `_${key}`;
    let callbackName = (keyOrTargetOrConfig && keyOrTargetOrConfig.changeHandler) || `${key}Changed`;

    if (descriptor) {
      // babel passes in the property descriptor with a method to get the initial value.

      // set the initial value of the property if it is defined.
      if (typeof descriptor.initializer === 'function') {
        target[innerPropertyName] = descriptor.initializer();
      }
    } else {
      descriptor = {};
      target = target.prototype;
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
  };

  if (_key) {
    return deco(keyOrTargetOrConfig, _key, _descriptor);
  }

  return deco;
}
