import * as LogManager from 'aurelia-logging';
import {PLATFORM,DOM} from 'aurelia-pal';
import {TaskQueue} from 'aurelia-task-queue';
import {metadata} from 'aurelia-metadata';

const map = Object.create(null);

export function camelCase(name) {
  if (name in map) {
    return map[name];
  }
  const result = name.charAt(0).toLowerCase()
    + name.slice(1).replace(/[_.-](\w|$)/g, (_, x) => x.toUpperCase());
  map[name] = result;
  return result;
}

interface OverrideContext {
  parentOverrideContext: OverrideContext;
  bindingContext: any;
}

// view instances implement this interface
interface Scope {
  bindingContext: any;
  overrideContext: OverrideContext;
}

export function createOverrideContext(bindingContext?: any, parentOverrideContext?: OverrideContext): OverrideContext {
  return {
    bindingContext: bindingContext,
    parentOverrideContext: parentOverrideContext || null
  };
}

export function getContextFor(name: string, scope: Scope, ancestor: number): any {
  let oc = scope.overrideContext;

  if (ancestor) {
    // jump up the required number of ancestor contexts (eg $parent.$parent requires two jumps)
    while (ancestor && oc) {
      ancestor--;
      oc = oc.parentOverrideContext;
    }
    if (ancestor || !oc) {
      return undefined;
    }
    return name in oc ? oc : oc.bindingContext;
  }

  // traverse the context and it's ancestors, searching for a context that has the name.
  while (oc && !(name in oc) && !(oc.bindingContext && name in oc.bindingContext)) {
    oc = oc.parentOverrideContext;
  }
  if (oc) {
    // we located a context with the property.  return it.
    return name in oc ? oc : oc.bindingContext;
  }
  // the name wasn't found.  return the root binding context.
  return scope.bindingContext || scope.overrideContext;
}

export function createScopeForTest(bindingContext: any, parentBindingContext?: any): Scope {
  if (parentBindingContext) {
    return {
      bindingContext,
      overrideContext: createOverrideContext(bindingContext, createOverrideContext(parentBindingContext))
    };
  }
  return {
    bindingContext,
    overrideContext: createOverrideContext(bindingContext)
  };
}

export const sourceContext = 'Binding:source';
const slotNames = [];
const versionSlotNames = [];

for (let i = 0; i < 100; i++) {
  slotNames.push(`_observer${i}`);
  versionSlotNames.push(`_observerVersion${i}`);
}

function addObserver(observer) {
  // find the observer.
  let observerSlots = this._observerSlots === undefined ? 0 : this._observerSlots;
  let i = observerSlots;
  while (i-- && this[slotNames[i]] !== observer) {
    // Do nothing
  }

  // if we are not already observing, put the observer in an open slot and subscribe.
  if (i === -1) {
    i = 0;
    while (this[slotNames[i]]) {
      i++;
    }
    this[slotNames[i]] = observer;
    observer.subscribe(sourceContext, this);
    // increment the slot count.
    if (i === observerSlots) {
      this._observerSlots = i + 1;
    }
  }
  // set the "version" when the observer was used.
  if (this._version === undefined) {
    this._version = 0;
  }
  this[versionSlotNames[i]] = this._version;
}

function observeProperty(obj, propertyName) {
  let observer = this.observerLocator.getObserver(obj, propertyName);
  addObserver.call(this, observer);
}

function observeArray(array) {
  let observer = this.observerLocator.getArrayObserver(array);
  addObserver.call(this, observer);
}

function unobserve(all) {
  let i = this._observerSlots;
  while (i--) {
    if (all || this[versionSlotNames[i]] !== this._version) {
      let observer = this[slotNames[i]];
      this[slotNames[i]] = null;
      if (observer) {
        observer.unsubscribe(sourceContext, this);
      }
    }
  }
}

export function connectable() {
  return function(target) {
    target.prototype.observeProperty = observeProperty;
    target.prototype.observeArray = observeArray;
    target.prototype.unobserve = unobserve;
    target.prototype.addObserver = addObserver;
  };
}

const queue = [];              // the connect queue
const queued = {};             // tracks whether a binding with a particular id is in the queue
let nextId = 0;                // next available id that can be assigned to a binding for queue tracking purposes
const minimumImmediate = 100;  // number of bindings we should connect immediately before resorting to queueing
const frameBudget = 15;        // milliseconds allotted to each frame for flushing queue

let isFlushRequested = false;  // whether a flush of the connect queue has been requested
let immediate = 0;             // count of bindings that have been immediately connected

function flush(animationFrameStart) {
  const length = queue.length;
  let i = 0;
  while (i < length) {
    const binding = queue[i];
    queued[binding.__connectQueueId] = false;
    binding.connect(true);
    i++;
    // periodically check whether the frame budget has been hit.
    // this ensures we don't call performance.now a lot and prevents starving the connect queue.
    if (i % 100 === 0 && PLATFORM.performance.now() - animationFrameStart > frameBudget) {
      break;
    }
  }
  queue.splice(0, i);

  if (queue.length) {
    PLATFORM.requestAnimationFrame(flush);
  } else {
    isFlushRequested = false;
    immediate = 0;
  }
}

export function enqueueBindingConnect(binding) {
  if (immediate < minimumImmediate) {
    immediate++;
    binding.connect(false);
  } else {
    // get or assign the binding's id that enables tracking whether it's been queued.
    let id = binding.__connectQueueId;
    if (id === undefined) {
      id = nextId;
      nextId++;
      binding.__connectQueueId = id;
    }
    // enqueue the binding.
    if (!queued[id]) {
      queue.push(binding);
      queued[id] = true;
    }
  }
  if (!isFlushRequested) {
    isFlushRequested = true;
    PLATFORM.requestAnimationFrame(flush);
  }
}

function addSubscriber(context, callable) {
  if (this.hasSubscriber(context, callable)) {
    return false;
  }
  if (!this._context0) {
    this._context0 = context;
    this._callable0 = callable;
    return true;
  }
  if (!this._context1) {
    this._context1 = context;
    this._callable1 = callable;
    return true;
  }
  if (!this._context2) {
    this._context2 = context;
    this._callable2 = callable;
    return true;
  }
  if (!this._contextsRest) {
    this._contextsRest = [context];
    this._callablesRest = [callable];
    return true;
  }
  this._contextsRest.push(context);
  this._callablesRest.push(callable);
  return true;
}

function removeSubscriber(context, callable) {
  if (this._context0 === context && this._callable0 === callable) {
    this._context0 = null;
    this._callable0 = null;
    return true;
  }
  if (this._context1 === context && this._callable1 === callable) {
    this._context1 = null;
    this._callable1 = null;
    return true;
  }
  if (this._context2 === context && this._callable2 === callable) {
    this._context2 = null;
    this._callable2 = null;
    return true;
  }
  const callables = this._callablesRest;
  if (callables === undefined || callables.length === 0) {
    return false;
  }
  const contexts = this._contextsRest;
  let i = 0;
  while (!(callables[i] === callable && contexts[i] === context) && callables.length > i) {
    i++;
  }
  if (i >= callables.length) {
    return false;
  }
  contexts.splice(i, 1);
  callables.splice(i, 1);
  return true;
}

let arrayPool1 = [];
let arrayPool2 = [];
let poolUtilization = [];

function callSubscribers(newValue, oldValue) {
  let context0 = this._context0;
  let callable0 = this._callable0;
  let context1 = this._context1;
  let callable1 = this._callable1;
  let context2 = this._context2;
  let callable2 = this._callable2;
  let length = this._contextsRest ? this._contextsRest.length : 0;
  let contextsRest;
  let callablesRest;
  let poolIndex;
  let i;
  if (length) {
    // grab temp arrays from the pool.
    poolIndex = poolUtilization.length;
    while (poolIndex-- && poolUtilization[poolIndex]) {
      // Do nothing
    }
    if (poolIndex < 0) {
      poolIndex = poolUtilization.length;
      contextsRest = [];
      callablesRest = [];
      poolUtilization.push(true);
      arrayPool1.push(contextsRest);
      arrayPool2.push(callablesRest);
    } else {
      poolUtilization[poolIndex] = true;
      contextsRest = arrayPool1[poolIndex];
      callablesRest = arrayPool2[poolIndex];
    }
    // copy the contents of the "rest" arrays.
    i = length;
    while (i--) {
      contextsRest[i] = this._contextsRest[i];
      callablesRest[i] = this._callablesRest[i];
    }
  }

  if (context0) {
    if (callable0) {
      callable0.call(context0, newValue, oldValue);
    } else {
      context0(newValue, oldValue);
    }
  }
  if (context1) {
    if (callable1) {
      callable1.call(context1, newValue, oldValue);
    } else {
      context1(newValue, oldValue);
    }
  }
  if (context2) {
    if (callable2) {
      callable2.call(context2, newValue, oldValue);
    } else {
      context2(newValue, oldValue);
    }
  }
  if (length) {
    for (i = 0; i < length; i++) {
      let callable = callablesRest[i];
      let context = contextsRest[i];
      if (callable) {
        callable.call(context, newValue, oldValue);
      } else {
        context(newValue, oldValue);
      }
      contextsRest[i] = null;
      callablesRest[i] = null;
    }
    poolUtilization[poolIndex] = false;
  }
}

function hasSubscribers() {
  return !!(
    this._context0
    || this._context1
    || this._context2
    || this._contextsRest && this._contextsRest.length);
}

function hasSubscriber(context, callable) {
  let has = this._context0 === context && this._callable0 === callable
    || this._context1 === context && this._callable1 === callable
    || this._context2 === context && this._callable2 === callable;
  if (has) {
    return true;
  }
  let index;
  let contexts = this._contextsRest;
  if (!contexts || (index = contexts.length) === 0) { // eslint-disable-line no-cond-assign
    return false;
  }
  let callables = this._callablesRest;
  while (index--) {
    if (contexts[index] === context && callables[index] === callable) {
      return true;
    }
  }
  return false;
}

export function subscriberCollection() {
  return function(target) {
    target.prototype.addSubscriber = addSubscriber;
    target.prototype.removeSubscriber = removeSubscriber;
    target.prototype.callSubscribers = callSubscribers;
    target.prototype.hasSubscribers = hasSubscribers;
    target.prototype.hasSubscriber = hasSubscriber;
  };
}

@connectable()
@subscriberCollection()
export class ExpressionObserver {
  constructor(scope, expression, observerLocator, lookupFunctions) {
    this.scope = scope;
    this.expression = expression;
    this.observerLocator = observerLocator;
    this.lookupFunctions = lookupFunctions;
  }

  getValue() {
    return this.expression.evaluate(this.scope, this.lookupFunctions);
  }

  setValue(newValue) {
    this.expression.assign(this.scope, newValue);
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.expression.evaluate(this.scope, this.lookupFunctions);
      this.expression.connect(this, this.scope);
    }
    this.addSubscriber(context, callable);
    if (arguments.length === 1 && context instanceof Function) {
      return {
        dispose: () => {
          this.unsubscribe(context, callable);
        }
      };
    }
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.unobserve(true);
      this.oldValue = undefined;
    }
  }

  call() {
    let newValue = this.expression.evaluate(this.scope, this.lookupFunctions);
    let oldValue = this.oldValue;
    if (newValue !== oldValue) {
      this.oldValue = newValue;
      this.callSubscribers(newValue, oldValue);
    }
    this._version++;
    this.expression.connect(this, this.scope);
    this.unobserve(false);
  }
}

function isIndex(s) {
  return +s === s >>> 0;
}

function toNumber(s) {
  return +s;
}

function newSplice(index, removed, addedCount) {
  return {
    index: index,
    removed: removed,
    addedCount: addedCount
  };
}

const EDIT_LEAVE = 0;
const EDIT_UPDATE = 1;
const EDIT_ADD = 2;
const EDIT_DELETE = 3;

function ArraySplice() {}

