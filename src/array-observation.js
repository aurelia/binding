/* eslint-disable no-extend-native */
import {ModifyCollectionObserver} from './collection-observation';
import * as LogManager from 'aurelia-logging';

const arrayProto = Array.prototype;
const pop = arrayProto.pop;
const push = arrayProto.push;
const reverse = arrayProto.reverse;
const shift = arrayProto.shift;
const sort = arrayProto.sort;
const splice = arrayProto.splice;
const unshift = arrayProto.unshift;

if (arrayProto.__au_patched__) {
  LogManager
    .getLogger('array-observation')
    .warn('Detected 2nd attempt of patching array from Aurelia binding.'
      + ' This is probably caused by dependency mismatch between core modules and a 3rd party plugin.'
      + ' Please see https://github.com/aurelia/cli/pull/906 if you are using webpack.'
    );
} else {
  Reflect.defineProperty(arrayProto, '__au_patched__', { value: 1 });
  arrayProto.pop = function() {
    let notEmpty = this.length > 0;
    let methodCallResult = pop.apply(this, arguments);
    if (notEmpty && this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'delete',
        object: this,
        name: this.length,
        oldValue: methodCallResult
      });
    }
    return methodCallResult;
  };

  arrayProto.push = function() {
    let methodCallResult = push.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'splice',
        object: this,
        index: this.length - arguments.length,
        removed: [],
        addedCount: arguments.length
      });
    }
    return methodCallResult;
  };

  arrayProto.reverse = function() {
    let oldArray;
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.flushChangeRecords();
      oldArray = this.slice();
    }
    let methodCallResult = reverse.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.reset(oldArray);
    }
    return methodCallResult;
  };

  arrayProto.shift = function() {
    let notEmpty = this.length > 0;
    let methodCallResult = shift.apply(this, arguments);
    if (notEmpty && this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'delete',
        object: this,
        name: 0,
        oldValue: methodCallResult
      });
    }
    return methodCallResult;
  };

  arrayProto.sort = function() {
    let oldArray;
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.flushChangeRecords();
      oldArray = this.slice();
    }
    let methodCallResult = sort.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.reset(oldArray);
    }
    return methodCallResult;
  };

  arrayProto.splice = function() {
    let methodCallResult = splice.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'splice',
        object: this,
        index: +arguments[0],
        removed: methodCallResult,
        addedCount: arguments.length > 2 ? arguments.length - 2 : 0
      });
    }
    return methodCallResult;
  };

  arrayProto.unshift = function() {
    let methodCallResult = unshift.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'splice',
        object: this,
        index: 0,
        removed: [],
        addedCount: arguments.length
      });
    }
    return methodCallResult;
  };
}

export function getArrayObserver(taskQueue, array) {
  return ModifyArrayObserver.for(taskQueue, array);
}

class ModifyArrayObserver extends ModifyCollectionObserver {
  constructor(taskQueue, array) {
    super(taskQueue, array);
  }

  /**
   * Searches for observer or creates a new one associated with given array instance
   * @param taskQueue
   * @param array instance for which observer is searched
   * @returns ModifyArrayObserver always the same instance for any given array instance
   */
  static for(taskQueue, array) {
    if (!('__array_observer__' in array)) {
      Reflect.defineProperty(array, '__array_observer__', {
        value: ModifyArrayObserver.create(taskQueue, array),
        enumerable: false, configurable: false
      });
    }
    return array.__array_observer__;
  }

  static create(taskQueue, array) {
    return new ModifyArrayObserver(taskQueue, array);
  }
}
