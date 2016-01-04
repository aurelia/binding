import 'core-js';
import {PLATFORM,DOM} from 'aurelia-pal';
import {TaskQueue} from 'aurelia-task-queue';
import {metadata} from 'aurelia-metadata';

export function camelCase(name) {
  return name.charAt(0).toLowerCase() + name.slice(1);
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
    }
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
  while (i-- && this[slotNames[i]] !== observer) {}

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
  }
}

const bindings = new Map();    // the connect queue
const minimumImmediate = 100;  // number of bindings we should connect immediately before resorting to queueing
const frameBudget = 15;        // milliseconds allotted to each frame for flushing queue

let isFlushRequested = false;  // whether a flush of the connect queue has been requested
let immediate = 0;             // count of bindings that have been immediately connected

function flush(animationFrameStart) {
  let i = 0;
  for (let [binding] of bindings) {
    bindings.delete(binding);
    binding.connect(true);
    i++;
    // periodically check whether the frame budget has been hit.
    // this ensures we don't call performance.now a lot and prevents starving the connect queue.
    if (i % 100 === 0 && PLATFORM.performance.now() - animationFrameStart > frameBudget) {
      break;
    }
  }

  if (bindings.size) {
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
    bindings.set(binding);
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
  let rest = this._contextsRest;
  let index;
  if (!rest || !rest.length || (index = rest.indexOf(context)) === -1 || this._callablesRest[index] !== callable) {
    return false;
  }
  rest.splice(index, 1);
  this._callablesRest.splice(index, 1);
  return true;
}

let tempContextsRest = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
let tempCallablesRest = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

function callSubscribers(newValue, oldValue) {
  let context0 = this._context0;
  let callable0 = this._callable0;
  let context1 = this._context1;
  let callable1 = this._callable1;
  let context2 = this._context2;
  let callable2 = this._callable2;
  let length = !this._contextsRest ? 0 : this._contextsRest.length;
  let i = length;
  if (length) {
    while(i--) {
      tempContextsRest[i] = this._contextsRest[i];
      tempCallablesRest[i] = this._callablesRest[i];
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
  for (i = 0; i < length; i++) {
    let callable = tempCallablesRest[i];
    let context = tempContextsRest[i]
    if (callable) {
      callable.call(context, newValue, oldValue);
    } else {
      context(newValue, oldValue);
    }
    tempContextsRest[i] = null;
    tempCallablesRest[i] = null;
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
  if (!contexts || (index = contexts.length) === 0) {
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
    var rowCount = oldEnd - oldStart + 1;
    var columnCount = currentEnd - currentStart + 1;
    var distances = new Array(rowCount);
    var i, j, north, west;

    // "Addition" rows. Initialize null column.
    for (i = 0; i < rowCount; ++i) {
      distances[i] = new Array(columnCount);
      distances[i][0] = i;
    }

    // Initialize null row
    for (j = 0; j < columnCount; ++j){
      distances[0][j] = j;
    }

    for (i = 1; i < rowCount; ++i) {
      for (j = 1; j < columnCount; ++j) {
        if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
          distances[i][j] = distances[i - 1][j - 1];
        else {
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
    var i = distances.length - 1;
    var j = distances[0].length - 1;
    var current = distances[i][j];
    var edits = [];
    while (i > 0 || j > 0) {
      if (i == 0) {
        edits.push(EDIT_ADD);
        j--;
        continue;
      }
      if (j == 0) {
        edits.push(EDIT_DELETE);
        i--;
        continue;
      }
      var northWest = distances[i - 1][j - 1];
      var west = distances[i - 1][j];
      var north = distances[i][j - 1];

      var min;
      if (west < north)
        min = west < northWest ? west : northWest;
      else
        min = north < northWest ? north : northWest;

      if (min == northWest) {
        if (northWest == current) {
          edits.push(EDIT_LEAVE);
        } else {
          edits.push(EDIT_UPDATE);
          current = northWest;
        }
        i--;
        j--;
      } else if (min == west) {
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
    var prefixCount = 0;
    var suffixCount = 0;

    var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
    if (currentStart == 0 && oldStart == 0)
      prefixCount = this.sharedPrefix(current, old, minLength);

    if (currentEnd == current.length && oldEnd == old.length)
      suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);

    currentStart += prefixCount;
    oldStart += prefixCount;
    currentEnd -= suffixCount;
    oldEnd -= suffixCount;

    if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
      return [];

    if (currentStart == currentEnd) {
      var splice = newSplice(currentStart, [], 0);
      while (oldStart < oldEnd)
        splice.removed.push(old[oldStart++]);

      return [ splice ];
    } else if (oldStart == oldEnd)
      return [ newSplice(currentStart, [], currentEnd - currentStart) ];

    var ops = this.spliceOperationsFromEditDistances(
        this.calcEditDistances(current, currentStart, currentEnd,
                               old, oldStart, oldEnd));

    var splice = undefined;
    var splices = [];
    var index = currentStart;
    var oldIndex = oldStart;
    for (var i = 0; i < ops.length; ++i) {
      switch(ops[i]) {
        case EDIT_LEAVE:
          if (splice) {
            splices.push(splice);
            splice = undefined;
          }

          index++;
          oldIndex++;
          break;
        case EDIT_UPDATE:
          if (!splice)
            splice = newSplice(index, [], 0);

          splice.addedCount++;
          index++;

          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
        case EDIT_ADD:
          if (!splice)
            splice = newSplice(index, [], 0);

          splice.addedCount++;
          index++;
          break;
        case EDIT_DELETE:
          if (!splice)
            splice = newSplice(index, [], 0);

          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
      }
    }

    if (splice) {
      splices.push(splice);
    }
    return splices;
  },

  sharedPrefix: function(current, old, searchLength) {
    for (var i = 0; i < searchLength; ++i)
      if (!this.equals(current[i], old[i]))
        return i;
    return searchLength;
  },

  sharedSuffix: function(current, old, searchLength) {
    var index1 = current.length;
    var index2 = old.length;
    var count = 0;
    while (count < searchLength && this.equals(current[--index1], old[--index2]))
      count++;

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

var arraySplice = new ArraySplice();

export function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
  return arraySplice.calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd);
}

function intersect(start1, end1, start2, end2) {
  // Disjoint
  if (end1 < start2 || end2 < start1)
    return -1;

  // Adjacent
  if (end1 == start2 || end2 == start1)
    return 0;

  // Non-zero intersect, span1 first
  if (start1 < start2) {
    if (end1 < end2)
      return end1 - start2; // Overlap
    else
      return end2 - start2; // Contained
  } else {
    // Non-zero intersect, span2 first
    if (end2 < end1)
      return end2 - start1; // Overlap
    else
      return end1 - start1; // Contained
  }
}

export function mergeSplice(splices, index, removed, addedCount) {
  var splice = newSplice(index, removed, addedCount);

  var inserted = false;
  var insertionOffset = 0;

  for (var i = 0; i < splices.length; i++) {
    var current = splices[i];
    current.index += insertionOffset;

    if (inserted)
      continue;

    var intersectCount = intersect(splice.index,
                                   splice.index + splice.removed.length,
                                   current.index,
                                   current.index + current.addedCount);

    if (intersectCount >= 0) {
      // Merge the two splices

      splices.splice(i, 1);
      i--;

      insertionOffset -= current.addedCount - current.removed.length;

      splice.addedCount += current.addedCount - intersectCount;
      var deleteCount = splice.removed.length +
                        current.removed.length - intersectCount;

      if (!splice.addedCount && !deleteCount) {
        // merged splice is a noop. discard.
        inserted = true;
      } else {
        var removed = current.removed;

        if (splice.index < current.index) {
          // some prefix of splice.removed is prepended to current.removed.
          var prepend = splice.removed.slice(0, current.index - splice.index);
          Array.prototype.push.apply(prepend, removed);
          removed = prepend;
        }

        if (splice.index + splice.removed.length > current.index + current.addedCount) {
          // some suffix of splice.removed is appended to current.removed.
          var append = splice.removed.slice(current.index + current.addedCount - splice.index);
          Array.prototype.push.apply(removed, append);
        }

        splice.removed = removed;
        if (current.index < splice.index) {
          splice.index = current.index;
        }
      }
    } else if (splice.index < current.index) {
      // Insert splice here.

      inserted = true;

      splices.splice(i, 0, splice);
      i++;

      var offset = splice.addedCount - splice.removed.length
      current.index += offset;
      insertionOffset += offset;
    }
  }

  if (!inserted)
    splices.push(splice);
}

function createInitialSplices(array, changeRecords) {
  var splices = [];

  for (var i = 0; i < changeRecords.length; i++) {
    var record = changeRecords[i];
    switch(record.type) {
      case 'splice':
        mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
        break;
      case 'add':
      case 'update':
      case 'delete':
        if (!isIndex(record.name))
          continue;
        var index = toNumber(record.name);
        if (index < 0)
          continue;
        mergeSplice(splices, index, [record.oldValue], record.type === 'delete' ? 0 : 1);
        break;
      default:
        console.error('Unexpected record type: ' + JSON.stringify(record));
        break;
    }
  }

  return splices;
}

export function projectArraySplices(array, changeRecords) {
  var splices = [];

  createInitialSplices(array, changeRecords).forEach(function(splice) {
    if (splice.addedCount == 1 && splice.removed.length == 1) {
      if (splice.removed[0] !== array[splice.index])
        splices.push(splice);

      return
    };

    splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
                                         splice.removed, 0, splice.removed.length));
  });

  return splices;
}

function newRecord(type, object, key, oldValue){
  return {
    type: type,
    object: object,
    key: key,
    oldValue: oldValue
  };
}

export function getChangeRecords(map){
  let entries = [];
  for (let key of map.keys()) {
    entries.push(newRecord('added', map, key));
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
    this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
  }

  subscribe(context, callable) {
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }

  addChangeRecord(changeRecord){
    if (!this.hasSubscribers() && !this.lengthObserver) {
      return;
    }

    if (changeRecord.type === 'splice') {
      var index = changeRecord.index;
      var arrayLength = changeRecord.object.length;
      if (index > arrayLength) {
        index = arrayLength - changeRecord.addedCount;
      } else if (index < 0) {
        index = arrayLength + changeRecord.removed.length + index - changeRecord.addedCount;
      }
      if(index < 0){
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
      if (oldCollection){
        // TODO (martingust) we might want to refactor this to a common, independent of collection type, way of getting the records
        if (this.collection instanceof Map) {
          records = getChangeRecords(oldCollection);
        } else {
          //we might need to combine this with existing change records....
          records = calcSplices(this.collection, 0, this.collection.length, oldCollection, 0, oldCollection.length);
        }
      } else {
        if (this.collection instanceof Map) {
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
    this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
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

  call(newValue){
    let oldValue = this.currentValue;
    this.callSubscribers(newValue, oldValue);
    this.currentValue = newValue;
  }
}

var arrayProto = Array.prototype;

export function getArrayObserver(taskQueue, array){
  return ModifyArrayObserver.create(taskQueue, array);
}

class ModifyArrayObserver extends ModifyCollectionObserver {
  constructor(taskQueue, array){
    super(taskQueue, array);
  }

  static create(taskQueue, array){
    var observer = new ModifyArrayObserver(taskQueue, array);

    array['pop'] = function(){
      var methodCallResult = arrayProto['pop'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'delete',
       object: array,
       name: array.length,
       oldValue: methodCallResult
      });
      return methodCallResult;
    }

    array['push'] = function(){
      var methodCallResult = arrayProto['push'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'splice',
       object: array,
       index: array.length - arguments.length,
       removed: [],
       addedCount: arguments.length
      });
      return methodCallResult;
    }

    array['reverse'] = function(){
      observer.flushChangeRecords();
      var oldArray = array.slice();
      var methodCallResult = arrayProto['reverse'].apply(array, arguments);
      observer.reset(oldArray);
      return methodCallResult;
    }

    array['shift'] = function() {
      var methodCallResult = arrayProto['shift'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'delete',
       object: array,
       name: 0,
       oldValue: methodCallResult
      });
      return methodCallResult
    };

    array['sort'] = function() {
      observer.flushChangeRecords();
      var oldArray = array.slice();
      var methodCallResult = arrayProto['sort'].apply(array, arguments);
      observer.reset(oldArray);
      return methodCallResult;
    };

    array['splice'] = function() {
      var methodCallResult = arrayProto['splice'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'splice',
       object: array,
       index: arguments[0],
       removed: methodCallResult,
       addedCount: arguments.length > 2 ? arguments.length - 2 : 0
      });
      return methodCallResult;
    };

    array['unshift'] = function() {
      var methodCallResult = arrayProto['unshift'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'splice',
       object: array,
       index: 0,
       removed: [],
       addedCount: arguments.length
      });
      return methodCallResult;
    };

    return observer;
  }
}

export class Expression {
  constructor(){
    this.isChain = false;
    this.isAssignable = false;
  }

  evaluate(scope: Scope, lookupFunctions: any, args?: any): any {
    throw new Error(`Binding expression "${this}" cannot be evaluated.`);
  }

  assign(scope: Scope, value: any, lookupFunctions: any): any {
    throw new Error(`Binding expression "${this}" cannot be assigned to.`);
  }

  toString(){
    return Unparser.unparse(this);
  }
}

export class Chain extends Expression {
  constructor(expressions){
    super();

    this.expressions = expressions;
    this.isChain = true;
  }

  evaluate(scope, lookupFunctions) {
    var result,
        expressions = this.expressions,
        length = expressions.length,
        i, last;

    for (i = 0; i < length; ++i) {
      last = expressions[i].evaluate(scope, lookupFunctions);

      if (last !== null) {
        result = last;
      }
    }

    return result;
  }

  accept(visitor){
    visitor.visitChain(this);
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
    visitor.visitBindingBehavior(this);
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
  constructor(expression, name, args, allArgs){
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
    this.allArgs = allArgs;
  }

  evaluate(scope, lookupFunctions) {
    var converter = lookupFunctions.valueConverters(this.name);
    if(!converter){
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if('toView' in converter){
      return converter.toView.apply(converter, evalList(scope, this.allArgs, lookupFunctions));
    }

    return this.allArgs[0].evaluate(scope, lookupFunctions);
  }

  assign(scope, value, lookupFunctions){
    var converter = lookupFunctions.valueConverters(this.name);
    if(!converter){
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if('fromView' in converter){
      value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, lookupFunctions)));
    }

    return this.allArgs[0].assign(scope, value, lookupFunctions);
  }

  accept(visitor){
    visitor.visitValueConverter(this);
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
  constructor(target, value){
    super();

    this.target = target;
    this.value = value;
  }

  evaluate(scope, lookupFunctions){
    return this.target.assign(scope, this.value.evaluate(scope, lookupFunctions));
  }

  accept(vistor){
    vistor.visitAssign(this);
  }

  connect(binding, scope) {
  }
}

export class Conditional extends Expression {
  constructor(condition, yes, no){
    super();

    this.condition = condition;
    this.yes = yes;
    this.no = no;
  }

  evaluate(scope, lookupFunctions){
    return (!!this.condition.evaluate(scope)) ? this.yes.evaluate(scope) : this.no.evaluate(scope);
  }

  accept(visitor){
    visitor.visitConditional(this);
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
    visitor.visitAccessThis(this);
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

  assign(scope, value){
    let context = getContextFor(this.name, scope, this.ancestor);
    return context[this.name] = value;
  }

  accept(visitor){
    visitor.visitAccessScope(this);
  }

  connect(binding, scope) {
    let context = getContextFor(this.name, scope, this.ancestor);
    binding.observeProperty(context, this.name);
  }
}

export class AccessMember extends Expression {
  constructor(object, name){
    super();

    this.object = object;
    this.name = name;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions){
    var instance = this.object.evaluate(scope, lookupFunctions);
    return instance === null || instance === undefined ? instance : instance[this.name];
  }

  assign(scope, value){
    var instance = this.object.evaluate(scope);

    if(instance === null || instance === undefined){
      instance = {};
      this.object.assign(scope, instance);
    }

    return instance[this.name] = value;
  }

  accept(visitor){
    visitor.visitAccessMember(this);
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
  constructor(object, key){
    super();

    this.object = object;
    this.key = key;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions){
    var instance = this.object.evaluate(scope, lookupFunctions);
    var lookup = this.key.evaluate(scope, lookupFunctions);
    return getKeyed(instance, lookup);
  }

  assign(scope, value){
    var instance = this.object.evaluate(scope);
    var lookup = this.key.evaluate(scope);
    return setKeyed(instance, lookup, value);
  }

  accept(visitor){
    visitor.visitAccessKeyed(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (obj instanceof Object) {
      this.key.connect(binding, scope);
      let key = this.key.evaluate(scope);
      if (key !== null && key !== undefined) {
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

  accept(visitor){
    visitor.visitCallScope(this);
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
  constructor(object, name, args){
    super();

    this.object = object;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    var instance = this.object.evaluate(scope, lookupFunctions);
    let args = evalList(scope, this.args, lookupFunctions);
    let func = getFunction(instance, this.name, mustEvaluate);
    if (func) {
      return func.apply(instance, args);
    }
    return undefined;
  }

  accept(visitor){
    visitor.visitCallMember(this);
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

  accept(visitor){
    visitor.visitCallFunction(this);
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
  constructor(operation, left, right){
    super();

    this.operation = operation;
    this.left = left;
    this.right = right;
  }

  evaluate(scope, lookupFunctions){
    var left = this.left.evaluate(scope);

    switch (this.operation) {
      case '&&': return left && this.right.evaluate(scope);
      case '||': return left || this.right.evaluate(scope);
    }

    var right = this.right.evaluate(scope);

    switch (this.operation) {
      case '==' : return left == right;
      case '===': return left === right;
      case '!=' : return left != right;
      case '!==': return left !== right;
    }

    // Null check for the operations.
    if (left === null || right === null) {
      switch (this.operation) {
        case '+':
          if (left != null) return left;
          if (right != null) return right;
          return 0;
        case '-':
          if (left != null) return left;
          if (right != null) return 0 - right;
          return 0;
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
    }

    throw new Error(`Internal error [${this.operation}] not handled`);
  }

  accept(visitor){
    visitor.visitBinary(this);
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
  constructor(operation, expression){
    super();

    this.operation = operation;
    this.expression = expression;
  }

  evaluate(scope, lookupFunctions){
    return !this.expression.evaluate(scope);
  }

  accept(visitor){
    visitor.visitPrefix(this);
  }

  connect(binding, scope) {
    this.expression.connect(binding, scope);
  }
}

export class LiteralPrimitive extends Expression {
  constructor(value){
    super();

    this.value = value;
  }

  evaluate(scope, lookupFunctions){
    return this.value;
  }

  accept(visitor){
    visitor.visitLiteralPrimitive(this);
  }

  connect(binding, scope) {
  }
}

export class LiteralString extends Expression {
  constructor(value){
    super();

    this.value = value;
  }

  evaluate(scope, lookupFunctions){
    return this.value;
  }

  accept(visitor){
    visitor.visitLiteralString(this);
  }

  connect(binding, scope) {
  }
}

export class LiteralArray extends Expression {
  constructor(elements){
    super();

    this.elements = elements;
  }

  evaluate(scope, lookupFunctions){
    var elements = this.elements,
        length = elements.length,
        result = [],
        i;

    for(i = 0; i < length; ++i){
      result[i] = elements[i].evaluate(scope, lookupFunctions);
    }

    return result;
  }

  accept(visitor){
    visitor.visitLiteralArray(this);
  }

  connect(binding, scope) {
    let length = this.elements.length;
    for (let i = 0; i < length; i++) {
      this.elements[i].connect(binding, scope);
    }
  }
}

export class LiteralObject extends Expression {
  constructor(keys, values){
    super();

    this.keys = keys;
    this.values = values;
  }

  evaluate(scope, lookupFunctions){
    var instance = {},
        keys = this.keys,
        values = this.values,
        length = keys.length,
        i;

    for(i = 0; i < length; ++i){
      instance[keys[i]] = values[i].evaluate(scope, lookupFunctions);
    }

    return instance;
  }

  accept(visitor){
    visitor.visitLiteralObject(this);
  }

  connect(binding, scope){
    let length = this.keys.length;
    for (let i = 0; i < length; i++) {
      this.values[i].connect(binding, scope);
    }
  }
}

export class Unparser {
  constructor(buffer) {
    this.buffer = buffer;
  }

  static unparse(expression) {
    var buffer = [],
        visitor = new Unparser(buffer);

    expression.accept(visitor);

    return buffer.join('');
  }

  write(text){
    this.buffer.push(text);
  }

  writeArgs(args) {
    var i, length;

    this.write('(');

    for (i = 0, length = args.length; i < length; ++i) {
      if (i !== 0) {
        this.write(',');
      }

      args[i].accept(this);
    }

    this.write(')');
  }

  visitChain(chain) {
    var expressions = chain.expressions,
        length = expressions.length,
        i;

    for (i = 0; i < length; ++i) {
      if (i !== 0) {
        this.write(';');
      }

      expressions[i].accept(this);
    }
  }

  visitBindingBehavior(behavior) {
    var args = behavior.args,
        length = args.length,
        i;

    this.write('(');
    behavior.expression.accept(this);
    this.write(`&${behavior.name}`);

    for (i = 0; i < length; ++i) {
      this.write(' :');
      args[i].accept(this);
    }

    this.write(')');
  }

  visitValueConverter(converter) {
    var args = converter.args,
        length = args.length,
        i;

    this.write('(');
    converter.expression.accept(this);
    this.write(`|${converter.name}`);

    for (i = 0; i < length; ++i) {
      this.write(' :');
      args[i].accept(this);
    }

    this.write(')');
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
    while(i--) {
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
    this.write('(');
    binary.left.accept(this);
    this.write(binary.operation);
    binary.right.accept(this);
    this.write(')');
  }

  visitLiteralPrimitive(literal) {
    this.write(`${literal.value}`);
  }

  visitLiteralArray(literal) {
    var elements = literal.elements,
        length = elements.length,
        i;

    this.write('[');

    for (i = 0; i < length; ++i) {
      if (i !== 0) {
        this.write(',');
      }

      elements[i].accept(this);
    }

    this.write(']');
  }

  visitLiteralObject(literal) {
    var keys = literal.keys,
        values = literal.values,
        length = keys.length,
        i;

    this.write('{');

    for (i = 0; i < length; ++i) {
      if (i !== 0){
        this.write(',');
      }

      this.write(`'${keys[i]}':`);
      values[i].accept(this);
    }

    this.write('}');
  }

  visitLiteralString(literal) {
    var escaped = literal.value.replace(/'/g, "\'");
    this.write(`'${escaped}'`);
  }
}

var evalListCache = [[],[0],[0,0],[0,0,0],[0,0,0,0],[0,0,0,0,0]];

/// Evaluate the [list] in context of the [scope].
function evalList(scope, list, lookupFunctions) {
  var length = list.length,
      cacheLength, i;

  for (cacheLength = evalListCache.length; cacheLength <= length; ++cacheLength) {
    evalListCache.push([]);
  }

  var result = evalListCache[length];

  for (i = 0; i < length; ++i) {
    result[i] = list[i].evaluate(scope, lookupFunctions);
  }

  return result;
}

/// Add the two arguments with automatic type conversion.
function autoConvertAdd(a, b) {
  if (a != null && b != null) {
    // TODO(deboer): Support others.
    if (typeof a == 'string' && typeof b != 'string') {
      return a + b.toString();
    }

    if (typeof a != 'string' && typeof b == 'string') {
      return a.toString() + b;
    }

    return a + b;
  }

  if (a != null) {
    return a;
  }

  if (b != null) {
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
    return obj[parseInt(key)];
  } else if (obj) {
    return obj[key];
  } else if (obj === null || obj === undefined) {
    return undefined;
  } else {
    return obj[key];
  }
}

function setKeyed(obj, key, value) {
  if (Array.isArray(obj)) {
    var index = parseInt(key);

    if (obj.length <= index) {
      obj.length = index + 1;
    }

    obj[index] = value;
  } else {
    obj[key] = value;
  }

  return value;
}

export const bindingMode = {
  oneTime: 0,
  oneWay: 1,
  twoWay: 2
};

export class Token {
  constructor(index, text){
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
      } else {
        this.peek = this.input.charCodeAt(this.index);
      }
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
        while (isWhitespace(this.peek)){
          this.advance();
        }

        return this.scanToken();
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

    assert(OPERATORS.indexOf(text) != -1);

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

    while (true) {
      if (isDigit(this.peek)) {
        // Do nothing.
      } else if (this.peek === $PERIOD) {
        simple = false;
      } else if (isExponentStart(this.peek)) {
        this.advance();

        if (isExponentSign(this.peek)){
          this.advance();
        }

        if (!isDigit(this.peek)){
          this.error('Invalid exponent', -1);
        }

        simple = false;
      } else {
        break;
      }

      this.advance();
    }

    let text = this.input.substring(start, this.index);
    let value = simple ? parseInt(text) : parseFloat(text);
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

          if(!/[A-Z0-9]{4}/.test(hex)){
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

    if (buffer != null) {
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
  '?',
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
  switch(code) {
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
    throw message || "Assertion failed";
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

    while (true) {
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

    while (true) {
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

    while (true) {
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

    while (true) {
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
    } else {
      return this.parseAccessOrCallMember();
    }
  }

  parseAccessOrCallMember() {
    let result = this.parsePrimary();

    while (true) {
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
    } else if (this.peek.text == '{') {
      return this.parseObject();
    } else if (this.peek.key != null) {
      return this.parseAccessOrCallScope();
    } else if (this.peek.value != null) {
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
      } else if (this.peek === EOF || this.peek.text === '(' || this.peek.text === '[' || this.peek.text === '}') {
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
        let value = this.peek.value;
        keys.push(typeof value === 'string' ? value : this.peek.text);

        this.advance();
        this.expect(':');

        values.push(this.parseExpression());
      } while (this.optional(','));
    }

    this.expect('}');

    return new LiteralObject(keys, values);
  }

  parseExpressionList(terminator) {
    let result = [];

    if (this.peek.text != terminator) {
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

  advance(){
    this.index++;
  }

  error(message) {
    let location = (this.index < this.tokens.length)
        ? `at column ${this.tokens[this.index].index + 1} in`
        : `at the end of the expression`;

    throw new Error(`Parser Error: ${message} ${location} [${this.input}]`);
  }
}

let mapProto = Map.prototype;

export function getMapObserver(taskQueue, map){
  return ModifyMapObserver.create(taskQueue, map);
}

class ModifyMapObserver extends ModifyCollectionObserver {
  constructor(taskQueue, map){
    super(taskQueue, map);
  }

  static create(taskQueue, map) {
    let observer = new ModifyMapObserver(taskQueue, map);

    map['set'] = function () {
      let oldValue = map.get(arguments[0]);
      let type = typeof oldValue !== 'undefined' ? 'update' : 'add';
      let methodCallResult = mapProto['set'].apply(map, arguments);
      observer.addChangeRecord({
        type: type,
        object: map,
        key: arguments[0],
        oldValue: oldValue
      });
      return methodCallResult;
    }

    map['delete'] = function () {
      let oldValue = map.get(arguments[0]);
      let methodCallResult = mapProto['delete'].apply(map, arguments);
      observer.addChangeRecord({
        type: 'delete',
        object: map,
        key: arguments[0],
        oldValue: oldValue
      });
      return methodCallResult;
    }

    map['clear'] = function () {
      let methodCallResult = mapProto['clear'].apply(map, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: map
      });
      return methodCallResult;
    }

    return observer;
  }
}

//Note: path and deepPath are designed to handle v0 and v1 shadow dom specs respectively
function findOriginalEventTarget(event) {
  return (event.path && event.path[0]) || (event.deepPath && event.deepPath[0]) || event.target;
}

function handleDelegatedEvent(event) {
  let target = findOriginalEventTarget(event);
  let callback;

  while (target && !callback) {
    if (target.delegatedCallbacks) {
      callback = target.delegatedCallbacks[event.type];
    }

    if (!callback) {
      target = target.parentNode;
    }
  }

  if (callback) {
    callback(event);
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
  delegatedHandlers = [];

  subscribe(target, targetEvent, callback, delegate) {
    if (delegate) {
      let delegatedHandlers = this.delegatedHandlers;
      let handlerEntry = delegatedHandlers[targetEvent] || (delegatedHandlers[targetEvent] = new DelegateHandlerEntry(targetEvent));
      let delegatedCallbacks = target.delegatedCallbacks || (target.delegatedCallbacks = {});

      handlerEntry.increment();
      delegatedCallbacks[targetEvent] = callback;

      return function() {
        handlerEntry.decrement();
        delegatedCallbacks[targetEvent] = null;
      };
    } else {
      target.addEventListener(targetEvent, callback, false);

      return function() {
        target.removeEventListener(targetEvent, callback);
      };
    }
  }
}

export class EventManager {
  constructor() {
    this.elementHandlerLookup = {};
    this.eventStrategyLookup = {};

    this.registerElementConfig({
      tagName:'input',
      properties: {
        value:['change','input'],
        checked:['change','input'],
        files:['change','input']
      }
    });

    this.registerElementConfig({
      tagName:'textarea',
      properties:{
        value:['change','input']
      }
    });

    this.registerElementConfig({
      tagName:'select',
      properties:{
        value:['change']
      }
    });

    this.registerElementConfig({
      tagName:'content editable',
      properties: {
        value:['change','input','blur','keyup','paste'],
      }
    });

    this.registerElementConfig({
      tagName:'scrollable element',
      properties: {
        scrollTop:['scroll'],
        scrollLeft:['scroll']
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
        }
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

    if(target.tagName) {
      tagName = target.tagName.toLowerCase();

      if(lookup[tagName] && lookup[tagName][propertyName]) {
        return lookup[tagName][propertyName];
      }

      if (propertyName === 'textContent' || propertyName === 'innerHTML') {
        return lookup['content editable']['value'];
      }

      if (propertyName === 'scrollTop' || propertyName === 'scrollLeft') {
        return lookup['scrollable element'][propertyName];
      }
    }

    return null;
  }

  addEventListener(target, targetEvent, callback, delegate) {
    return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy)
      .subscribe(target, targetEvent, callback, delegate);
  }
}

export class DirtyChecker {
  constructor(){
    this.tracked = [];
    this.checkDelay = 120;
  }

  addProperty(property){
    var tracked = this.tracked;

    tracked.push(property);

    if(tracked.length === 1) {
      this.scheduleDirtyCheck();
    }
  }

  removeProperty(property){
    var tracked = this.tracked;
    tracked.splice(tracked.indexOf(property), 1);
  }

  scheduleDirtyCheck(){
    setTimeout(() => this.check(), this.checkDelay);
  }

  check() {
    var tracked = this.tracked,
        i = tracked.length;

    while(i--) {
      var current = tracked[i];

      if(current.isDirty()){
        current.call();
      }
    }

    if(tracked.length) {
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

export const propertyAccessor = {
  getValue: (obj, propertyName) => obj[propertyName],
  setValue: (value, obj, propertyName) => obj[propertyName] = value
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
  constructor(taskQueue, obj, propertyName){
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

    if(oldValue !== newValue){
      if(!this.queued){
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
    if(!this.observing) {
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

    try{
      Object.defineProperty(this.obj, this.propertyName, {
        configurable: true,
        enumerable: true,
        get: this.getValue.bind(this),
        set: this.setValue.bind(this)
      });
    }catch(_){}
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
    this.element[this.propertyName] =
      (newValue === undefined || newValue === null) ? '' : newValue;

    this.notify();
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
    var nameIndex = this.nameIndex || {},
        version = this.version,
        names, name;

    // Add the classes, tracking the version at which they were added.
    if (newValue !== null && newValue !== undefined && newValue.length) {
      names = newValue.split(' ');
      for(let i = 0, length = names.length; i < length; i++) {
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
    for(name in nameIndex) {
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

const computedContext = 'ComputedPropertyObserver';

@subscriberCollection()
export class ComputedPropertyObserver {
  constructor(obj, propertyName, descriptor, observerLocator) {
    this.obj = obj;
    this.propertyName = propertyName;
    this.descriptor = descriptor;
    this.observerLocator = observerLocator;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    this.obj[this.propertyName] = newValue;
  }

  call(context) {
    let newValue = this.getValue();
    if (this.oldValue === newValue)
      return;
    this.callSubscribers(newValue, this.oldValue);
    this.oldValue = newValue;
    return;
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.getValue();

      let dependencies = this.descriptor.get.dependencies;
      this.observers = [];
      for (let i = 0, ii = dependencies.length; i < ii; i++) {
        let observer = this.observerLocator.getObserver(this.obj, dependencies[i]);
        // todo:  consider throwing when a dependency's observer is an instance of DirtyCheckProperty.
        this.observers.push(observer);
        observer.subscribe(computedContext, this);
      }
    }

    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.oldValue = undefined;

      let i = this.observers.length;
      while(i--) {
        this.observers[i].unsubscribe(computedContext, this);
      }
      this.observers = null;
    }
  }
}

export function hasDeclaredDependencies(descriptor) {
  return descriptor && descriptor.get && descriptor.get.dependencies && descriptor.get.dependencies.length > 0;
}

export function declarePropertyDependencies(ctor, propertyName, dependencies) {
  let descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
  descriptor.get.dependencies = dependencies;
}

export function computedFrom(...rest){
  return function(target, key, descriptor){
    descriptor.get.dependencies = rest;
    return descriptor;
  }
}

export const elements = {
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

export const presentationElements = {
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
  'use': true,
};

export const presentationAttributes = {
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
  'writing-mode': true,
};

// SVG elements/attributes are case-sensitive.  Not all browsers use the same casing for all attributes.
function createElement(html) {
  let div = DOM.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

export class SVGAnalyzer {
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
}

export class ObserverLocator {
  static inject = [TaskQueue, EventManager, DirtyChecker, SVGAnalyzer];

  constructor(taskQueue, eventManager, dirtyChecker, svgAnalyzer) {
    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
    this.svgAnalyzer = svgAnalyzer;
    this.adapters = [];
  }

  getObserver(obj, propertyName) {
    let observersLookup = obj.__observers__;
    let observer;

    if (observersLookup && propertyName in observersLookup) {
      return observersLookup[propertyName];
    }

    observer = this.createPropertyObserver(obj, propertyName);

    if (!observer.doNotCache) {
      if (observersLookup === undefined){
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

    try{
      Object.defineProperty(obj, "__observers__", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: value
      });
    }catch(_){}

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
    let observerLookup;
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
      if (propertyName ==='checked' && obj.tagName.toLowerCase() === 'input') {
        return new CheckedObserver(obj, handler, this);
      }
      if (handler) {
        return new ValueAttributeObserver(obj, propertyName, handler);
      }
      xlinkResult = /^xlink:(.+)$/.exec(propertyName);
      if (xlinkResult) {
        return new XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
      }
      if (/^\w+:|^data-|^aria-/.test(propertyName)
        || obj instanceof DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)) {
        return new DataAttributeObserver(obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);

    if (hasDeclaredDependencies(descriptor)) {
      return new ComputedPropertyObserver(obj, propertyName, descriptor, this)
    }

    let existingGetterOrSetter;
    if (descriptor && (existingGetterOrSetter = descriptor.get || descriptor.set)) {
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

    if (obj instanceof Array) {
      if (propertyName === 'length') {
        return this.getArrayObserver(obj).getLengthObserver();
      } else {
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    } else if (obj instanceof Map) {
      if (propertyName === 'size') {
        return this.getMapObserver(obj).getLengthObserver();
      } else {
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }

    return new SetterObserver(this.taskQueue, obj, propertyName);
  }

  getAccessor(obj, propertyName) {
    if (obj instanceof DOM.Element) {
      if (propertyName === 'class'
        || propertyName === 'style' || propertyName === 'css'
        || propertyName === 'value' && obj.tagName.toLowerCase() === 'select'
        || propertyName ==='checked' && obj.tagName.toLowerCase() === 'input'
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

  getArrayObserver(array){
    if ('__array_observer__' in array) {
      return array.__array_observer__;
    }

    return array.__array_observer__ = getArrayObserver(this.taskQueue, array);
  }

  getMapObserver(map){
    if ('__map_observer__' in map) {
      return map.__map_observer__;
    }

    return map.__map_observer__ = getMapObserver(this.taskQueue, map);
  }
}

export class ObjectObservationAdapter {
  getObserver(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement getObserver(object, propertyName).');
  }
}

export class BindingExpression {
  constructor(observerLocator, targetProperty, sourceExpression,
    mode, lookupFunctions, attribute){
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

    let sourceExpression = this.sourceExpression;
    if (sourceExpression.bind) {
      sourceExpression.bind(this, source, this.lookupFunctions);
    }

    let mode = this.mode;
    if (!this.targetObserver) {
      let method = mode === bindingMode.twoWay ? 'getObserver' : 'getAccessor';
      this.targetObserver = this.observerLocator[method](this.target, this.targetProperty);
    }

    if ('bind' in this.targetObserver) {
      this.targetObserver.bind();
    }
    let value = sourceExpression.evaluate(source, this.lookupFunctions);
    this.updateTarget(value);

    if (mode === bindingMode.oneWay) {
      enqueueBindingConnect(this);
    } else if (mode === bindingMode.twoWay) {
      sourceExpression.connect(this, source);
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
    this.sourceExpression = sourceExpression
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

    let sourceExpression = this.sourceExpression;
    if (sourceExpression.bind) {
      sourceExpression.bind(this, source, this.lookupFunctions);
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
  constructor(name){
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

export function valueConverter(nameOrTarget){
  if(nameOrTarget === undefined || typeof nameOrTarget === 'string'){
    return function(target){
      metadata.define(metadata.resource, new ValueConverterResource(nameOrTarget), target);
    }
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

export function bindingBehavior(nameOrTarget){
  if(nameOrTarget === undefined || typeof nameOrTarget === 'string'){
    return function(target){
      metadata.define(metadata.resource, new BindingBehaviorResource(nameOrTarget), target);
    }
  }

  metadata.define(metadata.resource, new BindingBehaviorResource(), nameOrTarget);
}

export class ListenerExpression {
  constructor(eventManager, targetEvent, sourceExpression, delegate, preventDefault, lookupFunctions) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.sourceExpression = sourceExpression;
    this.delegate = delegate;
    this.discrete = true;
    this.preventDefault = preventDefault;
    this.lookupFunctions = lookupFunctions;
  }

  createBinding(target) {
    return new Listener(
      this.eventManager,
      this.targetEvent,
      this.delegate,
      this.sourceExpression,
      target,
      this.preventDefault,
      this.lookupFunctions
      );
  }
}

export class Listener {
  constructor(eventManager, targetEvent, delegate, sourceExpression, target, preventDefault, lookupFunctions) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.delegate = delegate;
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

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    let sourceExpression = this.sourceExpression;
    if (sourceExpression.bind) {
      sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this._disposeListener = this.eventManager.addEventListener(
      this.target,
      this.targetEvent,
      event => this.callSource(event),
      this.delegate);
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
    throw new Error('No Aurelia APIs are defined for the referenced element.');
  }

  return au;
}

export class NameExpression {
  constructor(property, apiName) {
    this.property = property;
    this.apiName = apiName;
    this.discrete = true;
  }

  createBinding(target) {
    return new NameBinder(this.property, NameExpression.locateAPI(target, this.apiName));
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
          throw new Error(`Attempted to reference "${apiName}", but it was not found amongst the target's API.`)
        }

        return target.viewModel;
    }
  }
}

class NameBinder {
  constructor(property, target) {
    this.property = property;
    this.target = target;
    this.source = null;
    this.context = null;
  }

  bind(source) {
    if (this.source !== null) {
      if (this.source === source) {
        return;
      }

      this.unbind();
    }

    this.source = source || null;
    this.context = source.bindingContext || source.overrideContext || null;

    if(this.context !== null) {
      this.context[this.property] = this.target;
    }
  }

  unbind() {
    if (this.source !== null) {
      this.source = null;
    }

    if(this.context !== null) {
      this.context[this.property] = null;
    }
  }
}

interface Disposable {
  dispose(): void;
}

interface PropertyObserver {
  subscribe(callback: (newValue: any, oldValue: any) => void): Disposable;
}

interface CollectionObserver {
  subscribe(callback: (changeRecords: any) => void): Disposable;
}

interface LookupFunctions {
  bindingBehaviors(name: string): any;
  valueConverters(name: string): any;
}

const lookupFunctions = {
  bindingBehaviors: name => null,
  valueConverters: name => null
};

export class BindingEngine {
  static inject = [ObserverLocator, Parser];

  constructor(observerLocator, parser) {
    this.observerLocator = observerLocator;
    this.parser = parser;
  }

  createBindingExpression(targetProperty: string, sourceExpression: string, mode = bindingMode.oneWay, lookupFunctions?: LookupFunctions = lookupFunctions): BindingExpression {
    return new BindingExpression(
      this.observerLocator,
      targetProperty,
      this.parser.parse(sourceExpression),
      mode,
      lookupFunctions);
  }

  propertyObserver(obj: Object, propertyName: string): PropertyObserver {
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

  collectionObserver(collection: Array<any>|Map<any, any>): CollectionObserver {
    return {
      subscribe: callback => {
        let observer;
        if (collection instanceof Array) {
          observer = this.observerLocator.getArrayObserver(collection);
        } else if (collection instanceof Map) {
          observer = this.observerLocator.getMapObserver(collection);
        } else {
          throw new Error('collection must be an instance of Array or Map.');
        }
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  }

  expressionObserver(bindingContext: any, expression: string): PropertyObserver {
    let scope = { bindingContext, overrideContext: createOverrideContext(bindingContext) };
    return new ExpressionObserver(scope, this.parser.parse(expression), this.observerLocator);
  }

  parseExpression(expression: string): Expression {
    return this.parser.parse(expression);
  }

  registerAdapter(adapter: ObjectObservationAdapter): void {
    this.observerLocator.addAdapter(adapter);
  }
}

@connectable()
@subscriberCollection()
class ExpressionObserver {
  constructor(scope, expression, observerLocator) {
    this.scope = scope;
    this.expression = expression;
    this.observerLocator = observerLocator;
  }

  subscribe(callback) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.expression.evaluate(this.scope, lookupFunctions);
      this.expression.connect(this, this.scope);
    }
    this.addSubscriber(callback);
    return {
      dispose: () => {
        if (this.removeSubscriber(callback) && !this.hasSubscribers()) {
          this.unobserve(true);
        }
      }
    }
  }

  call() {
    let newValue = this.expression.evaluate(this.scope, lookupFunctions);
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