ArraySplice.prototype = {
  // Note: This function is *based* on the computation of the Levenshtein
  // "edit" distance. The one change is that "updates" are treated as two
  // edits - not one. With Array splices, an update is really a delete
  // followed by an add. By retaining this, we optimize for "keeping" the
  // maximum array items in the original array. For example:
  //
  //   'xxxx123' -> '123yyyy'
  //
  // With 1-edit updates, the shortest path would be just to update all seven
  // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
  // leaves the substring '123' intact.
  calcEditDistances: function(current, currentStart, currentEnd, old, oldStart, oldEnd) {
    // "Deletion" columns
    let rowCount = oldEnd - oldStart + 1;
    let columnCount = currentEnd - currentStart + 1;
    let distances = new Array(rowCount);
    let north;
    let west;

    // "Addition" rows. Initialize null column.
    for (let i = 0; i < rowCount; ++i) {
      distances[i] = new Array(columnCount);
      distances[i][0] = i;
    }

    // Initialize null row
    for (let j = 0; j < columnCount; ++j) {
      distances[0][j] = j;
    }

    for (let i = 1; i < rowCount; ++i) {
      for (let j = 1; j < columnCount; ++j) {
        if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1])) {
          distances[i][j] = distances[i - 1][j - 1];
        } else {
          north = distances[i - 1][j] + 1;
          west = distances[i][j - 1] + 1;
          distances[i][j] = north < west ? north : west;
        }
      }
    }

    return distances;
  },

  // This starts at the final weight, and walks "backward" by finding
  // the minimum previous weight recursively until the origin of the weight
  // matrix.
  spliceOperationsFromEditDistances: function(distances) {
    let i = distances.length - 1;
    let j = distances[0].length - 1;
    let current = distances[i][j];
    let edits = [];
    while (i > 0 || j > 0) {
      if (i === 0) {
        edits.push(EDIT_ADD);
        j--;
        continue;
      }
      if (j === 0) {
        edits.push(EDIT_DELETE);
        i--;
        continue;
      }
      let northWest = distances[i - 1][j - 1];
      let west = distances[i - 1][j];
      let north = distances[i][j - 1];

      let min;
      if (west < north) {
        min = west < northWest ? west : northWest;
      } else {
        min = north < northWest ? north : northWest;
      }

      if (min === northWest) {
        if (northWest === current) {
          edits.push(EDIT_LEAVE);
        } else {
          edits.push(EDIT_UPDATE);
          current = northWest;
        }
        i--;
        j--;
      } else if (min === west) {
        edits.push(EDIT_DELETE);
        i--;
        current = west;
      } else {
        edits.push(EDIT_ADD);
        j--;
        current = north;
      }
    }

    edits.reverse();
    return edits;
  },

  /**
   * Splice Projection functions:
   *
   * A splice map is a representation of how a previous array of items
   * was transformed into a new array of items. Conceptually it is a list of
   * tuples of
   *
   *   <index, removed, addedCount>
   *
   * which are kept in ascending index order of. The tuple represents that at
   * the |index|, |removed| sequence of items were removed, and counting forward
   * from |index|, |addedCount| items were added.
   */

  /**
   * Lacking individual splice mutation information, the minimal set of
   * splices can be synthesized given the previous state and final state of an
   * array. The basic approach is to calculate the edit distance matrix and
   * choose the shortest path through it.
   *
   * Complexity: O(l * p)
   *   l: The length of the current array
   *   p: The length of the old array
   */
  calcSplices: function(current, currentStart, currentEnd, old, oldStart, oldEnd) {
    let prefixCount = 0;
    let suffixCount = 0;

    let minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
    if (currentStart === 0 && oldStart === 0) {
      prefixCount = this.sharedPrefix(current, old, minLength);
    }

    if (currentEnd === current.length && oldEnd === old.length) {
      suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
    }

    currentStart += prefixCount;
    oldStart += prefixCount;
    currentEnd -= suffixCount;
    oldEnd -= suffixCount;

    if ((currentEnd - currentStart) === 0 && (oldEnd - oldStart) === 0) {
      return [];
    }

    if (currentStart === currentEnd) {
      let splice = newSplice(currentStart, [], 0);
      while (oldStart < oldEnd) {
        splice.removed.push(old[oldStart++]);
      }

      return [ splice ];
    } else if (oldStart === oldEnd) {
      return [ newSplice(currentStart, [], currentEnd - currentStart) ];
    }

    let ops = this.spliceOperationsFromEditDistances(
        this.calcEditDistances(current, currentStart, currentEnd,
                               old, oldStart, oldEnd));

    let splice = undefined;
    let splices = [];
    let index = currentStart;
    let oldIndex = oldStart;
    for (let i = 0; i < ops.length; ++i) {
      switch (ops[i]) {
      case EDIT_LEAVE:
        if (splice) {
          splices.push(splice);
          splice = undefined;
        }

        index++;
        oldIndex++;
        break;
      case EDIT_UPDATE:
        if (!splice) {
          splice = newSplice(index, [], 0);
        }

        splice.addedCount++;
        index++;

        splice.removed.push(old[oldIndex]);
        oldIndex++;
        break;
      case EDIT_ADD:
        if (!splice) {
          splice = newSplice(index, [], 0);
        }

        splice.addedCount++;
        index++;
        break;
      case EDIT_DELETE:
        if (!splice) {
          splice = newSplice(index, [], 0);
        }

        splice.removed.push(old[oldIndex]);
        oldIndex++;
        break;
       // no default
      }
    }

    if (splice) {
      splices.push(splice);
    }
    return splices;
  },

  sharedPrefix: function(current, old, searchLength) {
    for (let i = 0; i < searchLength; ++i) {
      if (!this.equals(current[i], old[i])) {
        return i;
      }
    }

    return searchLength;
  },

  sharedSuffix: function(current, old, searchLength) {
    let index1 = current.length;
    let index2 = old.length;
    let count = 0;
    while (count < searchLength && this.equals(current[--index1], old[--index2])) {
      count++;
    }

    return count;
  },

  calculateSplices: function(current, previous) {
    return this.calcSplices(current, 0, current.length, previous, 0,
                            previous.length);
  },

  equals: function(currentValue, previousValue) {
    return currentValue === previousValue;
  }
};

let arraySplice = new ArraySplice();

export function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
  return arraySplice.calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd);
}

function intersect(start1, end1, start2, end2) {
  // Disjoint
  if (end1 < start2 || end2 < start1) {
    return -1;
  }

  // Adjacent
  if (end1 === start2 || end2 === start1) {
    return 0;
  }

  // Non-zero intersect, span1 first
  if (start1 < start2) {
    if (end1 < end2) {
      return end1 - start2; // Overlap
    }

    return end2 - start2; // Contained
  }

  // Non-zero intersect, span2 first
  if (end2 < end1) {
    return end2 - start1; // Overlap
  }

  return end1 - start1; // Contained
}

export function mergeSplice(splices, index, removed, addedCount) {
  let splice = newSplice(index, removed, addedCount);

  let inserted = false;
  let insertionOffset = 0;

  for (let i = 0; i < splices.length; i++) {
    let current = splices[i];
    current.index += insertionOffset;

    if (inserted) {
      continue;
    }

    let intersectCount = intersect(splice.index,
                                   splice.index + splice.removed.length,
                                   current.index,
                                   current.index + current.addedCount);

    if (intersectCount >= 0) {
      // Merge the two splices

      splices.splice(i, 1);
      i--;

      insertionOffset -= current.addedCount - current.removed.length;

      splice.addedCount += current.addedCount - intersectCount;
      let deleteCount = splice.removed.length +
                        current.removed.length - intersectCount;

      if (!splice.addedCount && !deleteCount) {
        // merged splice is a noop. discard.
        inserted = true;
      } else {
        let currentRemoved = current.removed;

        if (splice.index < current.index) {
          // some prefix of splice.removed is prepended to current.removed.
          let prepend = splice.removed.slice(0, current.index - splice.index);
          Array.prototype.push.apply(prepend, currentRemoved);
          currentRemoved = prepend;
        }

        if (splice.index + splice.removed.length > current.index + current.addedCount) {
          // some suffix of splice.removed is appended to current.removed.
          let append = splice.removed.slice(current.index + current.addedCount - splice.index);
          Array.prototype.push.apply(currentRemoved, append);
        }

        splice.removed = currentRemoved;
        if (current.index < splice.index) {
          splice.index = current.index;
        }
      }
    } else if (splice.index < current.index) {
      // Insert splice here.

      inserted = true;

      splices.splice(i, 0, splice);
      i++;

      let offset = splice.addedCount - splice.removed.length;
      current.index += offset;
      insertionOffset += offset;
    }
  }

  if (!inserted) {
    splices.push(splice);
  }
}

function createInitialSplices(array, changeRecords) {
  let splices = [];

  for (let i = 0; i < changeRecords.length; i++) {
    let record = changeRecords[i];
    switch (record.type) {
    case 'splice':
      mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
      break;
    case 'add':
    case 'update':
    case 'delete':
      if (!isIndex(record.name)) {
        continue;
      }

      let index = toNumber(record.name);
      if (index < 0) {
        continue;
      }

      mergeSplice(splices, index, [record.oldValue], record.type === 'delete' ? 0 : 1);
      break;
    default:
      console.error('Unexpected record type: ' + JSON.stringify(record)); // eslint-disable-line no-console
      break;
    }
  }

  return splices;
}

export function projectArraySplices(array, changeRecords) {
  let splices = [];

  createInitialSplices(array, changeRecords).forEach(function(splice) {
    if (splice.addedCount === 1 && splice.removed.length === 1) {
      if (splice.removed[0] !== array[splice.index]) {
        splices.push(splice);
      }

      return;
    }

    splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
                                         splice.removed, 0, splice.removed.length));
  });

  return splices;
}

function newRecord(type, object, key, oldValue) {
  return {
    type: type,
    object: object,
    key: key,
    oldValue: oldValue
  };
}

export function getChangeRecords(map) {
  let entries = new Array(map.size);
  let keys = map.keys();
  let i = 0;
  let item;

  while (item = keys.next()) { // eslint-disable-line no-cond-assign
    if (item.done) {
      break;
    }

    entries[i] = newRecord('added', map, item.value);
    i++;
  }

  return entries;
}

@subscriberCollection()
export class ModifyCollectionObserver {
  constructor(taskQueue, collection) {
    this.taskQueue = taskQueue;
    this.queued = false;
    this.changeRecords = null;
    this.oldCollection = null;
    this.collection = collection;
    this.lengthPropertyName = collection instanceof Map || collection instanceof Set ? 'size' : 'length';
  }

  subscribe(context, callable) {
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }

