import { coerceFunctions, coerceFunctionMap } from './coerce-functions';
import { metadata } from 'aurelia-metadata';
import * as LogManager from 'aurelia-logging';

/**
 * @typedef ObservableConfig
 * @prop {string} name
 * @prop {string} changeHandler
 * @prop {string | {(val: any): any}} coerce
 */

const observableLogger = LogManager.getLogger('aurelia-observable-decorator');

export function observable(targetOrConfig: string | Function | ObservableConfig, key?: string, descriptor?: PropertyDescriptor) {
  /**
   * @param target The class decorated
   * @param key The target class field of the decorator
   * @param descriptor class field descriptor
   * @param config user's config
   */
  function deco(target: Function, key?: string, descriptor?: PropertyDescriptor & { initializer(): any }, config?: ObservableConfig) { // eslint-disable-line no-shadow
    // Used to check if we should pickup the type from metadata
    const userDidDefineCoerce = config !== undefined && config.coerce !== undefined;
    let propType;
    let coerceFunction;

    if (userDidDefineCoerce) {
      switch (typeof config.coerce) {
      case 'string':
        coerceFunction = coerceFunctions[config.coerce]; break;
      case 'function':
        coerceFunction = config.coerce; break;
      default: break;
      }
      if (coerceFunction === undefined) {
        observableLogger.warn(`Invalid coerce instruction. Should be either one of ${Object.keys(coerceFunctions)} or a function.`);
      }
    } else if (_usePropType) {
      propType = metadata.getOwn(metadata.propertyType, target, key);
      if (propType) {
        coerceFunction = coerceFunctions[coerceFunctionMap.get(propType)];
        if (coerceFunction === undefined) {
          observableLogger.warn(`Unable to find coerce function for type ${propType.name}.`);
        }
      }
    }

    /**
     * class decorator?
     * @example
     * @observable('firstName') MyClass {}
     * @observable({ name: 'firstName' }) MyClass {}
     */
    const isClassDecorator = key === undefined;
    if (isClassDecorator) {
      target = target.prototype;
      key = typeof config === 'string' ? config : config.name;
    }

    // use a convention to compute the inner property name
    const innerPropertyName = `_${key}`;
    const innerPropertyDescriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: false,
      writable: true
    };

    // determine callback name based on config or convention.
    const callbackName = (config && config.changeHandler) || `${key}Changed`;

    if (descriptor) {
      // babel passes in the property descriptor with a method to get the initial value.

      // set the initial value of the property if it is defined.
      // also make sure it's coerced
      if (typeof descriptor.initializer === 'function') {
        const initValue = descriptor.initializer();
        innerPropertyDescriptor.value = coerceFunction === undefined ? initValue : coerceFunction(initValue);
      }
    } else {
      // there is no descriptor if the target was a field in TS (although Babel provides one),
      // or if the decorator was applied to a class.
      descriptor = {};
    }
    // make the accessor enumerable by default, as fields are enumerable
    if (!('enumerable' in descriptor)) {
      descriptor.enumerable = true;
    }

    // we're adding a getter and setter which means the property descriptor
    // cannot have a "value" or "writable" attribute
    delete descriptor.value;
    delete descriptor.writable;
    delete descriptor.initializer;

    // Add the inner property on the prototype.
    Reflect.defineProperty(target, innerPropertyName, innerPropertyDescriptor);

    // add the getter and setter to the property descriptor.
    descriptor.get = function() { return this[innerPropertyName]; };
    descriptor.set = function(newValue) {
      let oldValue = this[innerPropertyName];
      let coercedValue = coerceFunction === undefined ? newValue : coerceFunction(newValue);
      if (coercedValue === oldValue) {
        return;
      }

      // Add the inner property on the instance and make it nonenumerable.
      this[innerPropertyName] = coercedValue;
      Reflect.defineProperty(this, innerPropertyName, { enumerable: false });

      if (this[callbackName]) {
        this[callbackName](coercedValue, oldValue, key);
      }
    };

    // make sure Aurelia doesn't use dirty-checking by declaring the property's
    // dependencies. This is the equivalent of "@computedFrom(...)".
    descriptor.get.dependencies = [innerPropertyName];

    if (isClassDecorator) {
      Reflect.defineProperty(target, key, descriptor);
    } else {
      return descriptor;
    }
  }

  /**
   * Decorating with parens
   * @example
   * @observable MyClass {} <----- this breaks, but will go into this condition
   * @observable('firstName') MyClass {}
   * @observable({ name: 'firstName' }) MyClass {}
   * class MyClass {
   *   @observable() prop
   * }
   */
  if (key === undefined) {
    return (t, k, d) => deco(t, k, d, targetOrConfig);
  }
  /**
   * Decorating on class field
   * @example
   * class MyClass {
   *   @observable prop
   * }
   */
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

/**
 * Internal flag to turn on / off auto pickup property type from metadata
 */
let _usePropType = false;

/**
 * Toggle the flag for observable to auto pickup property type from metadata
 * The reason is sometimes we may want to use prop type on bindable, but not observable
 * and vice versa
 */
observable.usePropType = (shouldUsePropType: boolean) => {
  _usePropType = shouldUsePropType;
};

/**
 * Decorator: Creates a new observable decorator that can be used for fluent syntax purpose
 * @param type the type name that will be assign to observable decorator. `createTypedObservable('point') -> observable.point`
 */
export function createTypeObservable(type: string) {
  return observable[type] = function(targetOrConfig: string | Function | ObservableConfig, key?: string, descriptor?: PropertyDescriptor & {initializer():any}) {
    if (targetOrConfig === undefined) {
      /**
       * MyClass {
       *   @observable.number() num
       * }
       *
       * This will breaks so need to check for proper error
       * @observable.number()
       * class MyClass {}
       */
      return observable({ coerce: type });
    }
    if (key === undefined) {
      /**
       * @observable.number('num')
       * class MyClass {}
       *
       * @observable.number({...})
       * class MyClass
       *
       * class MyClass {
       *   @observable.number({...})
       *   num
       * }
       */
      targetOrConfig = typeof targetOrConfig === 'string' ? { name: targetOrConfig } : targetOrConfig;
      targetOrConfig.coerce = type;
      return observable(targetOrConfig);
    }
    /**
     * class MyClass {
     *   @observable.number num
     * }
     */
    return observable({ coerce: type })(targetOrConfig, key, descriptor);
  };
}

['string', 'number', 'boolean', 'date'].forEach(createTypeObservable);
