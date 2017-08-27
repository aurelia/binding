import * as LogManager from 'aurelia-logging';
import {
  coerces,
  classCoerceMap,
  mapCoerceForClass
} from './coerce';
import { metadata } from 'aurelia-metadata';

type ObservableConfig = { name: string, changeHandler(curr: any, prev: any): any, coerce?: Function | string }
type TargetOrConfig = Function | ObservableConfig

export function observable(targetOrConfig: TargetOrConfig, key: string, descriptor?: PropertyDescriptor) {
  /**
   * 
   * @param {Function | {}} target 
   * @param {string} key
   * @param {PropertyDescriptor} descriptor 
   * @param {ObservableConfig} config 
   */
  function deco(target, key, descriptor, config) { // eslint-disable-line no-shadow
    let userDidDefineCoerce;
    let propType;
    let coerce;

    // Setting up coerce
    userDidDefineCoerce = config && typeof config.coerce !== 'undefined';
    
    if (userDidDefineCoerce) {
      switch (typeof config.coerce) {
      case 'string':
        coerce = coerces[config.coerce]; break;
      case 'function':
        coerce = config.coerce; break;
      }
      if (!coerce) {
        LogManager
          .getLogger('aurelia-observable-decortaor')
          .warn(`Invalid coerce instruction. Should be either one of ${Object.keys(coerces)} or a function.`)
      }
      coerce = coerce || coerces.none;
    } else {
      propType = metadata.getOwn(metadata.propertyType, target, key);
      if (propType) {
        coerce = coerces[classCoerceMap.get(propType)] || coerces.none;
      }
    }

    /**
     * When called with parens, config will be undefined
     * @example
     * @observable() class MyVM {}
     * 
     * class MyVM {
     *   @observable() prop
     * }
     */

    /**
     * When called without parens on a class, key will be undefined
     * @example
     * @observable class MyVM {}
     */
    const isClassDecorator = key === undefined;
    if (isClassDecorator) {
      target = target.prototype;
      key = typeof config === 'string' ? config : config.name;
    }

    // use a convention to compute the inner property name
    let innerPropertyName = `_${key}`;
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
      if (typeof descriptor.initializer === 'function') {
        let temp = descriptor.initializer();
        innerPropertyDescriptor.value = coerce ? coerce(temp) : temp;
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
      let realNewValue = coerce ? coerce(newValue) : newValue;

      if (realNewValue === oldValue) {
        return;
      }

      // Add the inner property on the instance and make it nonenumerable.
      this[innerPropertyName] = realNewValue;
      Reflect.defineProperty(this, innerPropertyName, { enumerable: false });

      if (this[callbackName]) {
        this[callbackName](realNewValue, oldValue, key);
      }
    };

    // make sure Aurelia doesn't use dirty-checking by declaring the property's
    // dependencies. This is the equivalent of "@computedFrom(...)".
    descriptor.get.dependencies = [innerPropertyName];

    if (isClassDecorator) {
      /**
       * No need return as runtime code will look like this
       * 
       * observable(class Vm {})
       */
      Reflect.defineProperty(target, key, descriptor);
    } else {
      /**
       * Runtime code will look like this:
       * 
       * class Vm {
       *   constructor() {
       *     observable(this, 'prop', descriptor); // the descriptor that is return from following line
       *   }
       * }
       */
      return descriptor;
    }
  }

  if (key === undefined) {
    // parens...
    return (t, k, d) => deco(t, k, d, targetOrConfig);
  }
  return deco(targetOrConfig, key, descriptor);
}

/**
 * @param {string} type 
 */
export function registerTypeObservable(type) {
  /**
   * There no attempts to protect user from mis-using the decorators.
   * ex. @observable({}, accidentParam) class SomeClass {}
   * If we have some flag to use in if block, which can be remove at build time, it would be great.
   */
  return observable[type] = function(targetOrConfig, key, descriptor) {
    if (targetOrConfig === void 0) {
      /**
       * MyClass {
       *   @observable.number() num
       * }
       */
      return observable({ coerce: type });
    }
    if (key === void 0) {
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
  }
}

['string', 'number', 'boolean', 'date'].forEach(registerTypeObservable);

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