  addChangeRecord(changeRecord) {
    if (!this.hasSubscribers() && !this.lengthObserver) {
      return;
    }

    if (changeRecord.type === 'splice') {
      let index = changeRecord.index;
      let arrayLength = changeRecord.object.length;
      if (index > arrayLength) {
        index = arrayLength - changeRecord.addedCount;
      } else if (index < 0) {
        index = arrayLength + changeRecord.removed.length + index - changeRecord.addedCount;
      }
      if (index < 0) {
        index = 0;
      }
      changeRecord.index = index;
    }

    if (this.changeRecords === null) {
      this.changeRecords = [changeRecord];
    } else {
      this.changeRecords.push(changeRecord);
    }

    if (!this.queued) {
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  flushChangeRecords() {
    if ((this.changeRecords && this.changeRecords.length) || this.oldCollection) {
      this.call();
    }
  }

  reset(oldCollection) {
    this.oldCollection = oldCollection;

    if (this.hasSubscribers() && !this.queued) {
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  getLengthObserver() {
    return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection));
  }

  call() {
    let changeRecords = this.changeRecords;
    let oldCollection = this.oldCollection;
    let records;

    this.queued = false;
    this.changeRecords = [];
    this.oldCollection = null;

    if (this.hasSubscribers()) {
      if (oldCollection) {
        // TODO (martingust) we might want to refactor this to a common, independent of collection type, way of getting the records
        if (this.collection instanceof Map || this.collection instanceof Set) {
          records = getChangeRecords(oldCollection);
        } else {
          //we might need to combine this with existing change records....
          records = calcSplices(this.collection, 0, this.collection.length, oldCollection, 0, oldCollection.length);
        }
      } else {
        if (this.collection instanceof Map || this.collection instanceof Set) {
          records = changeRecords;
        } else {
          records = projectArraySplices(this.collection, changeRecords);
        }
      }

      this.callSubscribers(records);
    }

    if (this.lengthObserver) {
      this.lengthObserver.call(this.collection[this.lengthPropertyName]);
    }
  }
}

@subscriberCollection()
export class CollectionLengthObserver {
  constructor(collection) {
    this.collection = collection;
    this.lengthPropertyName = collection instanceof Map || collection instanceof Set ? 'size' : 'length';
    this.currentValue = collection[this.lengthPropertyName];
  }

  getValue() {
    return this.collection[this.lengthPropertyName];
  }

  setValue(newValue) {
    this.collection[this.lengthPropertyName] = newValue;
  }

  subscribe(context, callable) {
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }

  call(newValue) {
    let oldValue = this.currentValue;
    this.callSubscribers(newValue, oldValue);
    this.currentValue = newValue;
  }
}

/* eslint-disable no-extend-native */
let pop = Array.prototype.pop;
let push = Array.prototype.push;
let reverse = Array.prototype.reverse;
let shift = Array.prototype.shift;
let sort = Array.prototype.sort;
let splice = Array.prototype.splice;
let unshift = Array.prototype.unshift;

Array.prototype.pop = function() {
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
      index: +arguments[0],
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

export class Expression {
  constructor() {
    this.isChain = false;
    this.isAssignable = false;
  }

  evaluate(scope: Scope, lookupFunctions: any, args?: any): any {
    throw new Error(`Binding expression "${this}" cannot be evaluated.`);
  }

  assign(scope: Scope, value: any, lookupFunctions: any): any {
    throw new Error(`Binding expression "${this}" cannot be assigned to.`);
  }

  toString() {
    return typeof FEATURE_NO_UNPARSER === 'undefined' ?
      Unparser.unparse(this) :
      super.toString();
  }
}

export class Chain extends Expression {
  constructor(expressions) {
    super();

    this.expressions = expressions;
    this.isChain = true;
  }

  evaluate(scope, lookupFunctions) {
    let result;
    let expressions = this.expressions;
    let last;

    for (let i = 0, length = expressions.length; i < length; ++i) {
      last = expressions[i].evaluate(scope, lookupFunctions);

      if (last !== null) {
        result = last;
      }
    }

    return result;
  }

  accept(visitor) {
    return visitor.visitChain(this);
  }
}

export class BindingBehavior extends Expression {
  constructor(expression, name, args) {
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, lookupFunctions) {
    return this.expression.evaluate(scope, lookupFunctions);
  }

  assign(scope, value, lookupFunctions) {
    return this.expression.assign(scope, value, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitBindingBehavior(this);
  }

  connect(binding, scope) {
    this.expression.connect(binding, scope);
  }

  bind(binding, scope, lookupFunctions) {
    if (this.expression.expression && this.expression.bind) {
      this.expression.bind(binding, scope, lookupFunctions);
    }
    let behavior = lookupFunctions.bindingBehaviors(this.name);
    if (!behavior) {
      throw new Error(`No BindingBehavior named "${this.name}" was found!`);
    }
    let behaviorKey = `behavior-${this.name}`;
    if (binding[behaviorKey]) {
      throw new Error(`A binding behavior named "${this.name}" has already been applied to "${this.expression}"`);
    }
    binding[behaviorKey] = behavior;
    behavior.bind.apply(behavior, [binding, scope].concat(evalList(scope, this.args, binding.lookupFunctions)));
  }

  unbind(binding, scope) {
    let behaviorKey = `behavior-${this.name}`;
    binding[behaviorKey].unbind(binding, scope);
    binding[behaviorKey] = null;
    if (this.expression.expression && this.expression.unbind) {
      this.expression.unbind(binding, scope);
    }
  }
}

export class ValueConverter extends Expression {
  constructor(expression, name, args, allArgs) {
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
    this.allArgs = allArgs;
  }

  evaluate(scope, lookupFunctions) {
    let converter = lookupFunctions.valueConverters(this.name);
    if (!converter) {
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if ('toView' in converter) {
      return converter.toView.apply(converter, evalList(scope, this.allArgs, lookupFunctions));
    }

    return this.allArgs[0].evaluate(scope, lookupFunctions);
  }

  assign(scope, value, lookupFunctions) {
    let converter = lookupFunctions.valueConverters(this.name);
    if (!converter) {
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if ('fromView' in converter) {
      value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, lookupFunctions)));
    }

    return this.allArgs[0].assign(scope, value, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitValueConverter(this);
  }

  connect(binding, scope) {
    let expressions = this.allArgs;
    let i = expressions.length;
    while (i--) {
      expressions[i].connect(binding, scope);
    }
  }
}

export class Assign extends Expression {
  constructor(target, value) {
    super();

    this.target = target;
    this.value = value;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    return this.target.assign(scope, this.value.evaluate(scope, lookupFunctions));
  }

  accept(vistor) {
    vistor.visitAssign(this);
  }

  connect(binding, scope) {
  }

  assign(scope, value) {
    this.value.assign(scope, value);
    this.target.assign(scope, value);
  }
}

export class Conditional extends Expression {
  constructor(condition, yes, no) {
    super();

    this.condition = condition;
    this.yes = yes;
    this.no = no;
  }

  evaluate(scope, lookupFunctions) {
    return (!!this.condition.evaluate(scope, lookupFunctions)) ? this.yes.evaluate(scope, lookupFunctions) : this.no.evaluate(scope, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitConditional(this);
  }

  connect(binding, scope) {
    this.condition.connect(binding, scope);
    if (this.condition.evaluate(scope)) {
      this.yes.connect(binding, scope);
    } else {
      this.no.connect(binding, scope);
    }
  }
}

export class AccessThis extends Expression {
  constructor(ancestor) {
    super();
    this.ancestor = ancestor;
  }

  evaluate(scope, lookupFunctions) {
    let oc = scope.overrideContext;
    let i = this.ancestor;
    while (i-- && oc) {
      oc = oc.parentOverrideContext;
    }
    return i < 1 && oc ? oc.bindingContext : undefined;
  }

  accept(visitor) {
    return visitor.visitAccessThis(this);
  }

  connect(binding, scope) {
  }
}

export class AccessScope extends Expression {
  constructor(name, ancestor) {
    super();

    this.name = name;
    this.ancestor = ancestor;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let context = getContextFor(this.name, scope, this.ancestor);
    return context[this.name];
  }

  assign(scope, value) {
    let context = getContextFor(this.name, scope, this.ancestor);
    return context ? (context[this.name] = value) : undefined;
  }

  accept(visitor) {
    return visitor.visitAccessScope(this);
  }

  connect(binding, scope) {
    let context = getContextFor(this.name, scope, this.ancestor);
    binding.observeProperty(context, this.name);
  }
}

export class AccessMember extends Expression {
  constructor(object, name) {
    super();

    this.object = object;
    this.name = name;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    return instance === null || instance === undefined ? instance : instance[this.name];
  }

  assign(scope, value) {
    let instance = this.object.evaluate(scope);

    if (instance === null || instance === undefined) {
      instance = {};
      this.object.assign(scope, instance);
    }

    instance[this.name] = value;
    return value;
  }

  accept(visitor) {
    return visitor.visitAccessMember(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (obj) {
      binding.observeProperty(obj, this.name);
    }
  }
}

export class AccessKeyed extends Expression {
  constructor(object, key) {
    super();

    this.object = object;
    this.key = key;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    let lookup = this.key.evaluate(scope, lookupFunctions);
    return getKeyed(instance, lookup);
  }

  assign(scope, value) {
    let instance = this.object.evaluate(scope);
    let lookup = this.key.evaluate(scope);
    return setKeyed(instance, lookup, value);
  }

  accept(visitor) {
    return visitor.visitAccessKeyed(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (obj instanceof Object) {
      this.key.connect(binding, scope);
      let key = this.key.evaluate(scope);
      // observe the property represented by the key as long as it's not an array
      // being accessed by an integer key which would require dirty-checking.
      if (key !== null && key !== undefined
        && !(Array.isArray(obj) && typeof(key) === 'number')) {
        binding.observeProperty(obj, key);
      }
    }
  }
}

export class CallScope extends Expression {
  constructor(name, args, ancestor) {
    super();

    this.name = name;
    this.args = args;
    this.ancestor = ancestor;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let args = evalList(scope, this.args, lookupFunctions);
    let context = getContextFor(this.name, scope, this.ancestor);
    let func = getFunction(context, this.name, mustEvaluate);
    if (func) {
      return func.apply(context, args);
    }
    return undefined;
  }

  accept(visitor) {
    return visitor.visitCallScope(this);
  }

  connect(binding, scope) {
    let args = this.args;
    let i = args.length;
    while (i--) {
      args[i].connect(binding, scope);
    }
    // todo: consider adding `binding.observeProperty(scope, this.name);`
  }
}

export class CallMember extends Expression {
  constructor(object, name, args) {
    super();

    this.object = object;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    let args = evalList(scope, this.args, lookupFunctions);
    let func = getFunction(instance, this.name, mustEvaluate);
    if (func) {
      return func.apply(instance, args);
    }
    return undefined;
  }

  accept(visitor) {
    return visitor.visitCallMember(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (getFunction(obj, this.name, false)) {
      let args = this.args;
      let i = args.length;
      while (i--) {
        args[i].connect(binding, scope);
      }
    }
  }
}

export class CallFunction extends Expression {
  constructor(func, args) {
    super();

    this.func = func;
    this.args = args;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let func = this.func.evaluate(scope, lookupFunctions);
    if (typeof func === 'function') {
      return func.apply(null, evalList(scope, this.args, lookupFunctions));
    }
    if (!mustEvaluate && (func === null || func === undefined)) {
      return undefined;
    }
    throw new Error(`${this.func} is not a function`);
  }

  accept(visitor) {
    return visitor.visitCallFunction(this);
  }

  connect(binding, scope) {
    this.func.connect(binding, scope);
    let func = this.func.evaluate(scope);
    if (typeof func === 'function') {
      let args = this.args;
      let i = args.length;
      while (i--) {
        args[i].connect(binding, scope);
      }
    }
  }
}

export class Binary extends Expression {
  constructor(operation, left, right) {
    super();

    this.operation = operation;
    this.left = left;
    this.right = right;
  }

  evaluate(scope, lookupFunctions) {
    let left = this.left.evaluate(scope, lookupFunctions);

    switch (this.operation) {
    case '&&': return left && this.right.evaluate(scope, lookupFunctions);
    case '||': return left || this.right.evaluate(scope, lookupFunctions);
    // no default
    }

    let right = this.right.evaluate(scope, lookupFunctions);

    switch (this.operation) {
    case '==' : return left == right; // eslint-disable-line eqeqeq
    case '===': return left === right;
    case '!=' : return left != right; // eslint-disable-line eqeqeq
    case '!==': return left !== right;
    // no default
    }

    // Null check for the operations.
    if (left === null || right === null || left === undefined || right === undefined) {
      switch (this.operation) {
      case '+':
        if (left !== null && left !== undefined) return left;
        if (right !== null && right !== undefined) return right;
        return 0;
      case '-':
        if (left !== null && left !== undefined) return left;
        if (right !== null && right !== undefined) return 0 - right;
        return 0;
      // no default
      }

      return null;
    }

    switch (this.operation) {
    case '+'  : return autoConvertAdd(left, right);
    case '-'  : return left - right;
    case '*'  : return left * right;
    case '/'  : return left / right;
    case '%'  : return left % right;
    case '<'  : return left < right;
    case '>'  : return left > right;
    case '<=' : return left <= right;
    case '>=' : return left >= right;
    case '^'  : return left ^ right;
    // no default
    }

    throw new Error(`Internal error [${this.operation}] not handled`);
  }

  accept(visitor) {
    return visitor.visitBinary(this);
  }

  connect(binding, scope) {
    this.left.connect(binding, scope);
    let left = this.left.evaluate(scope);
    if (this.operation === '&&' && !left || this.operation === '||' && left) {
      return;
    }
    this.right.connect(binding, scope);
  }
}

export class PrefixNot extends Expression {
  constructor(operation, expression) {
    super();

    this.operation = operation;
    this.expression = expression;
  }

  evaluate(scope, lookupFunctions) {
    return !this.expression.evaluate(scope, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitPrefix(this);
  }

  connect(binding, scope) {
    this.expression.connect(binding, scope);
  }
}

export class LiteralPrimitive extends Expression {
  constructor(value) {
    super();

    this.value = value;
  }

  evaluate(scope, lookupFunctions) {
    return this.value;
  }

  accept(visitor) {
    return visitor.visitLiteralPrimitive(this);
  }

  connect(binding, scope) {
  }
}

export class LiteralString extends Expression {
  constructor(value) {
    super();

    this.value = value;
  }

  evaluate(scope, lookupFunctions) {
    return this.value;
  }

  accept(visitor) {
    return visitor.visitLiteralString(this);
  }

  connect(binding, scope) {
  }
}

export class LiteralArray extends Expression {
  constructor(elements) {
    super();

    this.elements = elements;
  }

  evaluate(scope, lookupFunctions) {
    let elements = this.elements;
    let result = [];

    for (let i = 0, length = elements.length; i < length; ++i) {
      result[i] = elements[i].evaluate(scope, lookupFunctions);
    }

    return result;
  }

  accept(visitor) {
    return visitor.visitLiteralArray(this);
  }

  connect(binding, scope) {
    let length = this.elements.length;
    for (let i = 0; i < length; i++) {
      this.elements[i].connect(binding, scope);
    }
  }
}

export class LiteralObject extends Expression {
  constructor(keys, values) {
    super();

    this.keys = keys;
    this.values = values;
  }

  evaluate(scope, lookupFunctions) {
    let instance = {};
    let keys = this.keys;
    let values = this.values;

    for (let i = 0, length = keys.length; i < length; ++i) {
      instance[keys[i]] = values[i].evaluate(scope, lookupFunctions);
    }

    return instance;
  }

  accept(visitor) {
    return visitor.visitLiteralObject(this);
  }

  connect(binding, scope) {
    let length = this.keys.length;
    for (let i = 0; i < length; i++) {
      this.values[i].connect(binding, scope);
    }
  }
}

/// Evaluate the [list] in context of the [scope].
function evalList(scope, list, lookupFunctions) {
  const length = list.length;
  const result = [];
  for (let i = 0; i < length; i++) {
    result[i] = list[i].evaluate(scope, lookupFunctions);
  }
  return result;
}

/// Add the two arguments with automatic type conversion.
function autoConvertAdd(a, b) {
  if (a !== null && b !== null) {
    // TODO(deboer): Support others.
    if (typeof a === 'string' && typeof b !== 'string') {
      return a + b.toString();
    }

    if (typeof a !== 'string' && typeof b === 'string') {
      return a.toString() + b;
    }

    return a + b;
  }

  if (a !== null) {
    return a;
  }

  if (b !== null) {
    return b;
  }

  return 0;
}

function getFunction(obj, name, mustExist) {
  let func = obj === null || obj === undefined ? null : obj[name];
  if (typeof func === 'function') {
    return func;
  }
  if (!mustExist && (func === null || func === undefined)) {
    return null;
  }
  throw new Error(`${name} is not a function`);
}

function getKeyed(obj, key) {
  if (Array.isArray(obj)) {
    return obj[parseInt(key, 10)];
  } else if (obj) {
    return obj[key];
  } else if (obj === null || obj === undefined) {
    return undefined;
  }

  return obj[key];
}

function setKeyed(obj, key, value) {
  if (Array.isArray(obj)) {
    let index = parseInt(key, 10);

    if (obj.length <= index) {
      obj.length = index + 1;
    }

    obj[index] = value;
  } else {
    obj[key] = value;
  }

  return value;
}

export let Unparser = null;

if (typeof FEATURE_NO_UNPARSER === 'undefined') {
  Unparser = class {
    constructor(buffer) {
      this.buffer = buffer;
    }

    static unparse(expression) {
      let buffer = [];
      let visitor = new Unparser(buffer);

      expression.accept(visitor);

      return buffer.join('');
    }

    write(text) {
      this.buffer.push(text);
    }

    writeArgs(args) {
      this.write('(');

      for (let i = 0, length = args.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        args[i].accept(this);
      }

      this.write(')');
    }

    visitChain(chain) {
      let expressions = chain.expressions;

      for (let i = 0, length = expression.length; i < length; ++i) {
        if (i !== 0) {
          this.write(';');
        }

        expressions[i].accept(this);
      }
    }

    visitBindingBehavior(behavior) {
      let args = behavior.args;

      behavior.expression.accept(this);
      this.write(`&${behavior.name}`);

      for (let i = 0, length = args.length; i < length; ++i) {
        this.write(':');
        args[i].accept(this);
      }
    }

    visitValueConverter(converter) {
      let args = converter.args;

      converter.expression.accept(this);
      this.write(`|${converter.name}`);

      for (let i = 0, length = args.length; i < length; ++i) {
        this.write(':');
        args[i].accept(this);
      }
    }

    visitAssign(assign) {
      assign.target.accept(this);
      this.write('=');
      assign.value.accept(this);
    }

    visitConditional(conditional) {
      conditional.condition.accept(this);
      this.write('?');
      conditional.yes.accept(this);
      this.write(':');
      conditional.no.accept(this);
    }

    visitAccessThis(access) {
      if (access.ancestor === 0) {
        this.write('$this');
        return;
      }
      this.write('$parent');
      let i = access.ancestor - 1;
      while (i--) {
        this.write('.$parent');
      }
    }

    visitAccessScope(access) {
      let i = access.ancestor;
      while (i--) {
        this.write('$parent.');
      }
      this.write(access.name);
    }

    visitAccessMember(access) {
      access.object.accept(this);
      this.write(`.${access.name}`);
    }

    visitAccessKeyed(access) {
      access.object.accept(this);
      this.write('[');
      access.key.accept(this);
      this.write(']');
    }

    visitCallScope(call) {
      let i = call.ancestor;
      while (i--) {
        this.write('$parent.');
      }
      this.write(call.name);
      this.writeArgs(call.args);
    }

    visitCallFunction(call) {
      call.func.accept(this);
      this.writeArgs(call.args);
    }

    visitCallMember(call) {
      call.object.accept(this);
      this.write(`.${call.name}`);
      this.writeArgs(call.args);
    }

    visitPrefix(prefix) {
      this.write(`(${prefix.operation}`);
      prefix.expression.accept(this);
      this.write(')');
    }

    visitBinary(binary) {
      binary.left.accept(this);
      this.write(binary.operation);
      binary.right.accept(this);
    }

    visitLiteralPrimitive(literal) {
      this.write(`${literal.value}`);
    }

    visitLiteralArray(literal) {
      let elements = literal.elements;

      this.write('[');

      for (let i = 0, length = elements.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        elements[i].accept(this);
      }

      this.write(']');
    }

    visitLiteralObject(literal) {
      let keys = literal.keys;
      let values = literal.values;

      this.write('{');

      for (let i = 0, length = keys.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        this.write(`'${keys[i]}':`);
        values[i].accept(this);
      }

      this.write('}');
    }

    visitLiteralString(literal) {
      let escaped = literal.value.replace(/'/g, "\'");
      this.write(`'${escaped}'`);
    }
  };
}

export class ExpressionCloner {
  cloneExpressionArray(array) {
    let clonedArray = [];
    let i = array.length;
    while (i--) {
      clonedArray[i] = array[i].accept(this);
    }
    return clonedArray;
  }

  visitChain(chain) {
    return new Chain(this.cloneExpressionArray(chain.expressions));
  }

  visitBindingBehavior(behavior) {
    return new BindingBehavior(
      behavior.expression.accept(this),
      behavior.name,
      this.cloneExpressionArray(behavior.args));
  }

  visitValueConverter(converter) {
    return new ValueConverter(
      converter.expression.accept(this),
      converter.name,
      this.cloneExpressionArray(converter.args));
  }

  visitAssign(assign) {
    return new Assign(assign.target.accept(this), assign.value.accept(this));
  }

  visitConditional(conditional) {
    return new Conditional(
      conditional.condition.accept(this),
      conditional.yes.accept(this),
      conditional.no.accept(this));
  }

  visitAccessThis(access) {
    return new AccessThis(access.ancestor);
  }

  visitAccessScope(access) {
    return new AccessScope(access.name, access.ancestor);
  }

  visitAccessMember(access) {
    return new AccessMember(access.object.accept(this), access.name);
  }

  visitAccessKeyed(access) {
    return new AccessKeyed(access.object.accept(this), access.key.accept(this));
  }

  visitCallScope(call) {
    return new CallScope(call.name, this.cloneExpressionArray(call.args), call.ancestor);
  }

  visitCallFunction(call) {
    return new CallFunction(call.func.accept(this), this.cloneExpressionArray(call.args));
  }

  visitCallMember(call) {
    return new CallMember(call.object.accept(this), call.name, this.cloneExpressionArray(call.args));
  }

  visitPrefix(prefix) {
    return new PrefixNot(prefix.operation, prefix.expression.accept(this));
  }

  visitBinary(binary) {
    return new Binary(binary.operation, binary.left.accept(this), binary.right.accept(this));
  }

  visitLiteralPrimitive(literal) {
    return new LiteralPrimitive(literal);
  }

  visitLiteralArray(literal) {
    return new LiteralArray(this.cloneExpressionArray(literal.elements));
  }

  visitLiteralObject(literal) {
    return new LiteralObject( literal.keys, this.cloneExpressionArray(literal.values));
  }

  visitLiteralString(literal) {
    return new LiteralString(literal.value);
  }
}

export function cloneExpression(expression) {
  let visitor = new ExpressionCloner();
  return expression.accept(visitor);
}

export const bindingMode = {
  oneTime: 0,
  oneWay: 1,
  twoWay: 2,
  toView: 1,
  fromView: 3
};

export class Token {
  constructor(index, text) {
    this.index = index;
    this.text = text;
  }

  withOp(op) {
    this.opKey = op;
    return this;
  }

  withGetterSetter(key) {
    this.key = key;
    return this;
  }

  withValue(value) {
    this.value = value;
    return this;
  }

  toString() {
    return `Token(${this.text})`;
  }
}

export class Lexer {
  lex(text) {
    let scanner = new Scanner(text);
    let tokens = [];
    let token = scanner.scanToken();

    while (token) {
      tokens.push(token);
      token = scanner.scanToken();
    }

    return tokens;
  }
}

export class Scanner {
  constructor(input) {
    this.input = input;
    this.length = input.length;
    this.peek = 0;
    this.index = -1;

    this.advance();
  }

  scanToken() {
    // Skip whitespace.
    while (this.peek <= $SPACE) {
      if (++this.index >= this.length) {
        this.peek = $EOF;
        return null;
      }

      this.peek = this.input.charCodeAt(this.index);
    }

    // Handle identifiers and numbers.
    if (isIdentifierStart(this.peek)) {
      return this.scanIdentifier();
    }

    if (isDigit(this.peek)) {
      return this.scanNumber(this.index);
    }

    let start = this.index;

    switch (this.peek) {
    case $PERIOD:
      this.advance();
      return isDigit(this.peek) ? this.scanNumber(start) : new Token(start, '.');
    case $LPAREN:
    case $RPAREN:
    case $LBRACE:
    case $RBRACE:
    case $LBRACKET:
    case $RBRACKET:
    case $COMMA:
    case $COLON:
    case $SEMICOLON:
      return this.scanCharacter(start, String.fromCharCode(this.peek));
    case $SQ:
    case $DQ:
      return this.scanString();
    case $PLUS:
    case $MINUS:
    case $STAR:
    case $SLASH:
    case $PERCENT:
    case $CARET:
    case $QUESTION:
      return this.scanOperator(start, String.fromCharCode(this.peek));
    case $LT:
    case $GT:
    case $BANG:
    case $EQ:
      return this.scanComplexOperator(start, $EQ, String.fromCharCode(this.peek), '=');
    case $AMPERSAND:
      return this.scanComplexOperator(start, $AMPERSAND, '&', '&');
    case $BAR:
      return this.scanComplexOperator(start, $BAR, '|', '|');
    case $NBSP:
      while (isWhitespace(this.peek)) {
        this.advance();
      }

      return this.scanToken();
      // no default
    }

    let character = String.fromCharCode(this.peek);
    this.error(`Unexpected character [${character}]`);
    return null;
  }

  scanCharacter(start, text) {
    assert(this.peek === text.charCodeAt(0));
    this.advance();
    return new Token(start, text);
  }

  scanOperator(start, text) {
    assert(this.peek === text.charCodeAt(0));
    assert(OPERATORS.indexOf(text) !== -1);
    this.advance();
    return new Token(start, text).withOp(text);
  }

  scanComplexOperator(start, code, one, two) {
    assert(this.peek === one.charCodeAt(0));
    this.advance();

    let text = one;

    if (this.peek === code) {
      this.advance();
      text += two;
    }

    if (this.peek === code) {
      this.advance();
      text += two;
    }

    assert(OPERATORS.indexOf(text) !== -1);

    return new Token(start, text).withOp(text);
  }

  scanIdentifier() {
    assert(isIdentifierStart(this.peek));
    let start = this.index;

    this.advance();

    while (isIdentifierPart(this.peek)) {
      this.advance();
    }

    let text = this.input.substring(start, this.index);
    let result = new Token(start, text);

    // TODO(kasperl): Deal with null, undefined, true, and false in
    // a cleaner and faster way.
    if (OPERATORS.indexOf(text) !== -1) {
      result.withOp(text);
    } else {
      result.withGetterSetter(text);
    }

    return result;
  }

  scanNumber(start) {
    assert(isDigit(this.peek));
    let simple = (this.index === start);
    this.advance();  // Skip initial digit.

    while (true) { // eslint-disable-line no-constant-condition
      if (!isDigit(this.peek)) {
        if (this.peek === $PERIOD) {
          simple = false;
        } else if (isExponentStart(this.peek)) {
          this.advance();

          if (isExponentSign(this.peek)) {
            this.advance();
          }

          if (!isDigit(this.peek)) {
            this.error('Invalid exponent', -1);
          }

          simple = false;
        } else {
          break;
        }
      }

      this.advance();
    }

    let text = this.input.substring(start, this.index);
    let value = simple ? parseInt(text, 10) : parseFloat(text);
    return new Token(start, text).withValue(value);
  }

  scanString() {
    assert(this.peek === $SQ || this.peek === $DQ);

    let start = this.index;
    let quote = this.peek;

    this.advance();  // Skip initial quote.

    let buffer;
    let marker = this.index;

    while (this.peek !== quote) {
      if (this.peek === $BACKSLASH) {
        if (!buffer) {
          buffer = [];
        }

        buffer.push(this.input.substring(marker, this.index));
        this.advance();

        let unescaped;

        if (this.peek === $u) {
          // TODO(kasperl): Check bounds? Make sure we have test
          // coverage for this.
          let hex = this.input.substring(this.index + 1, this.index + 5);

          if (!/[A-Z0-9]{4}/.test(hex)) {
            this.error(`Invalid unicode escape [\\u${hex}]`);
          }

          unescaped = parseInt(hex, 16);

          for (let i = 0; i < 5; ++i) {
            this.advance();
          }
        } else {
          unescaped = unescape(this.peek);
          this.advance();
        }

        buffer.push(String.fromCharCode(unescaped));
        marker = this.index;
      } else if (this.peek === $EOF) {
        this.error('Unterminated quote');
      } else {
        this.advance();
      }
    }

    let last = this.input.substring(marker, this.index);
    this.advance();  // Skip terminating quote.
    let text = this.input.substring(start, this.index);

    // Compute the unescaped string value.
    let unescaped = last;

    if (buffer !== null && buffer !== undefined) {
      buffer.push(last);
      unescaped = buffer.join('');
    }

    return new Token(start, text).withValue(unescaped);
  }

  advance() {
    if (++this.index >= this.length) {
      this.peek = $EOF;
    } else {
      this.peek = this.input.charCodeAt(this.index);
    }
  }

  error(message, offset = 0) {
    // TODO(kasperl): Try to get rid of the offset. It is only used to match
    // the error expectations in the lexer tests for numbers with exponents.
    let position = this.index + offset;
    throw new Error(`Lexer Error: ${message} at column ${position} in expression [${this.input}]`);
  }
}

const OPERATORS = [
  'undefined',
  'null',
  'true',
  'false',
  '+',
  '-',
  '*',
  '/',
  '%',
  '^',
  '=',
  '==',
  '===',
  '!=',
  '!==',
  '<',
  '>',
  '<=',
  '>=',
  '&&',
  '||',
  '&',
  '|',
  '!',
  '?'
];

const $EOF = 0;
const $TAB = 9;
const $LF = 10;
const $VTAB = 11;
const $FF = 12;
const $CR = 13;
const $SPACE = 32;
const $BANG = 33;
const $DQ = 34;
const $$ = 36;
const $PERCENT = 37;
const $AMPERSAND = 38;
const $SQ = 39;
const $LPAREN = 40;
const $RPAREN = 41;
const $STAR = 42;
const $PLUS = 43;
const $COMMA = 44;
const $MINUS = 45;
const $PERIOD = 46;
const $SLASH = 47;
const $COLON = 58;
const $SEMICOLON = 59;
const $LT = 60;
const $EQ = 61;
const $GT = 62;
const $QUESTION = 63;

const $0 = 48;
const $9 = 57;

const $A = 65;
const $E = 69;
const $Z = 90;

const $LBRACKET = 91;
const $BACKSLASH = 92;
const $RBRACKET = 93;
const $CARET = 94;
const $_ = 95;

const $a = 97;
const $e = 101;
const $f = 102;
const $n = 110;
const $r = 114;
const $t = 116;
const $u = 117;
const $v = 118;
const $z = 122;

const $LBRACE = 123;
const $BAR = 124;
const $RBRACE = 125;
const $NBSP = 160;

function isWhitespace(code) {
  return (code >= $TAB && code <= $SPACE) || (code === $NBSP);
}

function isIdentifierStart(code) {
  return ($a <= code && code <= $z)
      || ($A <= code && code <= $Z)
      || (code === $_)
      || (code === $$);
}

function isIdentifierPart(code) {
  return ($a <= code && code <= $z)
      || ($A <= code && code <= $Z)
      || ($0 <= code && code <= $9)
      || (code === $_)
      || (code === $$);
}

function isDigit(code) {
  return ($0 <= code && code <= $9);
}

function isExponentStart(code) {
  return (code === $e || code === $E);
}

function isExponentSign(code) {
  return (code === $MINUS || code === $PLUS);
}

function unescape(code) {
  switch (code) {
  case $n: return $LF;
  case $f: return $FF;
  case $r: return $CR;
  case $t: return $TAB;
  case $v: return $VTAB;
  default: return code;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw message || 'Assertion failed';
  }
}

let EOF = new Token(-1, null);

export class Parser {
  constructor() {
    this.cache = {};
    this.lexer = new Lexer();
  }

  parse(input) {
    input = input || '';

    return this.cache[input]
      || (this.cache[input] = new ParserImplementation(this.lexer, input).parseChain());
  }
}

export class ParserImplementation {
  constructor(lexer, input) {
    this.index = 0;
    this.input = input;
    this.tokens = lexer.lex(input);
  }

  get peek() {
    return (this.index < this.tokens.length) ? this.tokens[this.index] : EOF;
  }

  parseChain() {
    let isChain = false;
    let expressions = [];

    while (this.optional(';')) {
      isChain = true;
    }

    while (this.index < this.tokens.length) {
      if (this.peek.text === ')' || this.peek.text === '}' || this.peek.text === ']') {
        this.error(`Unconsumed token ${this.peek.text}`);
      }

      let expr = this.parseBindingBehavior();
      expressions.push(expr);

      while (this.optional(';')) {
        isChain = true;
      }

      if (isChain) {
        this.error('Multiple expressions are not allowed.');
      }
    }

    return (expressions.length === 1) ? expressions[0] : new Chain(expressions);
  }

  parseBindingBehavior() {
    let result = this.parseValueConverter();

    while (this.optional('&')) {
      let name = this.peek.text;
      let args = [];

      this.advance();

      while (this.optional(':')) {
        args.push(this.parseExpression());
      }

      result = new BindingBehavior(result, name, args);
    }

    return result;
  }

  parseValueConverter() {
    let result = this.parseExpression();

    while (this.optional('|')) {
      let name = this.peek.text; // TODO(kasperl): Restrict to identifier?
      let args = [];

      this.advance();

      while (this.optional(':')) {
        // TODO(kasperl): Is this really supposed to be expressions?
        args.push(this.parseExpression());
      }

      result = new ValueConverter(result, name, args, [result].concat(args));
    }

    return result;
  }

  parseExpression() {
    let start = this.peek.index;
    let result = this.parseConditional();

    while (this.peek.text === '=') {
      if (!result.isAssignable) {
        let end = (this.index < this.tokens.length) ? this.peek.index : this.input.length;
        let expression = this.input.substring(start, end);

        this.error(`Expression ${expression} is not assignable`);
      }

      this.expect('=');
      result = new Assign(result, this.parseConditional());
    }

    return result;
  }

  parseConditional() {
    let start = this.peek.index;
    let result = this.parseLogicalOr();

    if (this.optional('?')) {
      let yes = this.parseExpression();

      if (!this.optional(':')) {
        let end = (this.index < this.tokens.length) ? this.peek.index : this.input.length;
        let expression = this.input.substring(start, end);

        this.error(`Conditional expression ${expression} requires all 3 expressions`);
      }

      let no = this.parseExpression();
      result = new Conditional(result, yes, no);
    }

    return result;
  }

  parseLogicalOr() {
    let result = this.parseLogicalAnd();

    while (this.optional('||')) {
      result = new Binary('||', result, this.parseLogicalAnd());
    }

    return result;
  }

  parseLogicalAnd() {
    let result = this.parseEquality();

    while (this.optional('&&')) {
      result = new Binary('&&', result, this.parseEquality());
    }

    return result;
  }

  parseEquality() {
    let result = this.parseRelational();

    while (true) { // eslint-disable-line no-constant-condition
      if (this.optional('==')) {
        result = new Binary('==', result, this.parseRelational());
      } else if (this.optional('!=')) {
        result = new Binary('!=', result, this.parseRelational());
      } else if (this.optional('===')) {
        result = new Binary('===', result, this.parseRelational());
      } else if (this.optional('!==')) {
        result = new Binary('!==', result, this.parseRelational());
      } else {
        return result;
      }
    }
  }

  parseRelational() {
    let result = this.parseAdditive();

    while (true) { // eslint-disable-line no-constant-condition
      if (this.optional('<')) {
        result = new Binary('<', result, this.parseAdditive());
      } else if (this.optional('>')) {
        result = new Binary('>', result, this.parseAdditive());
      } else if (this.optional('<=')) {
        result = new Binary('<=', result, this.parseAdditive());
      } else if (this.optional('>=')) {
        result = new Binary('>=', result, this.parseAdditive());
      } else {
        return result;
      }
    }
  }

  parseAdditive() {
    let result = this.parseMultiplicative();

    while (true) { // eslint-disable-line no-constant-condition
      if (this.optional('+')) {
        result = new Binary('+', result, this.parseMultiplicative());
      } else if (this.optional('-')) {
        result = new Binary('-', result, this.parseMultiplicative());
      } else {
        return result;
      }
    }
  }

  parseMultiplicative() {
    let result = this.parsePrefix();

    while (true) { // eslint-disable-line no-constant-condition
      if (this.optional('*')) {
        result = new Binary('*', result, this.parsePrefix());
      } else if (this.optional('%')) {
        result = new Binary('%', result, this.parsePrefix());
      } else if (this.optional('/')) {
        result = new Binary('/', result, this.parsePrefix());
      } else {
        return result;
      }
    }
  }

  parsePrefix() {
    if (this.optional('+')) {
      return this.parsePrefix(); // TODO(kasperl): This is different than the original parser.
    } else if (this.optional('-')) {
      return new Binary('-', new LiteralPrimitive(0), this.parsePrefix());
    } else if (this.optional('!')) {
      return new PrefixNot('!', this.parsePrefix());
    }

    return this.parseAccessOrCallMember();
  }

  parseAccessOrCallMember() {
    let result = this.parsePrimary();

    while (true) { // eslint-disable-line no-constant-condition
      if (this.optional('.')) {
        let name = this.peek.text; // TODO(kasperl): Check that this is an identifier. Are keywords okay?

        this.advance();

        if (this.optional('(')) {
          let args = this.parseExpressionList(')');
          this.expect(')');
          if (result instanceof AccessThis) {
            result = new CallScope(name, args, result.ancestor);
          } else {
            result = new CallMember(result, name, args);
          }
        } else {
          if (result instanceof AccessThis) {
            result = new AccessScope(name, result.ancestor);
          } else {
            result = new AccessMember(result, name);
          }
        }
      } else if (this.optional('[')) {
        let key = this.parseExpression();
        this.expect(']');
        result = new AccessKeyed(result, key);
      } else if (this.optional('(')) {
        let args = this.parseExpressionList(')');
        this.expect(')');
        result = new CallFunction(result, args);
      } else {
        return result;
      }
    }
  }

  parsePrimary() {
    if (this.optional('(')) {
      let result = this.parseExpression();
      this.expect(')');
      return result;
    } else if (this.optional('null')) {
      return new LiteralPrimitive(null);
    } else if (this.optional('undefined')) {
      return new LiteralPrimitive(undefined);
    } else if (this.optional('true')) {
      return new LiteralPrimitive(true);
    } else if (this.optional('false')) {
      return new LiteralPrimitive(false);
    } else if (this.optional('[')) {
      let elements = this.parseExpressionList(']');
      this.expect(']');
      return new LiteralArray(elements);
    } else if (this.peek.text === '{') {
      return this.parseObject();
    } else if (this.peek.key !== null && this.peek.key !== undefined) {
      return this.parseAccessOrCallScope();
    } else if (this.peek.value !== null && this.peek.value !== undefined) {
      let value = this.peek.value;
      this.advance();
      return value instanceof String || typeof value === 'string' ? new LiteralString(value) : new LiteralPrimitive(value);
    } else if (this.index >= this.tokens.length) {
      throw new Error(`Unexpected end of expression: ${this.input}`);
    } else {
      this.error(`Unexpected token ${this.peek.text}`);
    }
  }

  parseAccessOrCallScope()  {
    let name = this.peek.key;

    this.advance();

    if (name === '$this') {
      return new AccessThis(0);
    }

    let ancestor = 0;
    while (name === '$parent') {
      ancestor++;
      if (this.optional('.')) {
        name = this.peek.key;
        this.advance();
      } else if (this.peek === EOF
        || this.peek.text === '('
        || this.peek.text === ')'
        || this.peek.text === '['
        || this.peek.text === '}'
        || this.peek.text === ','
        || this.peek.text === '|'
        || this.peek.text === '&'
      ) {
        return new AccessThis(ancestor);
      } else {
        this.error(`Unexpected token ${this.peek.text}`);
      }
    }

    if (this.optional('(')) {
      let args = this.parseExpressionList(')');
      this.expect(')');
      return new CallScope(name, args, ancestor);
    }

    return new AccessScope(name, ancestor);
  }

  parseObject() {
    let keys = [];
    let values = [];

    this.expect('{');

    if (this.peek.text !== '}') {
      do {
        // TODO(kasperl): Stricter checking. Only allow identifiers
        // and strings as keys. Maybe also keywords?
        let peek = this.peek;
        let value = peek.value;
        keys.push(typeof value === 'string' ? value : peek.text);

        this.advance();
        if (peek.key && (this.peek.text === ',' || this.peek.text === '}')) {
          --this.index;
          values.push(this.parseAccessOrCallScope());
        } else {
          this.expect(':');
          values.push(this.parseExpression());
        }
      } while (this.optional(','));
    }

    this.expect('}');

    return new LiteralObject(keys, values);
  }

  parseExpressionList(terminator) {
    let result = [];

    if (this.peek.text !== terminator) {
      do {
        result.push(this.parseExpression());
      } while (this.optional(','));
    }

    return result;
  }

  optional(text) {
    if (this.peek.text === text) {
      this.advance();
      return true;
    }

    return false;
  }

  expect(text) {
    if (this.peek.text === text) {
      this.advance();
    } else {
      this.error(`Missing expected ${text}`);
    }
  }

  advance() {
    this.index++;
  }

  error(message) {
    let location = (this.index < this.tokens.length)
        ? `at column ${this.tokens[this.index].index + 1} in`
        : 'at the end of the expression';

    throw new Error(`Parser Error: ${message} ${location} [${this.input}]`);
  }
}

let mapProto = Map.prototype;

export function getMapObserver(taskQueue, map) {
  return ModifyMapObserver.for(taskQueue, map);
}

class ModifyMapObserver extends ModifyCollectionObserver {
  constructor(taskQueue, map) {
    super(taskQueue, map);
  }

  /**
   * Searches for observer or creates a new one associated with given map instance
   * @param taskQueue
   * @param map instance for which observer is searched
   * @returns ModifyMapObserver always the same instance for any given map instance
   */
  static for(taskQueue, map) {
    if (!('__map_observer__' in map)) {
      Reflect.defineProperty(map, '__map_observer__', {
        value: ModifyMapObserver.create(taskQueue, map),
        enumerable: false, configurable: false
      });
    }
    return map.__map_observer__;
  }

  static create(taskQueue, map) {
    let observer = new ModifyMapObserver(taskQueue, map);

    let proto = mapProto;
    if (proto.set !== map.set || proto.delete !== map.delete || proto.clear !== map.clear) {
      proto = {
        set: map.set,
        delete: map.delete,
        clear: map.clear
      };
    }

    map.set = function() {
      let hasValue = map.has(arguments[0]);
      let type = hasValue ? 'update' : 'add';
      let oldValue = map.get(arguments[0]);
      let methodCallResult = proto.set.apply(map, arguments);
      if (!hasValue || oldValue !== map.get(arguments[0])) {
        observer.addChangeRecord({
          type: type,
          object: map,
          key: arguments[0],
          oldValue: oldValue
        });
      }
      return methodCallResult;
    };

    map.delete = function() {
      let hasValue = map.has(arguments[0]);
      let oldValue = map.get(arguments[0]);
      let methodCallResult = proto.delete.apply(map, arguments);
      if (hasValue) {
        observer.addChangeRecord({
          type: 'delete',
          object: map,
          key: arguments[0],
          oldValue: oldValue
        });
      }
      return methodCallResult;
    };

    map.clear = function() {
      let methodCallResult = proto.clear.apply(map, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: map
      });
      return methodCallResult;
    };

    return observer;
  }
}

//Note: path and deepPath are designed to handle v0 and v1 shadow dom specs respectively
function findOriginalEventTarget(event) {
  return (event.path && event.path[0]) || (event.deepPath && event.deepPath[0]) || event.target;
}

function stopPropagation() {
  this.standardStopPropagation();
  this.propagationStopped = true;
}

function interceptStopPropagation(event) {
  event.standardStopPropagation = event.stopPropagation;
  event.stopPropagation = stopPropagation;
}

function handleCapturedEvent(event) {
  let interceptInstalled = false;
  event.propagationStopped = false;
  let target = findOriginalEventTarget(event);

  let orderedCallbacks = [];
  /**
   * During capturing phase, event 'bubbles' down from parent. Needs to reorder callback from root down to target
   */
  while (target) {
    if (target.capturedCallbacks) {
      let callback = target.capturedCallbacks[event.type];
      if (callback) {
        if (!interceptInstalled) {
          interceptStopPropagation(event);
          interceptInstalled = true;
        }
        orderedCallbacks.push(callback);
      }
    }
    target = target.parentNode;
  }
  for (let i = orderedCallbacks.length - 1; i >= 0; i--) {
    let orderedCallback = orderedCallbacks[i];
    if ('handleEvent' in orderedCallback) {
      orderedCallback.handleEvent(event);
    } else {
      orderedCallback(event);
    }
    if (event.propagationStopped) {
      break;
    }
  }
}

class CapturedHandlerEntry {
  constructor(eventName) {
    this.eventName = eventName;
    this.count = 0;
  }

  increment() {
    this.count++;

    if (this.count === 1) {
      DOM.addEventListener(this.eventName, handleCapturedEvent, true);
    }
  }

  decrement() {
    this.count--;

    if (this.count === 0) {
      DOM.removeEventListener(this.eventName, handleCapturedEvent, true);
    }
  }
}

function handleDelegatedEvent(event) {
  let interceptInstalled = false;
  event.propagationStopped = false;
  let target = findOriginalEventTarget(event);

  while (target && !event.propagationStopped) {
    if (target.delegatedCallbacks) {
      let callback = target.delegatedCallbacks[event.type];
      if (callback) {
        if (!interceptInstalled) {
          interceptStopPropagation(event);
          interceptInstalled = true;
        }
        if ('handleEvent' in callback) {
          callback.handleEvent(event);
        } else {
          callback(event);
        }
      }
    }

    target = target.parentNode;
  }
}

class DelegateHandlerEntry {
  constructor(eventName) {
    this.eventName = eventName;
    this.count = 0;
  }

  increment() {
    this.count++;

    if (this.count === 1) {
      DOM.addEventListener(this.eventName, handleDelegatedEvent, false);
    }
  }

  decrement() {
    this.count--;

    if (this.count === 0) {
      DOM.removeEventListener(this.eventName, handleDelegatedEvent);
    }
  }
}

class DefaultEventStrategy {
  delegatedHandlers = {};
  capturedHandlers = {};

  subscribe(target, targetEvent, callback, strategy) {
    let delegatedHandlers;
    let capturedHandlers;
    let handlerEntry;

    if (strategy === delegationStrategy.bubbling) {
      delegatedHandlers = this.delegatedHandlers;
      handlerEntry = delegatedHandlers[targetEvent] || (delegatedHandlers[targetEvent] = new DelegateHandlerEntry(targetEvent));
      let delegatedCallbacks = target.delegatedCallbacks || (target.delegatedCallbacks = {});

      handlerEntry.increment();
      delegatedCallbacks[targetEvent] = callback;

      return function() {
        handlerEntry.decrement();
        delegatedCallbacks[targetEvent] = null;
      };
    }
    if (strategy === delegationStrategy.capturing) {
      capturedHandlers = this.capturedHandlers;
      handlerEntry = capturedHandlers[targetEvent] || (capturedHandlers[targetEvent] = new CapturedHandlerEntry(targetEvent));
      let capturedCallbacks = target.capturedCallbacks || (target.capturedCallbacks = {});

      handlerEntry.increment();
      capturedCallbacks[targetEvent] = callback;

      return function() {
        handlerEntry.decrement();
        capturedCallbacks[targetEvent] = null;
      };
    }

    target.addEventListener(targetEvent, callback, false);

    return function() {
      target.removeEventListener(targetEvent, callback);
    };
  }
}

export const delegationStrategy = {
  none: 0,
  capturing: 1,
  bubbling: 2
};

export class EventManager {
  constructor() {
    this.elementHandlerLookup = {};
    this.eventStrategyLookup = {};

    this.registerElementConfig({
      tagName: 'input',
      properties: {
        value: ['change', 'input'],
        checked: ['change', 'input'],
        files: ['change', 'input']
      }
    });

    this.registerElementConfig({
      tagName: 'textarea',
      properties: {
        value: ['change', 'input']
      }
    });

    this.registerElementConfig({
      tagName: 'select',
      properties: {
        value: ['change']
      }
    });

    this.registerElementConfig({
      tagName: 'content editable',
      properties: {
        value: ['change', 'input', 'blur', 'keyup', 'paste']
      }
    });

    this.registerElementConfig({
      tagName: 'scrollable element',
      properties: {
        scrollTop: ['scroll'],
        scrollLeft: ['scroll']
      }
    });

    this.defaultEventStrategy = new DefaultEventStrategy();
  }

  registerElementConfig(config) {
    let tagName = config.tagName.toLowerCase();
    let properties = config.properties;
    let propertyName;

    this.elementHandlerLookup[tagName] = {};

    for (propertyName in properties) {
      if (properties.hasOwnProperty(propertyName)) {
        this.registerElementPropertyConfig(tagName, propertyName, properties[propertyName]);
      }
    }
  }

  registerElementPropertyConfig(tagName, propertyName, events) {
    this.elementHandlerLookup[tagName][propertyName] = this.createElementHandler(events);
  }

  createElementHandler(events) {
    return {
      subscribe(target, callback) {
        events.forEach(changeEvent => {
          target.addEventListener(changeEvent, callback, false);
        });

        return function() {
          events.forEach(changeEvent => {
            target.removeEventListener(changeEvent, callback);
          });
        };
      }
    };
  }

  registerElementHandler(tagName, handler) {
    this.elementHandlerLookup[tagName.toLowerCase()] = handler;
  }

  registerEventStrategy(eventName, strategy) {
    this.eventStrategyLookup[eventName] = strategy;
  }

  getElementHandler(target, propertyName) {
    let tagName;
    let lookup = this.elementHandlerLookup;

    if (target.tagName) {
      tagName = target.tagName.toLowerCase();

      if (lookup[tagName] && lookup[tagName][propertyName]) {
        return lookup[tagName][propertyName];
      }

      if (propertyName === 'textContent' || propertyName === 'innerHTML') {
        return lookup['content editable'].value;
      }

      if (propertyName === 'scrollTop' || propertyName === 'scrollLeft') {
        return lookup['scrollable element'][propertyName];
      }
    }

    return null;
  }

  addEventListener(target, targetEvent, callbackOrListener, delegate) {
    return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy)
      .subscribe(target, targetEvent, callbackOrListener, delegate);
  }
}

export class DirtyChecker {
  constructor() {
    this.tracked = [];
    this.checkDelay = 120;
  }

  addProperty(property) {
    let tracked = this.tracked;

    tracked.push(property);

    if (tracked.length === 1) {
      this.scheduleDirtyCheck();
    }
  }

  removeProperty(property) {
    let tracked = this.tracked;
    tracked.splice(tracked.indexOf(property), 1);
  }

  scheduleDirtyCheck() {
    setTimeout(() => this.check(), this.checkDelay);
  }

  check() {
    let tracked = this.tracked;
    let i = tracked.length;

    while (i--) {
      let current = tracked[i];

      if (current.isDirty()) {
        current.call();
      }
    }

    if (tracked.length) {
      this.scheduleDirtyCheck();
    }
  }
}

@subscriberCollection()
export class DirtyCheckProperty {
  constructor(dirtyChecker, obj, propertyName) {
    this.dirtyChecker = dirtyChecker;
    this.obj = obj;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.obj[this.propertyName];
  }

  setValue(newValue) {
    this.obj[this.propertyName] = newValue;
  }

  call() {
    let oldValue = this.oldValue;
    let newValue = this.getValue();

    this.callSubscribers(newValue, oldValue);

    this.oldValue = newValue;
  }

  isDirty() {
    return this.oldValue !== this.obj[this.propertyName];
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.getValue();
      this.dirtyChecker.addProperty(this);
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.dirtyChecker.removeProperty(this);
    }
  }
}

const logger = LogManager.getLogger('property-observation');

export const propertyAccessor = {
  getValue: (obj, propertyName) => obj[propertyName],
  setValue: (value, obj, propertyName) => { obj[propertyName] = value; }
};

export class PrimitiveObserver {
  doNotCache = true;

  constructor(primitive, propertyName) {
    this.primitive = primitive;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.primitive[this.propertyName];
  }

  setValue() {
    let type = typeof this.primitive;
    throw new Error(`The ${this.propertyName} property of a ${type} (${this.primitive}) cannot be assigned.`);
  }

  subscribe() {
  }

  unsubscribe() {
  }
}

@subscriberCollection()
export class SetterObserver {
  constructor(taskQueue, obj, propertyName) {
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.queued = false;
    this.observing = false;
  }

  getValue() {
    return this.obj[this.propertyName];
  }

  setValue(newValue) {
    this.obj[this.propertyName] = newValue;
  }

  getterValue() {
    return this.currentValue;
  }

  setterValue(newValue) {
    let oldValue = this.currentValue;

    if (oldValue !== newValue) {
      if (!this.queued) {
        this.oldValue = oldValue;
        this.queued = true;
        this.taskQueue.queueMicroTask(this);
      }

      this.currentValue = newValue;
    }
  }

  call() {
    let oldValue = this.oldValue;
    let newValue = this.currentValue;

    this.queued = false;

    this.callSubscribers(newValue, oldValue);
  }

  subscribe(context, callable) {
    if (!this.observing) {
      this.convertProperty();
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }

  convertProperty() {
    this.observing = true;
    this.currentValue = this.obj[this.propertyName];
    this.setValue = this.setterValue;
    this.getValue = this.getterValue;

    if (!Reflect.defineProperty(this.obj, this.propertyName, {
      configurable: true,
      enumerable: this.propertyName in this.obj ?
          this.obj.propertyIsEnumerable(this.propertyName) : true,
      get: this.getValue.bind(this),
      set: this.setValue.bind(this)
    })) {
      logger.warn(`Cannot observe property '${this.propertyName}' of object`, this.obj);
    }
  }
}

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

    this.styles = null;
    this.version = 0;
  }

  getValue() {
    return this.element.style.cssText;
  }

  _setProperty(style, value) {
    let priority = '';

    if (value !== null && value !== undefined && typeof value.indexOf === 'function' && value.indexOf('!important') !== -1) {
      priority = 'important';
      value = value.replace('!important', '');
    }
    this.element.style.setProperty(style, value, priority);
  }

  setValue(newValue) {
    let styles = this.styles || {};
    let style;
    let version = this.version;

    if (newValue !== null && newValue !== undefined) {
      if (newValue instanceof Object) {
        let value;
        for (style in newValue) {
          if (newValue.hasOwnProperty(style)) {
            value = newValue[style];
            style = style.replace(/([A-Z])/g, m => '-' + m.toLowerCase());
            styles[style] = version;
            this._setProperty(style, value);
          }
        }
      } else if (newValue.length) {
        let rx = /\s*([\w\-]+)\s*:\s*((?:(?:[\w\-]+\(\s*(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[\w\-]+\(\s*(?:^"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^\)]*)\),?|[^\)]*)\),?|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^;]*),?\s*)+);?/g;
        let pair;
        while ((pair = rx.exec(newValue)) !== null) {
          style = pair[1];
          if ( !style ) { continue; }

          styles[style] = version;
          this._setProperty(style, pair[2]);
        }
      }
    }

    this.styles = styles;
    this.version += 1;

    if (version === 0) {
      return;
    }

    version -= 1;
    for (style in styles) {
      if (!styles.hasOwnProperty(style) || styles[style] !== version) {
        continue;
      }

      this.element.style.removeProperty(style);
    }
  }

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
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

const checkedArrayContext = 'CheckedObserver:array';
const checkedValueContext = 'CheckedObserver:value';

@subscriberCollection()
export class CheckedObserver {
  constructor(element, handler, observerLocator) {
    this.element = element;
    this.handler = handler;
    this.observerLocator = observerLocator;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    if (this.initialSync && this.value === newValue) {
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
    this.oldValue = this.value;
    this.value = newValue;
    this.synchronizeElement();
    this.notify();
    // queue up an initial sync after the bindings have been evaluated.
    if (!this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask(this);
    }
  }

  call(context, splices) {
    // called by task queue, array observer, and model/value observer.
    this.synchronizeElement();
    // if the input's model or value property is data-bound, subscribe to it's
    // changes to enable synchronizing the element's checked status when a change occurs.
    if (!this.valueObserver) {
      this.valueObserver = this.element.__observers__.model || this.element.__observers__.value;
      if (this.valueObserver) {
        this.valueObserver.subscribe(checkedValueContext, this);
      }
    }
  }

  synchronizeElement() {
    let value = this.value;
    let element = this.element;
    let elementValue = element.hasOwnProperty('model') ? element.model : element.value;
    let isRadio = element.type === 'radio';
    let matcher = element.matcher || ((a, b) => a === b);

    element.checked =
      isRadio && !!matcher(value, elementValue)
      || !isRadio && value === true
      || !isRadio && Array.isArray(value) && value.findIndex(item => !!matcher(item, elementValue)) !== -1;
  }

  synchronizeValue() {
    let value = this.value;
    let element = this.element;
    let elementValue = element.hasOwnProperty('model') ? element.model : element.value;
    let index;
    let matcher = element.matcher || ((a, b) => a === b);

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
      }

      value = element.checked;
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

    if (newValue === oldValue) {
      return;
    }

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

  unbind() {
    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(checkedArrayContext, this);
      this.arrayObserver = null;
    }
    if (this.valueObserver) {
      this.valueObserver.unsubscribe(checkedValueContext, this);
    }
  }
}

const selectArrayContext = 'SelectValueObserver:array';

@subscriberCollection()
export class SelectValueObserver {
  constructor(element, handler, observerLocator) {
    this.element = element;
    this.handler = handler;
    this.observerLocator = observerLocator;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    if (newValue !== null && newValue !== undefined && this.element.multiple && !Array.isArray(newValue)) {
      throw new Error('Only null or Array instances can be bound to a multi-select.');
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
    this.oldValue = this.value;
    this.value = newValue;
    this.synchronizeOptions();
    this.notify();
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
    let value = this.value;
    let isArray;

    if (Array.isArray(value)) {
      isArray = true;
    }

    let options = this.element.options;
    let i = options.length;
    let matcher = this.element.matcher || ((a, b) => a === b);
    while (i--) {
      let option = options.item(i);
      let optionValue = option.hasOwnProperty('model') ? option.model : option.value;
      if (isArray) {
        option.selected = value.findIndex(item => !!matcher(optionValue, item)) !== -1; // eslint-disable-line no-loop-func
        continue;
      }
      option.selected = !!matcher(optionValue, value);
    }
  }

  synchronizeValue() {
    let options = this.element.options;
    let count = 0;
    let value = [];

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
          if (value.findIndex(b => matcher(a, b)) === -1) { // eslint-disable-line no-loop-func
            this.value.splice(i, 1);
          } else {
            i++;
          }
        }
        // add items that have been selected.
        i = 0;
        while (i < value.length) {
          let a = value[i];
          if (this.value.findIndex(b => matcher(a, b)) === -1) { // eslint-disable-line no-loop-func
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

export class ClassObserver {
  constructor(element) {
    this.element = element;
    this.doNotCache = true;
    this.value = '';
    this.version = 0;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    let nameIndex = this.nameIndex || {};
    let version = this.version;
    let names;
    let name;

    // Add the classes, tracking the version at which they were added.
    if (newValue !== null && newValue !== undefined && newValue.length) {
      names = newValue.split(/\s+/);
      for (let i = 0, length = names.length; i < length; i++) {
        name = names[i];
        if (name === '') {
          continue;
        }
        nameIndex[name] = version;
        this.element.classList.add(name);
      }
    }

    // Update state variables.
    this.value = newValue;
    this.nameIndex = nameIndex;
    this.version += 1;

    // First call to setValue?  We're done.
    if (version === 0) {
      return;
    }

    // Remove classes from previous version.
    version -= 1;
    for (name in nameIndex) {
      if (!nameIndex.hasOwnProperty(name) || nameIndex[name] !== version) {
        continue;
      }
      this.element.classList.remove(name);
    }
  }

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "class" property is not supported.`);
  }
}

export function hasDeclaredDependencies(descriptor) {
  return !!(descriptor && descriptor.get && descriptor.get.dependencies);
}

export function declarePropertyDependencies(ctor, propertyName, dependencies) {
  let descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
  descriptor.get.dependencies = dependencies;
}

export function computedFrom(...rest) {
  return function(target, key, descriptor) {
    descriptor.get.dependencies = rest;
    return descriptor;
  };
}

export class ComputedExpression extends Expression {
  constructor(name, dependencies) {
    super();

    this.name = name;
    this.dependencies = dependencies;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    return scope.bindingContext[this.name];
  }

  assign(scope, value) {
    scope.bindingContext[this.name] = value;
  }

  accept(visitor) {
    throw new Error('not implemented');
  }

  connect(binding, scope) {
    let dependencies = this.dependencies;
    let i = dependencies.length;
    while (i--) {
      dependencies[i].connect(binding, scope);
    }
  }
}

export function createComputedObserver(obj, propertyName, descriptor, observerLocator) {
  let dependencies = descriptor.get.dependencies;
  if (!(dependencies instanceof ComputedExpression)) {
    let i = dependencies.length;
    while (i--) {
      dependencies[i] = observerLocator.parser.parse(dependencies[i]);
    }
    dependencies = descriptor.get.dependencies = new ComputedExpression(propertyName, dependencies);
  }

  let scope = { bindingContext: obj, overrideContext: createOverrideContext(obj) };
  return new ExpressionObserver(scope, dependencies, observerLocator);
}

let svgElements;
let svgPresentationElements;
let svgPresentationAttributes;
let svgAnalyzer;

if (typeof FEATURE_NO_SVG === 'undefined') {
  /* eslint-disable */
  svgElements = {
    a: ['class','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','style','systemLanguage','target','transform','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    altGlyph: ['class','dx','dy','externalResourcesRequired','format','glyphRef','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','rotate','style','systemLanguage','x','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    altGlyphDef: ['id','xml:base','xml:lang','xml:space'],
    altGlyphItem: ['id','xml:base','xml:lang','xml:space'],
    animate: ['accumulate','additive','attributeName','attributeType','begin','by','calcMode','dur','end','externalResourcesRequired','fill','from','id','keySplines','keyTimes','max','min','onbegin','onend','onload','onrepeat','repeatCount','repeatDur','requiredExtensions','requiredFeatures','restart','systemLanguage','to','values','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    animateColor: ['accumulate','additive','attributeName','attributeType','begin','by','calcMode','dur','end','externalResourcesRequired','fill','from','id','keySplines','keyTimes','max','min','onbegin','onend','onload','onrepeat','repeatCount','repeatDur','requiredExtensions','requiredFeatures','restart','systemLanguage','to','values','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    animateMotion: ['accumulate','additive','begin','by','calcMode','dur','end','externalResourcesRequired','fill','from','id','keyPoints','keySplines','keyTimes','max','min','onbegin','onend','onload','onrepeat','origin','path','repeatCount','repeatDur','requiredExtensions','requiredFeatures','restart','rotate','systemLanguage','to','values','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    animateTransform: ['accumulate','additive','attributeName','attributeType','begin','by','calcMode','dur','end','externalResourcesRequired','fill','from','id','keySplines','keyTimes','max','min','onbegin','onend','onload','onrepeat','repeatCount','repeatDur','requiredExtensions','requiredFeatures','restart','systemLanguage','to','type','values','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    circle: ['class','cx','cy','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','r','requiredExtensions','requiredFeatures','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    clipPath: ['class','clipPathUnits','externalResourcesRequired','id','requiredExtensions','requiredFeatures','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    'color-profile': ['id','local','name','rendering-intent','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    cursor: ['externalResourcesRequired','id','requiredExtensions','requiredFeatures','systemLanguage','x','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    defs: ['class','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    desc: ['class','id','style','xml:base','xml:lang','xml:space'],
    ellipse: ['class','cx','cy','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','rx','ry','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    feBlend: ['class','height','id','in','in2','mode','result','style','width','x','xml:base','xml:lang','xml:space','y'],
    feColorMatrix: ['class','height','id','in','result','style','type','values','width','x','xml:base','xml:lang','xml:space','y'],
    feComponentTransfer: ['class','height','id','in','result','style','width','x','xml:base','xml:lang','xml:space','y'],
    feComposite: ['class','height','id','in','in2','k1','k2','k3','k4','operator','result','style','width','x','xml:base','xml:lang','xml:space','y'],
    feConvolveMatrix: ['bias','class','divisor','edgeMode','height','id','in','kernelMatrix','kernelUnitLength','order','preserveAlpha','result','style','targetX','targetY','width','x','xml:base','xml:lang','xml:space','y'],
    feDiffuseLighting: ['class','diffuseConstant','height','id','in','kernelUnitLength','result','style','surfaceScale','width','x','xml:base','xml:lang','xml:space','y'],
    feDisplacementMap: ['class','height','id','in','in2','result','scale','style','width','x','xChannelSelector','xml:base','xml:lang','xml:space','y','yChannelSelector'],
    feDistantLight: ['azimuth','elevation','id','xml:base','xml:lang','xml:space'],
    feFlood: ['class','height','id','result','style','width','x','xml:base','xml:lang','xml:space','y'],
    feFuncA: ['amplitude','exponent','id','intercept','offset','slope','tableValues','type','xml:base','xml:lang','xml:space'],
    feFuncB: ['amplitude','exponent','id','intercept','offset','slope','tableValues','type','xml:base','xml:lang','xml:space'],
    feFuncG: ['amplitude','exponent','id','intercept','offset','slope','tableValues','type','xml:base','xml:lang','xml:space'],
    feFuncR: ['amplitude','exponent','id','intercept','offset','slope','tableValues','type','xml:base','xml:lang','xml:space'],
    feGaussianBlur: ['class','height','id','in','result','stdDeviation','style','width','x','xml:base','xml:lang','xml:space','y'],
    feImage: ['class','externalResourcesRequired','height','id','preserveAspectRatio','result','style','width','x','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    feMerge: ['class','height','id','result','style','width','x','xml:base','xml:lang','xml:space','y'],
    feMergeNode: ['id','xml:base','xml:lang','xml:space'],
    feMorphology: ['class','height','id','in','operator','radius','result','style','width','x','xml:base','xml:lang','xml:space','y'],
    feOffset: ['class','dx','dy','height','id','in','result','style','width','x','xml:base','xml:lang','xml:space','y'],
    fePointLight: ['id','x','xml:base','xml:lang','xml:space','y','z'],
    feSpecularLighting: ['class','height','id','in','kernelUnitLength','result','specularConstant','specularExponent','style','surfaceScale','width','x','xml:base','xml:lang','xml:space','y'],
    feSpotLight: ['id','limitingConeAngle','pointsAtX','pointsAtY','pointsAtZ','specularExponent','x','xml:base','xml:lang','xml:space','y','z'],
    feTile: ['class','height','id','in','result','style','width','x','xml:base','xml:lang','xml:space','y'],
    feTurbulence: ['baseFrequency','class','height','id','numOctaves','result','seed','stitchTiles','style','type','width','x','xml:base','xml:lang','xml:space','y'],
    filter: ['class','externalResourcesRequired','filterRes','filterUnits','height','id','primitiveUnits','style','width','x','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    font: ['class','externalResourcesRequired','horiz-adv-x','horiz-origin-x','horiz-origin-y','id','style','vert-adv-y','vert-origin-x','vert-origin-y','xml:base','xml:lang','xml:space'],
    'font-face': ['accent-height','alphabetic','ascent','bbox','cap-height','descent','font-family','font-size','font-stretch','font-style','font-variant','font-weight','hanging','id','ideographic','mathematical','overline-position','overline-thickness','panose-1','slope','stemh','stemv','strikethrough-position','strikethrough-thickness','underline-position','underline-thickness','unicode-range','units-per-em','v-alphabetic','v-hanging','v-ideographic','v-mathematical','widths','x-height','xml:base','xml:lang','xml:space'],
    'font-face-format': ['id','string','xml:base','xml:lang','xml:space'],
    'font-face-name': ['id','name','xml:base','xml:lang','xml:space'],
    'font-face-src': ['id','xml:base','xml:lang','xml:space'],
    'font-face-uri': ['id','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    foreignObject: ['class','externalResourcesRequired','height','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','style','systemLanguage','transform','width','x','xml:base','xml:lang','xml:space','y'],
    g: ['class','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    glyph: ['arabic-form','class','d','glyph-name','horiz-adv-x','id','lang','orientation','style','unicode','vert-adv-y','vert-origin-x','vert-origin-y','xml:base','xml:lang','xml:space'],
    glyphRef: ['class','dx','dy','format','glyphRef','id','style','x','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    hkern: ['g1','g2','id','k','u1','u2','xml:base','xml:lang','xml:space'],
    image: ['class','externalResourcesRequired','height','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','preserveAspectRatio','requiredExtensions','requiredFeatures','style','systemLanguage','transform','width','x','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    line: ['class','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','style','systemLanguage','transform','x1','x2','xml:base','xml:lang','xml:space','y1','y2'],
    linearGradient: ['class','externalResourcesRequired','gradientTransform','gradientUnits','id','spreadMethod','style','x1','x2','xlink:arcrole','xlink:href','xlink:role','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y1','y2'],
    marker: ['class','externalResourcesRequired','id','markerHeight','markerUnits','markerWidth','orient','preserveAspectRatio','refX','refY','style','viewBox','xml:base','xml:lang','xml:space'],
    mask: ['class','externalResourcesRequired','height','id','maskContentUnits','maskUnits','requiredExtensions','requiredFeatures','style','systemLanguage','width','x','xml:base','xml:lang','xml:space','y'],
    metadata: ['id','xml:base','xml:lang','xml:space'],
    'missing-glyph': ['class','d','horiz-adv-x','id','style','vert-adv-y','vert-origin-x','vert-origin-y','xml:base','xml:lang','xml:space'],
    mpath: ['externalResourcesRequired','id','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    path: ['class','d','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','pathLength','requiredExtensions','requiredFeatures','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    pattern: ['class','externalResourcesRequired','height','id','patternContentUnits','patternTransform','patternUnits','preserveAspectRatio','requiredExtensions','requiredFeatures','style','systemLanguage','viewBox','width','x','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    polygon: ['class','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','points','requiredExtensions','requiredFeatures','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    polyline: ['class','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','points','requiredExtensions','requiredFeatures','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    radialGradient: ['class','cx','cy','externalResourcesRequired','fx','fy','gradientTransform','gradientUnits','id','r','spreadMethod','style','xlink:arcrole','xlink:href','xlink:role','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    rect: ['class','externalResourcesRequired','height','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','rx','ry','style','systemLanguage','transform','width','x','xml:base','xml:lang','xml:space','y'],
    script: ['externalResourcesRequired','id','type','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    set: ['attributeName','attributeType','begin','dur','end','externalResourcesRequired','fill','id','max','min','onbegin','onend','onload','onrepeat','repeatCount','repeatDur','requiredExtensions','requiredFeatures','restart','systemLanguage','to','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    stop: ['class','id','offset','style','xml:base','xml:lang','xml:space'],
    style: ['id','media','title','type','xml:base','xml:lang','xml:space'],
    svg: ['baseProfile','class','contentScriptType','contentStyleType','externalResourcesRequired','height','id','onabort','onactivate','onclick','onerror','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','onresize','onscroll','onunload','onzoom','preserveAspectRatio','requiredExtensions','requiredFeatures','style','systemLanguage','version','viewBox','width','x','xml:base','xml:lang','xml:space','y','zoomAndPan'],
    switch: ['class','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','style','systemLanguage','transform','xml:base','xml:lang','xml:space'],
    symbol: ['class','externalResourcesRequired','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','preserveAspectRatio','style','viewBox','xml:base','xml:lang','xml:space'],
    text: ['class','dx','dy','externalResourcesRequired','id','lengthAdjust','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','rotate','style','systemLanguage','textLength','transform','x','xml:base','xml:lang','xml:space','y'],
    textPath: ['class','externalResourcesRequired','id','lengthAdjust','method','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','spacing','startOffset','style','systemLanguage','textLength','xlink:arcrole','xlink:href','xlink:role','xlink:title','xlink:type','xml:base','xml:lang','xml:space'],
    title: ['class','id','style','xml:base','xml:lang','xml:space'],
    tref: ['class','dx','dy','externalResourcesRequired','id','lengthAdjust','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','rotate','style','systemLanguage','textLength','x','xlink:arcrole','xlink:href','xlink:role','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    tspan: ['class','dx','dy','externalResourcesRequired','id','lengthAdjust','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','rotate','style','systemLanguage','textLength','x','xml:base','xml:lang','xml:space','y'],
    use: ['class','externalResourcesRequired','height','id','onactivate','onclick','onfocusin','onfocusout','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','requiredExtensions','requiredFeatures','style','systemLanguage','transform','width','x','xlink:actuate','xlink:arcrole','xlink:href','xlink:role','xlink:show','xlink:title','xlink:type','xml:base','xml:lang','xml:space','y'],
    view: ['externalResourcesRequired','id','preserveAspectRatio','viewBox','viewTarget','xml:base','xml:lang','xml:space','zoomAndPan'],
    vkern: ['g1','g2','id','k','u1','u2','xml:base','xml:lang','xml:space'],
  };
  /* eslint-enable */

  svgPresentationElements = {
    'a': true,
    'altGlyph': true,
    'animate': true,
    'animateColor': true,
    'circle': true,
    'clipPath': true,
    'defs': true,
    'ellipse': true,
    'feBlend': true,
    'feColorMatrix': true,
    'feComponentTransfer': true,
    'feComposite': true,
    'feConvolveMatrix': true,
    'feDiffuseLighting': true,
    'feDisplacementMap': true,
    'feFlood': true,
    'feGaussianBlur': true,
    'feImage': true,
    'feMerge': true,
    'feMorphology': true,
    'feOffset': true,
    'feSpecularLighting': true,
    'feTile': true,
    'feTurbulence': true,
    'filter': true,
    'font': true,
    'foreignObject': true,
    'g': true,
    'glyph': true,
    'glyphRef': true,
    'image': true,
    'line': true,
    'linearGradient': true,
    'marker': true,
    'mask': true,
    'missing-glyph': true,
    'path': true,
    'pattern': true,
    'polygon': true,
    'polyline': true,
    'radialGradient': true,
    'rect': true,
    'stop': true,
    'svg': true,
    'switch': true,
    'symbol': true,
    'text': true,
    'textPath': true,
    'tref': true,
    'tspan': true,
    'use': true
  };

  svgPresentationAttributes = {
    'alignment-baseline': true,
    'baseline-shift': true,
    'clip-path': true,
    'clip-rule': true,
    'clip': true,
    'color-interpolation-filters': true,
    'color-interpolation': true,
    'color-profile': true,
    'color-rendering': true,
    'color': true,
    'cursor': true,
    'direction': true,
    'display': true,
    'dominant-baseline': true,
    'enable-background': true,
    'fill-opacity': true,
    'fill-rule': true,
    'fill': true,
    'filter': true,
    'flood-color': true,
    'flood-opacity': true,
    'font-family': true,
    'font-size-adjust': true,
    'font-size': true,
    'font-stretch': true,
    'font-style': true,
    'font-variant': true,
    'font-weight': true,
    'glyph-orientation-horizontal': true,
    'glyph-orientation-vertical': true,
    'image-rendering': true,
    'kerning': true,
    'letter-spacing': true,
    'lighting-color': true,
    'marker-end': true,
    'marker-mid': true,
    'marker-start': true,
    'mask': true,
    'opacity': true,
    'overflow': true,
    'pointer-events': true,
    'shape-rendering': true,
    'stop-color': true,
    'stop-opacity': true,
    'stroke-dasharray': true,
    'stroke-dashoffset': true,
    'stroke-linecap': true,
    'stroke-linejoin': true,
    'stroke-miterlimit': true,
    'stroke-opacity': true,
    'stroke-width': true,
    'stroke': true,
    'text-anchor': true,
    'text-decoration': true,
    'text-rendering': true,
    'unicode-bidi': true,
    'visibility': true,
    'word-spacing': true,
    'writing-mode': true
  };

  // SVG elements/attributes are case-sensitive.  Not all browsers use the same casing for all attributes.
  let createElement = function(html) {
    let div = DOM.createElement('div');
    div.innerHTML = html;
    return div.firstChild;
  };

  svgAnalyzer = class SVGAnalyzer {
    constructor() {
      if (createElement('<svg><altGlyph /></svg>').firstElementChild.nodeName === 'altglyph' && elements.altGlyph) {
        // handle chrome casing inconsistencies.
        elements.altglyph = elements.altGlyph;
        delete elements.altGlyph;
        elements.altglyphdef = elements.altGlyphDef;
        delete elements.altGlyphDef;
        elements.altglyphitem = elements.altGlyphItem;
        delete elements.altGlyphItem;
        elements.glyphref = elements.glyphRef;
        delete elements.glyphRef;
      }
    }

    isStandardSvgAttribute(nodeName, attributeName) {
      return presentationElements[nodeName] && presentationAttributes[attributeName]
        || elements[nodeName] && elements[nodeName].indexOf(attributeName) !== -1;
    }
  };
}

export const elements = svgElements;
export const presentationElements = svgPresentationElements;
export const presentationAttributes = svgPresentationAttributes;
export const SVGAnalyzer = svgAnalyzer || class { isStandardSvgAttribute() { return false; } };

export class ObserverLocator {
  static inject = [TaskQueue, EventManager, DirtyChecker, SVGAnalyzer, Parser];

  constructor(taskQueue, eventManager, dirtyChecker, svgAnalyzer, parser) {
    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
    this.svgAnalyzer = svgAnalyzer;
    this.parser = parser;
    this.adapters = [];
    this.logger = LogManager.getLogger('observer-locator');
  }

  getObserver(obj, propertyName) {
    let observersLookup = obj.__observers__;
    let observer;

    if (observersLookup && propertyName in observersLookup) {
      return observersLookup[propertyName];
    }

    observer = this.createPropertyObserver(obj, propertyName);

    if (!observer.doNotCache) {
      if (observersLookup === undefined) {
        observersLookup = this.getOrCreateObserversLookup(obj);
      }

      observersLookup[propertyName] = observer;
    }

    return observer;
  }

  getOrCreateObserversLookup(obj) {
    return obj.__observers__ || this.createObserversLookup(obj);
  }

  createObserversLookup(obj) {
    let value = {};

    if (!Reflect.defineProperty(obj, '__observers__', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    })) {
      this.logger.warn('Cannot add observers to object', obj);
    }

    return value;
  }

  addAdapter(adapter: ObjectObservationAdapter) {
    this.adapters.push(adapter);
  }

  getAdapterObserver(obj, propertyName, descriptor) {
    for (let i = 0, ii = this.adapters.length; i < ii; i++) {
      let adapter = this.adapters[i];
      let observer = adapter.getObserver(obj, propertyName, descriptor);
      if (observer) {
        return observer;
      }
    }
    return null;
  }

  createPropertyObserver(obj, propertyName) {
    let descriptor;
    let handler;
    let xlinkResult;

    if (!(obj instanceof Object)) {
      return new PrimitiveObserver(obj, propertyName);
    }

    if (obj instanceof DOM.Element) {
      if (propertyName === 'class') {
        return new ClassObserver(obj);
      }
      if (propertyName === 'style' || propertyName === 'css') {
        return new StyleObserver(obj, propertyName);
      }
      handler = this.eventManager.getElementHandler(obj, propertyName);
      if (propertyName === 'value' && obj.tagName.toLowerCase() === 'select') {
        return new SelectValueObserver(obj, handler, this);
      }
      if (propertyName === 'checked' && obj.tagName.toLowerCase() === 'input') {
        return new CheckedObserver(obj, handler, this);
      }
      if (handler) {
        return new ValueAttributeObserver(obj, propertyName, handler);
      }
      xlinkResult = /^xlink:(.+)$/.exec(propertyName);
      if (xlinkResult) {
        return new XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
      }
      if (propertyName === 'role' && (obj instanceof DOM.Element || obj instanceof DOM.SVGElement)
        || /^\w+:|^data-|^aria-/.test(propertyName)
        || obj instanceof DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)) {
        return new DataAttributeObserver(obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);

    if (hasDeclaredDependencies(descriptor)) {
      return createComputedObserver(obj, propertyName, descriptor, this);
    }

    if (descriptor) {
      const existingGetterOrSetter = descriptor.get || descriptor.set;
      if (existingGetterOrSetter) {
        if (existingGetterOrSetter.getObserver) {
          return existingGetterOrSetter.getObserver(obj);
        }

        // attempt to use an adapter before resorting to dirty checking.
        let adapterObserver = this.getAdapterObserver(obj, propertyName, descriptor);
        if (adapterObserver) {
          return adapterObserver;
        }
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }

    if (obj instanceof Array) {
      if (propertyName === 'length') {
        return this.getArrayObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    } else if (obj instanceof Map) {
      if (propertyName === 'size') {
        return this.getMapObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    } else if (obj instanceof Set) {
      if (propertyName === 'size') {
        return this.getSetObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    }

    return new SetterObserver(this.taskQueue, obj, propertyName);
  }

  getAccessor(obj, propertyName) {
    if (obj instanceof DOM.Element) {
      if (propertyName === 'class'
        || propertyName === 'style' || propertyName === 'css'
        || propertyName === 'value' && (obj.tagName.toLowerCase() === 'input' || obj.tagName.toLowerCase() === 'select')
        || propertyName === 'checked' && obj.tagName.toLowerCase() === 'input'
        || propertyName === 'model' && obj.tagName.toLowerCase() === 'input'
        || /^xlink:.+$/.exec(propertyName)) {
        return this.getObserver(obj, propertyName);
      }
      if (/^\w+:|^data-|^aria-/.test(propertyName)
        || obj instanceof DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)) {
        return dataAttributeAccessor;
      }
    }
    return propertyAccessor;
  }

  getArrayObserver(array) {
    return getArrayObserver(this.taskQueue, array);
  }

  getMapObserver(map) {
    return getMapObserver(this.taskQueue, map);
  }

  getSetObserver(set) {
    return getSetObserver(this.taskQueue, set);
  }
}

export class ObjectObservationAdapter {
  getObserver(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement getObserver(object, propertyName).');
  }
}

export class BindingExpression {
  constructor(observerLocator, targetProperty, sourceExpression,
    mode, lookupFunctions, attribute) {
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
    this.attribute = attribute;
    this.discrete = false;
  }

  createBinding(target) {
    return new Binding(
      this.observerLocator,
      this.sourceExpression,
      target,
      this.targetProperty,
      this.mode,
      this.lookupFunctions
      );
  }
}

const targetContext = 'Binding:target';

@connectable()
export class Binding {
  constructor(observerLocator, sourceExpression, target, targetProperty, mode, lookupFunctions) {
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.targetProperty = targetProperty;
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
  }

  updateTarget(value) {
    this.targetObserver.setValue(value, this.target, this.targetProperty);
  }

  updateSource(value) {
    this.sourceExpression.assign(this.source, value, this.lookupFunctions);
  }

  call(context, newValue, oldValue) {
    if (!this.isBound) {
      return;
    }
    if (context === sourceContext) {
      oldValue = this.targetObserver.getValue(this.target, this.targetProperty);
      newValue = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
      if (newValue !== oldValue) {
        this.updateTarget(newValue);
      }
      if (this.mode !== bindingMode.oneTime) {
        this._version++;
        this.sourceExpression.connect(this, this.source);
        this.unobserve(false);
      }
      return;
    }
    if (context === targetContext) {
      if (newValue !== this.sourceExpression.evaluate(this.source, this.lookupFunctions)) {
        this.updateSource(newValue);
      }
      return;
    }
    throw new Error(`Unexpected call context ${context}`);
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }

    let mode = this.mode;
    if (!this.targetObserver) {
      let method = mode === bindingMode.twoWay || mode === bindingMode.fromView ? 'getObserver' : 'getAccessor';
      this.targetObserver = this.observerLocator[method](this.target, this.targetProperty);
    }

    if ('bind' in this.targetObserver) {
      this.targetObserver.bind();
    }
    if (this.mode !== bindingMode.fromView) {
      let value = this.sourceExpression.evaluate(source, this.lookupFunctions);
      this.updateTarget(value);
    }

    if (mode === bindingMode.oneWay) {
      enqueueBindingConnect(this);
    } else if (mode === bindingMode.twoWay) {
      this.sourceExpression.connect(this, source);
      this.targetObserver.subscribe(targetContext, this);
    } else if (mode === bindingMode.fromView) {
      this.targetObserver.subscribe(targetContext, this);
    }
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    if ('unbind' in this.targetObserver) {
      this.targetObserver.unbind();
    }
    if (this.targetObserver.unsubscribe) {
      this.targetObserver.unsubscribe(targetContext, this);
    }
    this.unobserve(true);
  }

  connect(evaluate) {
    if (!this.isBound) {
      return;
    }
    if (evaluate) {
      let value = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
      this.updateTarget(value);
    }
    this.sourceExpression.connect(this, this.source);
  }
}

export class CallExpression {
  constructor(observerLocator, targetProperty, sourceExpression, lookupFunctions) {
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.lookupFunctions = lookupFunctions;
  }

  createBinding(target) {
    return new Call(
      this.observerLocator,
      this.sourceExpression,
      target,
      this.targetProperty,
      this.lookupFunctions
      );
  }
}

export class Call {
  constructor(observerLocator, sourceExpression, target, targetProperty, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.lookupFunctions = lookupFunctions;
  }

  callSource($event) {
    let overrideContext = this.source.overrideContext;
    Object.assign(overrideContext, $event);
    overrideContext.$event = $event; // deprecate this?
    let mustEvaluate = true;
    let result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
    delete overrideContext.$event;
    for (let prop in $event) {
      delete overrideContext[prop];
    }
    return result;
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this.targetProperty.setValue($event => this.callSource($event));
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    this.targetProperty.setValue(null);
  }
}

export class ValueConverterResource {
  constructor(name) {
    this.name = name;
  }

  static convention(name) {
    if (name.endsWith('ValueConverter')) {
      return new ValueConverterResource(camelCase(name.substring(0, name.length - 14)));
    }
  }

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerValueConverter(name || this.name, this.instance);
  }

  load(container, target) {}
}

export function valueConverter(nameOrTarget) {
  if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
    return function(target) {
      metadata.define(metadata.resource, new ValueConverterResource(nameOrTarget), target);
    };
  }

  metadata.define(metadata.resource, new ValueConverterResource(), nameOrTarget);
}

export class BindingBehaviorResource {
  constructor(name) {
    this.name = name;
  }

  static convention(name) {
    if (name.endsWith('BindingBehavior')) {
      return new BindingBehaviorResource(camelCase(name.substring(0, name.length - 15)));
    }
  }

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerBindingBehavior(name || this.name, this.instance);
  }

  load(container, target) {}
}

export function bindingBehavior(nameOrTarget) {
  if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
    return function(target) {
      metadata.define(metadata.resource, new BindingBehaviorResource(nameOrTarget), target);
    };
  }

  metadata.define(metadata.resource, new BindingBehaviorResource(), nameOrTarget);
}

export class ListenerExpression {
  constructor(eventManager, targetEvent, sourceExpression, delegationStrategy, preventDefault, lookupFunctions) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.sourceExpression = sourceExpression;
    this.delegationStrategy = delegationStrategy;
    this.discrete = true;
    this.preventDefault = preventDefault;
    this.lookupFunctions = lookupFunctions;
  }

  createBinding(target) {
    return new Listener(
      this.eventManager,
      this.targetEvent,
      this.delegationStrategy,
      this.sourceExpression,
      target,
      this.preventDefault,
      this.lookupFunctions
      );
  }
}

export class Listener {
  constructor(eventManager, targetEvent, delegationStrategy, sourceExpression, target, preventDefault, lookupFunctions) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.delegationStrategy = delegationStrategy;
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.preventDefault = preventDefault;
    this.lookupFunctions = lookupFunctions;
  }

  callSource(event) {
    let overrideContext = this.source.overrideContext;
    overrideContext.$event = event;
    let mustEvaluate = true;
    let result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
    delete overrideContext.$event;
    if (result !== true && this.preventDefault) {
      event.preventDefault();
    }
    return result;
  }

  handleEvent(event) {
    this.callSource(event);
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this._disposeListener = this.eventManager.addEventListener(
      this.target,
      this.targetEvent,
      this,
      this.delegationStrategy);
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    this._disposeListener();
    this._disposeListener = null;
  }
}

function getAU(element) {
  let au = element.au;

  if (au === undefined) {
    throw new Error(`No Aurelia APIs are defined for the element: "${element.tagName}".`);
  }

  return au;
}

export class NameExpression {
  constructor(sourceExpression, apiName, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.apiName = apiName;
    this.lookupFunctions = lookupFunctions;
    this.discrete = true;
  }

  createBinding(target) {
    return new NameBinder(this.sourceExpression, NameExpression.locateAPI(target, this.apiName), this.lookupFunctions);
  }

  static locateAPI(element: Element, apiName: string): Object {
    switch (apiName) {
    case 'element':
      return element;
    case 'controller':
      return getAU(element).controller;
    case 'view-model':
      return getAU(element).controller.viewModel;
    case 'view':
      return getAU(element).controller.view;
    default:
      let target = getAU(element)[apiName];

      if (target === undefined) {
        throw new Error(`Attempted to reference "${apiName}", but it was not found amongst the target's API.`);
      }

      return target.viewModel;
    }
  }
}

class NameBinder {
  constructor(sourceExpression, target, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.lookupFunctions = lookupFunctions;
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;
    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this.sourceExpression.assign(this.source, this.target, this.lookupFunctions);
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.evaluate(this.source, this.lookupFunctions) === this.target) {
      this.sourceExpression.assign(this.source, null, this.lookupFunctions);
    }
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
  }
}

const LookupFunctions = {
  bindingBehaviors: name => null,
  valueConverters: name => null
};

export class BindingEngine {
  static inject = [ObserverLocator, Parser];

  constructor(observerLocator, parser) {
    this.observerLocator = observerLocator;
    this.parser = parser;
  }

  createBindingExpression(targetProperty, sourceExpression, mode = bindingMode.oneWay, lookupFunctions = LookupFunctions) {
    return new BindingExpression(
      this.observerLocator,
      targetProperty,
      this.parser.parse(sourceExpression),
      mode,
      lookupFunctions);
  }

  propertyObserver(obj, propertyName) {
    return {
      subscribe: callback => {
        let observer = this.observerLocator.getObserver(obj, propertyName);
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  }

  collectionObserver(collection) {
    return {
      subscribe: callback => {
        let observer;
        if (collection instanceof Array) {
          observer = this.observerLocator.getArrayObserver(collection);
        } else if (collection instanceof Map) {
          observer = this.observerLocator.getMapObserver(collection);
        } else if (collection instanceof Set) {
          observer = this.observerLocator.getSetObserver(collection);
        }  else {
          throw new Error('collection must be an instance of Array, Map or Set.');
        }
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  }

  expressionObserver(bindingContext, expression) {
    let scope = { bindingContext, overrideContext: createOverrideContext(bindingContext) };
    return new ExpressionObserver(scope, this.parser.parse(expression), this.observerLocator, LookupFunctions);
  }

  parseExpression(expression) {
    return this.parser.parse(expression);
  }

  registerAdapter(adapter) {
    this.observerLocator.addAdapter(adapter);
  }
}

let setProto = Set.prototype;

export function getSetObserver(taskQueue, set) {
  return ModifySetObserver.for(taskQueue, set);
}

class ModifySetObserver extends ModifyCollectionObserver {
  constructor(taskQueue, set) {
    super(taskQueue, set);
  }

  /**
   * Searches for observer or creates a new one associated with given set instance
   * @param taskQueue
   * @param set instance for which observer is searched
   * @returns ModifySetObserver always the same instance for any given set instance
   */
  static for(taskQueue, set) {
    if (!('__set_observer__' in set)) {
      Reflect.defineProperty(set, '__set_observer__', {
        value: ModifySetObserver.create(taskQueue, set),
        enumerable: false, configurable: false
      });
    }
    return set.__set_observer__;
  }

  static create(taskQueue, set) {
    let observer = new ModifySetObserver(taskQueue, set);

    let proto = setProto;
    if (proto.add !== set.add || proto.delete !== set.delete || proto.clear !== set.clear) {
      proto = {
        add: set.add,
        delete: set.delete,
        clear: set.clear
      };
    }

    set.add = function() {
      let type = 'add';
      let oldSize = set.size;
      let methodCallResult = proto.add.apply(set, arguments);
      let hasValue = set.size === oldSize;
      if (!hasValue) {
        observer.addChangeRecord({
          type: type,
          object: set,
          value: Array.from(set).pop()
        });
      }
      return methodCallResult;
    };

    set.delete = function() {
      let hasValue = set.has(arguments[0]);
      let methodCallResult = proto.delete.apply(set, arguments);
      if (hasValue) {
        observer.addChangeRecord({
          type: 'delete',
          object: set,
          value: arguments[0]
        });
      }
      return methodCallResult;
    };

    set.clear = function() {
      let methodCallResult = proto.clear.apply(set, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: set
      });
      return methodCallResult;
    };

    return observer;
  }
}

export function observable(targetOrConfig: any, key: string, descriptor?: PropertyDescriptor) {
  function deco(target, key, descriptor, config) { // eslint-disable-line no-shadow
    // class decorator?
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
        innerPropertyDescriptor.value = descriptor.initializer();
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
      if (newValue === oldValue) {
        return;
      }

      // Add the inner property on the instance and make it nonenumerable.
      this[innerPropertyName] = newValue;
      Reflect.defineProperty(this, innerPropertyName, { enumerable: false });

      if (this[callbackName]) {
        this[callbackName](newValue, oldValue, key);
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
