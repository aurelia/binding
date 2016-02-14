import {projectArraySplices} from './array-change-records';
import {ModifyCollectionObserver, CollectionLengthObserver} from './collection-observation';
import {subscriberCollection} from './subscriber-collection';

let pop = Array.prototype.pop;
let push = Array.prototype.push;
let reverse = Array.prototype.reverse;
let shift = Array.prototype.shift;
let sort = Array.prototype.sort;
let splice = Array.prototype.splice;
let unshift = Array.prototype.unshift;

Array.prototype.pop = function() {
  let methodCallResult = pop.apply(this, arguments);
  if (this.__array_observer__ !== undefined) {
    this.__array_observer__.addChangeRecord({
      type: 'delete',
      object: this,
      name: this.length,
      oldValue: methodCallResult
    });
  }
  return methodCallResult;
};

Array.prototype.push = function() {
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

Array.prototype.reverse = function() {
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

Array.prototype.shift = function() {
  let methodCallResult = shift.apply(this, arguments);
  if (this.__array_observer__ !== undefined) {
    this.__array_observer__.addChangeRecord({
      type: 'delete',
      object: this,
      name: 0,
      oldValue: methodCallResult
    });
  }
  return methodCallResult
};

Array.prototype.sort = function() {
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

Array.prototype.splice = function() {
  let methodCallResult = splice.apply(this, arguments);
  if (this.__array_observer__ !== undefined) {
    this.__array_observer__.addChangeRecord({
      type: 'splice',
      object: this,
      index: arguments[0],
      removed: methodCallResult,
      addedCount: arguments.length > 2 ? arguments.length - 2 : 0
    });
  }
  return methodCallResult;
};

Array.prototype.unshift = function() {
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

export function getArrayObserver(taskQueue, array) {
  return ModifyArrayObserver.for(taskQueue, array);
}

class ModifyArrayObserver extends ModifyCollectionObserver {
  constructor(taskQueue, array) {
    super(taskQueue, array);
  }

  static for(taskQueue, array) {
    if (!('__array_observer__' in array)) {
      let observer = ModifyArrayObserver.create(taskQueue, array);
      Object.defineProperty(
        array,
        '__array_observer__',
        { value: observer, enumerable: false, configurable: false });
    }
    return array.__array_observer__;
  }

  static create(taskQueue, array) {
    let observer = new ModifyArrayObserver(taskQueue, array);
    return observer;
  }
}
