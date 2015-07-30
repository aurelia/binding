import core from 'core-js';
import {TaskQueue} from 'aurelia-task-queue';
import {All,Container} from 'aurelia-dependency-injection';
import {Decorators,Metadata} from 'aurelia-metadata';

export class AccessKeyedObserver {
  constructor(objectInfo, keyInfo, observerLocator, evaluate) {
    this.objectInfo = objectInfo;
    this.keyInfo = keyInfo;
    this.evaluate = evaluate;
    this.observerLocator = observerLocator;

    if (keyInfo.observer) {
      this.disposeKey = keyInfo.observer.subscribe(newValue => this.objectOrKeyChanged(undefined, newValue));
    }

    if (objectInfo.observer) {
      this.disposeObject = objectInfo.observer.subscribe(newValue => this.objectOrKeyChanged(newValue));
    }

    this.updatePropertySubscription(objectInfo.value, keyInfo.value);
  }

  updatePropertySubscription(object, key) {
    var callback;
    if (this.disposeProperty) {
      this.disposeProperty();
      this.disposeProperty = null;
    }
    if (object instanceof Object) {  // objects, arrays, etc - (non primitives)
      this.disposeProperty = this.observerLocator.getObserver(object, key)
        .subscribe(() => this.notify());
    }
  }

  objectOrKeyChanged(object, key) {
    var oo, ko;
    object = object || ((oo = this.objectInfo.observer) && oo.getValue ? oo.getValue() : this.objectInfo.value);
    key = key || ((ko = this.keyInfo.observer) && ko.getValue ? ko.getValue() : this.keyInfo.value);
    this.updatePropertySubscription(object, key);

    this.notify();
  }

  subscribe(callback) {
    var that = this;
    that.callback = callback;
    return function() {
      that.callback = null;
    };
  }

  notify() {
    var callback = this.callback;

    if(callback){
      callback(this.evaluate());
    }
  }

  dispose() {
    this.objectInfo = null;
    this.keyInfo = null;
    this.evaluate = null;
    this.observerLocator = null;
    if (this.disposeObject) {
      this.disposeObject();
    }
    if (this.disposeKey) {
      this.disposeKey();
    }
    if (this.disposeProperty) {
      this.disposeProperty();
    }
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

var EDIT_LEAVE = 0;
var EDIT_UPDATE = 1;
var EDIT_ADD = 2;
var EDIT_DELETE = 3;

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

function mergeSplice(splices, index, removed, addedCount) {
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

export var hasObjectObserve = (function detectObjectObserve() {
  if (typeof Object.observe !== 'function') {
    return false;
  }

  var records = [];

  function callback(recs) {
    records = recs;
  }

  var test = {};
  Object.observe(test, callback);
  test.id = 1;
  test.id = 2;
  delete test.id;

  Object.deliverChangeRecords(callback);
  if (records.length !== 3)
    return false;

  if (records[0].type != 'add' ||
      records[1].type != 'update' ||
      records[2].type != 'delete') {
    return false;
  }

  Object.unobserve(test, callback);

  return true;
})();

export var hasArrayObserve = (function detectArrayObserve() {
  if (typeof Array.observe !== 'function') {
    return false;
  }

  var records = [];

  function callback(recs) {
    records = recs;
  }

  var arr = [];
  Array.observe(arr, callback);
  arr.push(1, 2);
  arr.length = 0;

  Object.deliverChangeRecords(callback);
  if (records.length !== 2)
    return false;

  if (records[0].type != 'splice' ||
      records[1].type != 'splice') {
    return false;
  }

  Array.unobserve(arr, callback);

  return true;
})();

function newRecord(type, object, key, oldValue){
  return {
    type: type,
    object: object,
    key: key,
    oldValue: oldValue
  };
}

export function getChangeRecords(map){
  var entries = [];
  for(var key of map.keys()){
    entries.push(newRecord('added', map, key));
  }
  return entries;
}

export class ModifyCollectionObserver {

  constructor(taskQueue, collection){
    this.taskQueue = taskQueue;
    this.queued = false;
    this.callbacks = [];
    this.changeRecords = [];
    this.oldCollection = null;
    this.collection = collection;
    this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);
    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  addChangeRecord(changeRecord){
    if(this.callbacks.length === 0 && !this.lengthObserver){
      return;
    }

    this.changeRecords.push(changeRecord);

    if(!this.queued){
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  reset(oldCollection){
    if(!this.callbacks.length){
      return;
    }

    this.oldCollection = oldCollection;

    if(!this.queued){
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  getLengthObserver(){
    return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection));
  }

  call(){
    var callbacks = this.callbacks,
      i = callbacks.length,
      changeRecords = this.changeRecords,
      oldCollection = this.oldCollection,
      records;

    this.queued = false;
    this.changeRecords = [];
    this.oldCollection = null;

    if(i){
      if(oldCollection){
        // TODO (martingust) we might want to refactor this to a common, independent of collection type, way of getting the records
        if(this.collection instanceof Map){
          records = getChangeRecords(oldCollection);
        }else {
          //we might need to combine this with existing change records....
          records = calcSplices(this.collection, 0, this.collection.length, oldCollection, 0, oldCollection.length);
        }
      }else{
        if(this.collection instanceof Map){
          records = changeRecords;
        }else {
          records = projectArraySplices(this.collection, changeRecords);
        }
      }

      while(i--) {
        callbacks[i](records);
      }
    }

    if(this.lengthObserver){
      this.lengthObserver.call(this.collection[this.lengthPropertyName]);
    }
  }
}

export class CollectionLengthObserver {
  constructor(collection){
    this.collection = collection;
    this.callbacks = [];
    this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
    this.currentValue = collection[this.lengthPropertyName];
  }

  getValue(){
    return this.collection[this.lengthPropertyName];
  }

  setValue(newValue){
    this.collection[this.lengthPropertyName] = newValue;
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);
    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  call(newValue){
    var callbacks = this.callbacks,
      i = callbacks.length,
      oldValue = this.currentValue;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }

    this.currentValue = newValue;
  }
}

var arrayProto = Array.prototype;

export function getArrayObserver(taskQueue, array){
  if(hasArrayObserve){
    return new ArrayObserveObserver(array);
  }else{
    return ModifyArrayObserver.create(taskQueue, array);
  }
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

class ArrayObserveObserver {
  constructor(array){
    this.array = array;
    this.callbacks = [];
  }

  subscribe(callback){
    var callbacks = this.callbacks;

    if(callbacks.length === 0){
      this.handler = this.handleChanges.bind(this);
      Array.observe(this.array, this.handler);
    }

    callbacks.push(callback);

    return () => {
      callbacks.splice(callbacks.indexOf(callback), 1);
      if (callbacks.length === 0) {
        Array.unobserve(this.array, this.handler)
      }
    };
  }

  getLengthObserver(){
    return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.array));
  }

  handleChanges(changeRecords){
    var callbacks = this.callbacks,
        i = callbacks.length,
        splices;

    if(i){
      splices = projectArraySplices(this.array, changeRecords);

      while(i--) {
        callbacks[i](splices);
      }
    }

    if(this.lengthObserver){
      this.lengthObserver.call(this.array.length);
    }
  }
}

export class PathObserver {
  constructor(leftObserver, getRightObserver, value){
    this.leftObserver = leftObserver;
    
    this.disposeLeft = leftObserver.subscribe((newValue) => {
      var newRightValue = this.updateRight(getRightObserver(newValue));
      this.notify(newRightValue);
    });

    this.updateRight(getRightObserver(value));
  }

  updateRight(observer){
    this.rightObserver = observer;

    if(this.disposeRight){
      this.disposeRight();
    }

    if(!observer){
      return null;
    }

    this.disposeRight = observer.subscribe(newValue => this.notify(newValue));
    return observer.getValue();
  }

  subscribe(callback){
    var that = this;
    that.callback = callback;
    return function(){
      that.callback = null;
    };
  }

  notify(newValue){
    var callback = this.callback;

    if(callback){
      callback(newValue);
    }
  }

  dispose(){
    if(this.disposeLeft){
      this.disposeLeft();
    }

    if(this.disposeRight){
      this.disposeRight();
    }
  }
}

export class CompositeObserver {
  constructor(observers, evaluate){
    this.subscriptions = new Array(observers.length);
    this.evaluate = evaluate;

    for(var i = 0, ii = observers.length; i < ii; i++){
      this.subscriptions[i] = observers[i].subscribe((newValue) => {
        this.notify(this.evaluate());
      });
    }
  }

  subscribe(callback){
    var that = this;
    that.callback = callback;
    return function(){
      that.callback = null;
    };
  }

  notify(newValue){
    var callback = this.callback;

    if(callback){
      callback(newValue);
    }
  }

  dispose(){
    var subscriptions = this.subscriptions;

    var i = subscriptions.length;
    while(i--) {
      subscriptions[i]();
    }
  }
}

export class Expression {
  constructor(){
    this.isChain = false;
    this.isAssignable = false;
  }

  evaluate(scope: any, valueConverters: any, args?: any): any{
    throw new Error(`Cannot evaluate ${this}`);
  }

  assign(scope: any, value: any, valueConverters: any): any{
    throw new Error(`Cannot assign to ${this}`);
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

  evaluate(scope, valueConverters) {
    var result,
        expressions = this.expressions,
        length = expressions.length,
        i, last;

    for (i = 0; i < length; ++i) {
      last = expressions[i].evaluate(scope, valueConverters);

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

export class ValueConverter extends Expression {
  constructor(expression, name, args, allArgs){
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
    this.allArgs = allArgs;
  }

  evaluate(scope, valueConverters){
    var converter = valueConverters(this.name);
    if(!converter){
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if('toView' in converter){
      return converter.toView.apply(converter, evalList(scope, this.allArgs, valueConverters));
    }

    return this.allArgs[0].evaluate(scope, valueConverters);
  }

  assign(scope, value, valueConverters){
    var converter = valueConverters(this.name);
    if(!converter){
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if('fromView' in converter){
      value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, valueConverters)));
    }

    return this.allArgs[0].assign(scope, value, valueConverters);
  }

  accept(visitor){
    visitor.visitValueConverter(this);
  }

  connect(binding, scope){
    var observer,
        childObservers = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.allArgs.length; i<ii; ++i){
      exp = this.allArgs[i]
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }
}

export class Assign extends Expression {
  constructor(target, value){
    super();

    this.target = target;
    this.value = value;
  }

  evaluate(scope, valueConverters){
    return this.target.assign(scope, this.value.evaluate(scope, valueConverters));
  }

  accept(vistor){
    vistor.visitAssign(this);
  }

  connect(binding, scope){
    return { value: this.evaluate(scope, binding.valueConverterLookupFunction) };
  }
}

export class Conditional extends Expression {
  constructor(condition, yes, no){
    super();

    this.condition = condition;
    this.yes = yes;
    this.no = no;
  }

  evaluate(scope, valueConverters){
    return (!!this.condition.evaluate(scope)) ? this.yes.evaluate(scope) : this.no.evaluate(scope);
  }

  accept(visitor){
    visitor.visitConditional(this);
  }

  connect(binding, scope){
    var conditionInfo = this.condition.connect(binding, scope),
        yesInfo = this.yes.connect(binding, scope),
        noInfo = this.no.connect(binding, scope),
        childObservers = [],
        observer;

    if(conditionInfo.observer){
      childObservers.push(conditionInfo.observer);
    }

    if(yesInfo.observer){
      childObservers.push(yesInfo.observer);
    }

    if(noInfo.observer){
      childObservers.push(noInfo.observer);
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:(!!conditionInfo.value) ? yesInfo.value : noInfo.value,
      observer: observer
    };
  }
}

export class AccessScope extends Expression {
  constructor(name){
    super();

    this.name = name;
    this.isAssignable = true;
  }

  evaluate(scope, valueConverters){
    return scope[this.name];
  }

  assign(scope, value){
    return scope[this.name] = value;
  }

  accept(visitor){
    visitor.visitAccessScope(this);
  }

  connect(binding, scope){
    var observer = binding.getObserver(scope, this.name);

    return {
      value: observer.getValue(),
      observer: observer
    }
  }
}

export class AccessMember extends Expression {
  constructor(object, name){
    super();

    this.object = object;
    this.name = name;
    this.isAssignable = true;
  }

  evaluate(scope, valueConverters){
    var instance = this.object.evaluate(scope, valueConverters);
    return instance === null || instance === undefined
      ? instance
      : instance[this.name];
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

  connect(binding, scope){
    var info = this.object.connect(binding, scope),
        objectInstance = info.value,
        objectObserver = info.observer,
        observer;

    if(objectObserver){
      observer = new PathObserver(
        objectObserver,
        value => {
          if(value == null || value == undefined){
            return value;
          }

          return binding.getObserver(value, this.name)
        },
        objectInstance
        );
    }else{
      observer = binding.getObserver(objectInstance, this.name);
    }

    return {
      value: objectInstance == null ? null : objectInstance[this.name], //TODO: use prop abstraction
      observer: observer
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

  evaluate(scope, valueConverters){
    var instance = this.object.evaluate(scope, valueConverters);
    var lookup = this.key.evaluate(scope, valueConverters);
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

  connect(binding, scope){
    var objectInfo = this.object.connect(binding, scope),
        keyInfo = this.key.connect(binding, scope),
        observer = new AccessKeyedObserver(objectInfo, keyInfo, binding.observerLocator,
          () => this.evaluate(scope, binding.valueConverterLookupFunction));

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }
}

export class CallScope extends Expression {
  constructor(name, args){
    super();

    this.name = name;
    this.args = args;
  }

  evaluate(scope, valueConverters, args){
    args = args || evalList(scope, this.args, valueConverters);
    return ensureFunctionFromMap(scope, this.name).apply(scope, args);
  }

  accept(visitor){
    visitor.visitCallScope(this);
  }

  connect(binding, scope){
    var observer,
        childObservers = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }
}

export class CallMember extends Expression {
  constructor(object, name, args){
    super();

    this.object = object;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, valueConverters, args){
    var instance = this.object.evaluate(scope, valueConverters);
    args = args || evalList(scope, this.args, valueConverters);
    return ensureFunctionFromMap(instance, this.name).apply(instance, args);
  }

  accept(visitor){
    visitor.visitCallMember(this);
  }

  connect(binding, scope){
    var observer,
        objectInfo = this.object.connect(binding, scope),
        childObservers = [],
        i, ii, exp, expInfo;

    if(objectInfo.observer){
      childObservers.push(objectInfo.observer);
    }

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }
}

export class CallFunction extends Expression {
  constructor(func,args){
    super();

    this.func = func;
    this.args = args;
  }

  evaluate(scope, valueConverters, args){
    var func = this.func.evaluate(scope, valueConverters);

    if (typeof func !== 'function') {
      throw new Error(`${this.func} is not a function`);
    } else {
      return func.apply(null, args || evalList(scope, this.args, valueConverters));
    }
  }

  accept(visitor){
    visitor.visitCallFunction(this);
  }

  connect(binding, scope){
    var observer,
        funcInfo = this.func.connect(binding, scope),
        childObservers = [],
        i, ii, exp, expInfo;

    if(funcInfo.observer){
      childObservers.push(funcInfo.observer);
    }

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }
}

export class Binary extends Expression {
  constructor(operation, left, right){
    super();

    this.operation = operation;
    this.left = left;
    this.right = right;
  }

  evaluate(scope, valueConverters){
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
      case '&'  : return left & right;
    }

    throw new Error(`Internal error [${this.operation}] not handled`);
  }

  accept(visitor){
    visitor.visitBinary(this);
  }

  connect(binding, scope){
    var leftInfo = this.left.connect(binding, scope),
        rightInfo = this.right.connect(binding, scope),
        childObservers = [],
        observer;

    if(leftInfo.observer){
      childObservers.push(leftInfo.observer);
    }

    if(rightInfo.observer){
      childObservers.push(rightInfo.observer);
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }
}

export class PrefixNot extends Expression {
  constructor(operation, expression){
    super();

    this.operation = operation;
    this.expression = expression;
  }

  evaluate(scope, valueConverters){
    return !this.expression.evaluate(scope);
  }

  accept(visitor){
    visitor.visitPrefix(this);
  }

  connect(binding, scope){
    var info = this.expression.connect(binding, scope),
        observer;

    if(info.observer){
      observer = new CompositeObserver([info.observer], () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value: !info.value,
      observer: observer
    };
  }
}

export class LiteralPrimitive extends Expression {
  constructor(value){
    super();

    this.value = value;
  }

  evaluate(scope, valueConverters){
    return this.value;
  }

  accept(visitor){
    visitor.visitLiteralPrimitive(this);
  }

  connect(binding, scope){
    return { value:this.value }
  }
}

export class LiteralString extends Expression {
  constructor(value){
    super();

    this.value = value;
  }

  evaluate(scope, valueConverters){
    return this.value;
  }

  accept(visitor){
    visitor.visitLiteralString(this);
  }

  connect(binding, scope){
    return { value:this.value }
  }
}

export class LiteralArray extends Expression {
  constructor(elements){
    super();

    this.elements = elements;
  }

  evaluate(scope, valueConverters){
    var elements = this.elements,
        length = elements.length,
        result = [],
        i;

    for(i = 0; i < length; ++i){
      result[i] = elements[i].evaluate(scope, valueConverters);
    }

    return result;
  }

  accept(visitor){
    visitor.visitLiteralArray(this);
  }

  connect(binding, scope) {
    var observer,
        childObservers = [],
        results = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.elements.length; i<ii; ++i){
      exp = this.elements[i];
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }

      results[i] = expInfo.value;
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:results,
      observer:observer
    };
  }
}

export class LiteralObject extends Expression {
  constructor(keys, values){
    super();

    this.keys = keys;
    this.values = values;
  }

  evaluate(scope, valueConverters){
    var instance = {},
        keys = this.keys,
        values = this.values,
        length = keys.length,
        i;

    for(i = 0; i < length; ++i){
      instance[keys[i]] = values[i].evaluate(scope, valueConverters);
    }

    return instance;
  }

  accept(visitor){
    visitor.visitLiteralObject(this);
  }

  connect(binding, scope){
    var observer,
        childObservers = [],
        instance = {},
        keys = this.keys,
        values = this.values,
        length = keys.length,
        i, valueInfo;

    for(i = 0; i < length; ++i){
      valueInfo = values[i].connect(binding, scope);

      if(valueInfo.observer){
        childObservers.push(valueInfo.observer);
      }

      instance[keys[i]] = valueInfo.value;
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:instance,
      observer:observer
    };
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

  visitAccessScope(access) {
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
function evalList(scope, list, valueConverters) {
  var length = list.length,
      cacheLength, i;

  for (cacheLength = evalListCache.length; cacheLength <= length; ++cacheLength) {
    evalListCache.push([]);
  }

  var result = evalListCache[length];

  for (i = 0; i < length; ++i) {
    result[i] = list[i].evaluate(scope, valueConverters);
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

function ensureFunctionFromMap(obj, name){
  var func = obj[name];

  if (typeof func === 'function') {
    return func;
  }

  if (func === null) {
    throw new Error(`Undefined function ${name}`);
  } else {
    throw new Error(`${name} is not a function`);
  }
}

function getKeyed(obj, key) {
  if (Array.isArray(obj)) {
    return obj[parseInt(key)];
  } else if (obj) {
    return obj[key];
  } else if (obj === null) {
    throw new Error('Accessing null object');
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

export var bindingMode = {
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
    var scanner = new Scanner(text);
    var tokens = [];
    var token = scanner.scanToken();

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

    var start = this.index;

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

    var character = String.fromCharCode(this.peek);
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

    var text = one;
    
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
    var start = this.index;

    this.advance();

    while (isIdentifierPart(this.peek)) {
      this.advance();
    }

    var text = this.input.substring(start, this.index);
    var result = new Token(start, text);

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
    var simple = (this.index === start);
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

    var text = this.input.substring(start, this.index);
    var value = simple ? parseInt(text) : parseFloat(text);
    return new Token(start, text).withValue(value);
  }

  scanString() {
    assert(this.peek === $SQ || this.peek === $DQ);
    
    var start = this.index;
    var quote = this.peek;

    this.advance();  // Skip initial quote.

    var buffer;
    var marker = this.index;

    while (this.peek !== quote) {
      if (this.peek === $BACKSLASH) {
        if (buffer === null) {
          buffer = [];
        }

        buffer.push(this.input.substring(marker, this.index));
        this.advance();

        var unescaped;

        if (this.peek === $u) {
          // TODO(kasperl): Check bounds? Make sure we have test
          // coverage for this.
          var hex = this.input.substring(this.index + 1, this.index + 5);

          if(!/[A-Z0-9]{4}/.test(hex)){
            this.error(`Invalid unicode escape [\\u${hex}]`);
          }

          unescaped = parseInt(hex, 16);
          
          for (var i = 0; i < 5; ++i) {
            this.advance();
          }
        } else {
          unescaped = decodeURIComponent(this.peek);
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

    var last = this.input.substring(marker, this.index);
    this.advance();  // Skip terminating quote.
    var text = this.input.substring(start, this.index);

    // Compute the unescaped string value.
    var unescaped = last;

    if (buffer != null) {
      buffer.push(last);
      unescaped = buffer.join('');
    }

    return new Token(start, text).withValue(unescaped);
  }

  advance() {
    if (++this.index >= this.length){
      this.peek = $EOF;
    }else {
      this.peek = this.input.charCodeAt(this.index);
    }
  }

  error(message, offset=0) {
    // TODO(kasperl): Try to get rid of the offset. It is only used to match
    // the error expectations in the lexer tests for numbers with exponents.
    var position = this.index + offset;
    throw new Error(`Lexer Error: ${message} at column ${position} in expression [${this.input}]`);
  }
}

var OPERATORS = [
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

var $EOF       = 0;
var $TAB       = 9;
var $LF        = 10;
var $VTAB      = 11;
var $FF        = 12;
var $CR        = 13;
var $SPACE     = 32;
var $BANG      = 33;
var $DQ        = 34;
var $$         = 36;
var $PERCENT   = 37;
var $AMPERSAND = 38;
var $SQ        = 39;
var $LPAREN    = 40;
var $RPAREN    = 41;
var $STAR      = 42;
var $PLUS      = 43;
var $COMMA     = 44;
var $MINUS     = 45;
var $PERIOD    = 46;
var $SLASH     = 47;
var $COLON     = 58;
var $SEMICOLON = 59;
var $LT        = 60;
var $EQ        = 61;
var $GT        = 62;
var $QUESTION  = 63;

var $0 = 48;
var $9 = 57;

var $A = 65;
var $E = 69;
var $Z = 90;

var $LBRACKET  = 91;
var $BACKSLASH = 92;
var $RBRACKET  = 93;
var $CARET     = 94;
var $_         = 95;

var $a = 97;
var $e = 101;
var $f = 102;
var $n = 110;
var $r = 114;
var $t = 116;
var $u = 117;
var $v = 118;
var $z = 122;

var $LBRACE = 123;
var $BAR    = 124;
var $RBRACE = 125;
var $NBSP   = 160;

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

var EOF = new Token(-1, null);

export class Parser {
  constructor(){
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
    var isChain = false,
        expressions = [];

    while (this.optional(';')) {
      isChain = true;
    }

    while (this.index < this.tokens.length) {
      if (this.peek.text === ')' || this.peek.text === '}' || this.peek.text === ']') {
        this.error(`Unconsumed token ${this.peek.text}`);
      }

      var expr = this.parseValueConverter();
      expressions.push(expr);

      while (this.optional(';')) {
        isChain = true;
      }

      if (isChain && expr instanceof ValueConverter) {
        this.error('cannot have a value converter in a chain');
      }
    }

    return (expressions.length === 1) ? expressions[0] : new Chain(expressions);
  }

  parseValueConverter() {
    var result = this.parseExpression();

    while (this.optional('|')) {
      var name = this.peek.text, // TODO(kasperl): Restrict to identifier?
          args = [];

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
    var start = this.peek.index,
        result = this.parseConditional();

    while (this.peek.text === '=') {
      if (!result.isAssignable) {
        var end = (this.index < this.tokens.length) ? this.peek.index : this.input.length;
        var expression = this.input.substring(start, end);

        this.error(`Expression ${expression} is not assignable`);
      }

      this.expect('=');
      result = new Assign(result, this.parseConditional());
    }

    return result;
  }

  parseConditional() {
    var start = this.peek.index,
        result = this.parseLogicalOr();

    if (this.optional('?')) {
      var yes = this.parseExpression();

      if (!this.optional(':')) {
        var end = (this.index < this.tokens.length) ? this.peek.index : this.input.length;
        var expression = this.input.substring(start, end);

        this.error(`Conditional expression ${expression} requires all 3 expressions`);
      }

      var no = this.parseExpression();
      result = new Conditional(result, yes, no);
    }

    return result;
  }

  parseLogicalOr() {
    var result = this.parseLogicalAnd();

    while (this.optional('||')) {
      result = new Binary('||', result, this.parseLogicalAnd());
    }

    return result;
  }

  parseLogicalAnd() {
    var result = this.parseEquality();

    while (this.optional('&&')) {
      result = new Binary('&&', result, this.parseEquality());
    }

    return result;
  }

  parseEquality() {
    var result = this.parseRelational();

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
    var result = this.parseAdditive();

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
    var result = this.parseMultiplicative();

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
    var result = this.parsePrefix();

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
    var result = this.parsePrimary();

    while (true) {
      if (this.optional('.')) {
        var name = this.peek.text; // TODO(kasperl): Check that this is an identifier. Are keywords okay?

        this.advance();

        if (this.optional('(')) {
          var args = this.parseExpressionList(')');
          this.expect(')');
          result = new CallMember(result, name, args);
        } else {
          result = new AccessMember(result, name);
        }
      } else if (this.optional('[')) {
        var key = this.parseExpression();
        this.expect(']');
        result = new AccessKeyed(result, key);
      } else if (this.optional('(')) {
        var args = this.parseExpressionList(')');
        this.expect(')');
        result = new CallFunction(result, args);
      } else {
        return result;
      }
    }
  }

  parsePrimary() {
    if (this.optional('(')) {
      var result = this.parseExpression();
      this.expect(')');
      return result;
    } else if (this.optional('null') || this.optional('undefined')) {
      return new LiteralPrimitive(null);
    } else if (this.optional('true')) {
      return new LiteralPrimitive(true);
    } else if (this.optional('false')) {
      return new LiteralPrimitive(false);
    } else if (this.optional('[')) {
      var elements = this.parseExpressionList(']');
      this.expect(']');
      return new LiteralArray(elements);
    } else if (this.peek.text == '{') {
      return this.parseObject();
    } else if (this.peek.key != null) {
      return this.parseAccessOrCallScope();
    } else if (this.peek.value != null) {
      var value = this.peek.value;
      this.advance();
      return isNaN(value) ? new LiteralString(value) : new LiteralPrimitive(value);
    } else if (this.index >= this.tokens.length) {
      throw new Error(`Unexpected end of expression: ${this.input}`);
    } else {
      this.error(`Unexpected token ${this.peek.text}`);
    }
  }

  parseAccessOrCallScope()  {
    var name = this.peek.key;

    this.advance();

    if (!this.optional('(')) {
      return new AccessScope(name);
    }

    var args = this.parseExpressionList(')');
    this.expect(')');
    return new CallScope(name, args);
  }

  parseObject() {
    var keys = [],
        values = [];

    this.expect('{');

    if (this.peek.text !== '}') {
      do {
        // TODO(kasperl): Stricter checking. Only allow identifiers
        // and strings as keys. Maybe also keywords?
        var value = this.peek.value;
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
    var result = [];

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
    var location = (this.index < this.tokens.length)
        ? `at column ${this.tokens[this.index].index + 1} in`
        : `at the end of the expression`;

    throw new Error(`Parser Error: ${message} ${location} [${this.input}]`);
  }
}

var mapProto = Map.prototype;

export function getMapObserver(taskQueue, map){
  return ModifyMapObserver.create(taskQueue, map);
}

class ModifyMapObserver extends ModifyCollectionObserver {
  constructor(taskQueue, map){
    super(taskQueue, map);
  }

  static create(taskQueue, map) {
    var observer = new ModifyMapObserver(taskQueue, map);

    map['set'] = function () {
      var oldValue = map.get(arguments[0]);
      var type = oldValue ? 'update' : 'add';
      var methodCallResult = mapProto['set'].apply(map, arguments);
      observer.addChangeRecord({
        type: type,
        object: map,
        key: arguments[0],
        oldValue: oldValue
      });
      return methodCallResult;
    }

    map['delete'] = function () {
      var oldValue = map.get(arguments[0]);
      var methodCallResult = mapProto['delete'].apply(map, arguments);
      observer.addChangeRecord({
        type: 'delete',
        object: map,
        key: arguments[0],
        oldValue: oldValue
      });
      return methodCallResult;
    }

    map['clear'] = function () {
      var methodCallResult = mapProto['clear'].apply(map, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: map
      });
      return methodCallResult;
    }

    return observer;
  }
}

function handleDelegatedEvent(event){
  event = event || window.event;
  var target = event.target || event.srcElement,
      callback;

  while(target && !callback) {
    if(target.delegatedCallbacks){
      callback = target.delegatedCallbacks[event.type];
    }

    if(!callback){
      target = target.parentNode;
    }
  }

  if(callback){
    event.stopPropagation();
    callback(event);
  }
}

class DelegateHandlerEntry {
  constructor(boundary, eventName){
    this.boundary = boundary;
    this.eventName = eventName;
    this.count = 0;
  }

  increment(){
    this.count++;

    if(this.count === 1){
      this.boundary.addEventListener(this.eventName, handleDelegatedEvent, false);
    }
  }

  decrement(){
    this.count--;

    if(this.count === 0){
      this.boundary.removeEventListener(this.eventName, handleDelegatedEvent);
    }
  }
}

class DefaultEventStrategy {
  subscribe(target, targetEvent, callback, delegate){
    if(delegate){
      let boundary = target.domBoundary || document,
          delegatedHandlers = boundary.delegatedHandlers || (boundary.delegatedHandlers = {}),
          handlerEntry = delegatedHandlers[targetEvent] || (delegatedHandlers[targetEvent] = new DelegateHandlerEntry(boundary, targetEvent)),
          delegatedCallbacks = target.delegatedCallbacks || (target.delegatedCallbacks = {});

      handlerEntry.increment();
      delegatedCallbacks[targetEvent] = callback;

      return function(){
        handlerEntry.decrement();
        delegatedCallbacks[targetEvent] = null;
      };
    }else{
      target.addEventListener(targetEvent, callback, false);

      return function(){
        target.removeEventListener(targetEvent, callback);
      };
    }
  }
}

export class EventManager {
  constructor(){
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

  registerElementConfig(config){
    var tagName = config.tagName.toLowerCase(), properties = config.properties, propertyName;
    this.elementHandlerLookup[tagName] = {};
    for(propertyName in properties){
      if (properties.hasOwnProperty(propertyName)){
        this.registerElementPropertyConfig(tagName, propertyName, properties[propertyName]);
      }
    }
  }

  registerElementPropertyConfig(tagName, propertyName, events) {
    this.elementHandlerLookup[tagName][propertyName] = {
      subscribe(target, callback) {
        events.forEach(changeEvent => {
          target.addEventListener(changeEvent, callback, false);
        });

        return function(){
          events.forEach(changeEvent => {
            target.removeEventListener(changeEvent, callback);
          });
        }
      }
    }
  }

  registerElementHandler(tagName, handler){
    this.elementHandlerLookup[tagName.toLowerCase()] = handler;
  }

  registerEventStrategy(eventName, strategy){
    this.eventStrategyLookup[eventName] = strategy;
  }

  getElementHandler(target, propertyName){
    var tagName, lookup = this.elementHandlerLookup;
    if(target.tagName){
      tagName = target.tagName.toLowerCase();
      if(lookup[tagName] && lookup[tagName][propertyName]){
        return lookup[tagName][propertyName];
      }
      if (propertyName === 'textContent' || propertyName === 'innerHTML'){
        return lookup['content editable']['value'];
      }
      if (propertyName === 'scrollTop' || propertyName === 'scrollLeft'){
        return lookup['scrollable element'][propertyName];
      }
    }

    return null;
  }

  addEventListener(target, targetEvent, callback, delegate){
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

export class DirtyCheckProperty {
  constructor(dirtyChecker, obj, propertyName){
    this.dirtyChecker = dirtyChecker;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbacks = [];
    this.isSVG = obj instanceof SVGElement;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    if(this.isSVG){
      this.obj.setAttributeNS(null, this.propertyName, newValue);
    }else{
      this.obj[this.propertyName] = newValue;
    }
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.getValue();

    while(i--) {
      callbacks[i](newValue, oldValue);
    }

    this.oldValue = newValue;
  }

  isDirty(){
    return this.oldValue !== this.getValue();
  }

  beginTracking(){
    this.tracking = true;
    this.oldValue = this.newValue = this.getValue();
    this.dirtyChecker.addProperty(this);
  }

  endTracking(){
    this.tracking = false;
    this.dirtyChecker.removeProperty(this);
  }

  subscribe(callback){
    var callbacks = this.callbacks,
        that = this;

    callbacks.push(callback);

    if(!this.tracking){
      this.beginTracking();
    }

    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
      if(callbacks.length === 0){
        that.endTracking();
      }
    };
  }
}

export class SetterObserver {
  constructor(taskQueue, obj, propertyName){
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbacks = [];
    this.queued = false;
    this.observing = false;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    this.obj[this.propertyName] = newValue;
  }

  getterValue(){
    return this.currentValue;
  }

  setterValue(newValue){
    var oldValue = this.currentValue;

    if(oldValue !== newValue){
      if(!this.queued){
        this.oldValue = oldValue;
        this.queued = true;
        this.taskQueue.queueMicroTask(this);
      }

      this.currentValue = newValue;
    }
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.currentValue;

    this.queued = false;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);

    if(!this.observing){
      this.convertProperty();
    }

    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  convertProperty(){
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

export class OoPropertyObserver {
  constructor(obj, propertyName, subscribe){
    this.obj = obj;
    this.propertyName = propertyName;
    this.subscribe = subscribe;
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    this.obj[this.propertyName] = newValue;
  }
}

export class OoObjectObserver {
  constructor(obj, observerLocator){
    this.obj = obj;
    this.observerLocator = observerLocator;
    this.observers = {};
    this.callbacks = {};
    this.callbackCount = 0;
  }

  subscribe(propertyName, callback){
    if (this.callbacks[propertyName]) {
      this.callbacks[propertyName].push(callback);
    } else {
      this.callbacks[propertyName] = [callback];
      this.callbacks[propertyName].oldValue = this.obj[propertyName];
    }

    if (this.callbackCount === 0) {
      this.handler = this.handleChanges.bind(this);
      try {
        Object.observe(this.obj, this.handler, ['update', 'add']);
      } catch(_) {}
    }

    this.callbackCount++;

    return this.unsubscribe.bind(this, propertyName, callback);
  }

  unsubscribe(propertyName, callback) {
    var callbacks = this.callbacks[propertyName],
        index = callbacks.indexOf(callback);
    if (index === -1) {
      return;
    }

    callbacks.splice(index, 1);
    if (callbacks.count = 0) {
      callbacks.oldValue = null;
      this.callbacks[propertyName] = null;
    }

    this.callbackCount--;
    if (this.callbackCount === 0) {
      try {
        Object.unobserve(this.obj, this.handler);
      } catch(_) {}
    }
  }

  getObserver(propertyName, descriptor){
    var propertyObserver = this.observers[propertyName];
    if (!propertyObserver) {
      if (descriptor) {
        propertyObserver = this.observers[propertyName] = new OoPropertyObserver(this.obj, propertyName, this.subscribe.bind(this, propertyName));
      } else {
        propertyObserver = this.observers[propertyName] = new UndefinedPropertyObserver(this, this.obj, propertyName);
      }
    }
    return propertyObserver;
  }

  handleChanges(changes) {
    var properties = {}, i, ii, change, propertyName, oldValue, newValue, callbacks;

    for(i = 0, ii = changes.length; i < ii; i++){
      change = changes[i];
      properties[change.name] = change;
    }

    for(name in properties){
      callbacks = this.callbacks[name];
      if (!callbacks) {
        continue;
      }
      change = properties[name];
      newValue = change.object[name];
      oldValue = change.oldValue;

      for (i = 0, ii = callbacks.length; i < ii; i++) {
        callbacks[i](newValue, oldValue);
      }
    }
  }
}

export class UndefinedPropertyObserver {
  constructor(owner, obj, propertyName){
    this.owner = owner;
    this.obj = obj;
    this.propertyName = propertyName;
    this.callbackMap = new Map();
  }

  getValue(){
    // delegate this to the actual observer if possible.
    if (this.actual){
      return this.actual.getValue();
    }
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    // delegate this to the actual observer if possible.
    if (this.actual){
      this.actual.setValue(newValue);
      return;
    }
    // define the property and trigger the callbacks.
    this.obj[this.propertyName] = newValue;
    this.trigger(newValue, undefined);
  }

  trigger(newValue, oldValue){
    var callback;

    // we only care about this event one time:  when the property becomes defined.
    if (this.subscription){
      this.subscription();
    }

    // get the actual observer.
    this.getObserver();

    // invoke the callbacks.
    for(callback of this.callbackMap.keys()) {
      callback(newValue, oldValue);
    }
  }

  getObserver() {
    var callback, observerLocator;

    // has the property has been defined?
    if (!Object.getOwnPropertyDescriptor(this.obj, this.propertyName)) {
      return;
    }

    // get the actual observer.
    observerLocator = this.owner.observerLocator;
    delete this.owner.observers[this.propertyName];
    delete observerLocator.getOrCreateObserversLookup(this.obj, observerLocator)[this.propertyName];
    this.actual = observerLocator.getObserver(this.obj, this.propertyName);

    // attach any existing callbacks to the actual observer.
    for(callback of this.callbackMap.keys()) {
      this.callbackMap.set(callback, this.actual.subscribe(callback));
    }
  }

  subscribe(callback){
    // attempt to get the actual observer in case the property has become
    // defined since the ObserverLocator returned [this].
    if (!this.actual) {
      this.getObserver();
    }

    // if we have the actual observer, use it.
    if (this.actual){
      return this.actual.subscribe(callback);
    }

    // start listening for the property to become defined.
    if (!this.subscription){
      this.subscription = this.owner.subscribe(this.propertyName, this.trigger.bind(this));
    }

    // cache the callback.
    this.callbackMap.set(callback, null);

    // return the method to dispose the subscription.
    return () => {
      var actualDispose = this.callbackMap.get(callback);
      if (actualDispose)
        actualDispose();
      this.callbackMap.delete(callback);
    };
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

  subscribe(callback) {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
  }
}

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

  subscribe(callback) {
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

  subscribe(callback) {
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

export class ValueAttributeObserver {
  constructor(element, propertyName, handler){
    this.element = element;
    this.propertyName = propertyName;
    this.handler = handler;
    this.callbacks = [];
  }

  getValue() {
    return this.element[this.propertyName];
  }

  setValue(newValue) {
    this.element[this.propertyName] = newValue;
    this.call();
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.getValue();

    while(i--) {
      callbacks[i](newValue, oldValue);
    }

    this.oldValue = newValue;
  }

  subscribe(callback){
    var that = this;

    if(!this.disposeHandler){
      this.oldValue = this.getValue();
      this.disposeHandler = this.handler.subscribe(this.element, this.call.bind(this));
    }

    this.callbacks.push(callback);

    return this.unsubscribe.bind(this, callback);
  }

  unsubscribe(callback) {
    var callbacks = this.callbacks;
    callbacks.splice(callbacks.indexOf(callback), 1);
    if(callbacks.length === 0){
      this.disposeHandler();
      this.disposeHandler = null;
    }
  }
}

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
    if (this.arraySubscription) {
      this.arraySubscription();
      this.arraySubscription = null;
    }
    // subscribe to new array.
    if (Array.isArray(newValue)) {
      this.arraySubscription = this.observerLocator.getArrayObserver(newValue)
        .subscribe(this.synchronizeOptions.bind(this));
    }
    // assign and sync element.
    this.value = newValue;
    this.synchronizeOptions();
    // queue up an initial sync after the bindings have been evaluated.
    if (this.element.options.length > 0 && !this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask({ call: () => this.synchronizeOptions() });
    }
  }

  synchronizeOptions() {
    var value = this.value, i, options, option, optionValue, clear, isArray;

    if (value === null || value === undefined) {
      clear = true;
    } else if (Array.isArray(value)) {
      isArray = true;
    }

    options = this.element.options;
    i = options.length;
    while(i--) {
      option = options.item(i);
      if (clear) {
        option.selected = false;
        continue;
      }
      optionValue = option.hasOwnProperty('model') ? option.model : option.value;
      if (isArray) {
        option.selected = value.indexOf(optionValue) !== -1;
        continue;
      }
      option.selected = value === optionValue;
    }
  }

  synchronizeValue(){
    var options = this.element.options, option, i, ii, count = 0, value = [];

    for(i = 0, ii = options.length; i < ii; i++) {
      option = options.item(i);
      if (!option.selected) {
        continue;
      }
      value[count] = option.hasOwnProperty('model') ? option.model : option.value;
      count++;
    }

    if (!this.element.multiple) {
      if (count === 0) {
        value = null;
      } else {
        value = value[0];
      }
    }

    this.oldValue = this.value;
    this.value = value;
    this.call();
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.value;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  subscribe(callback) {
    if(!this.callbacks) {
      this.callbacks = [];
      this.disposeHandler = this.handler
        .subscribe(this.element, this.synchronizeValue.bind(this, false));
    }

    this.callbacks.push(callback);
    return this.unsubscribe.bind(this, callback);
  }

  unsubscribe(callback) {
    var callbacks = this.callbacks;
    callbacks.splice(callbacks.indexOf(callback), 1);
    if(callbacks.length === 0){
      this.disposeHandler();
      this.disposeHandler = null;
      this.callbacks = null;
    }
  }

  bind() {
    this.domObserver = new MutationObserver(() => {
      this.synchronizeOptions();
      this.synchronizeValue();
    });
    this.domObserver.observe(this.element, { childList: true, subtree: true });
  }

  unbind() {
    this.domObserver.disconnect();
    this.domObserver = null;

    if (this.arraySubscription) {
      this.arraySubscription();
      this.arraySubscription = null;
    }
  }
}

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
    if (this.arraySubscription) {
      this.arraySubscription();
      this.arraySubscription = null;
    }
    // subscribe to new array.
    if (this.element.type === 'checkbox' && Array.isArray(newValue)) {
      this.arraySubscription = this.observerLocator.getArrayObserver(newValue)
        .subscribe(this.synchronizeElement.bind(this));
    }
    // assign and sync element.
    this.value = newValue;
    this.synchronizeElement();
    // queue up an initial sync after the bindings have been evaluated.
    if (!this.element.hasOwnProperty('model') && !this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask({ call: () => this.synchronizeElement() });
    }
  }

  synchronizeElement() {
    var value = this.value,
        element = this.element,
        elementValue = element.hasOwnProperty('model') ? element.model : element.value,
        isRadio = element.type === 'radio';

    element.checked =
      isRadio && value === elementValue
      || !isRadio && value === true
      || !isRadio && Array.isArray(value) && value.indexOf(elementValue) !== -1;
  }

  synchronizeValue(){
    var value = this.value,
        element = this.element,
        elementValue = element.hasOwnProperty('model') ? element.model : element.value,
        index;

    if (element.type === 'checkbox') {
      if (Array.isArray(value)) {
        index = value.indexOf(elementValue);
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
    this.call();
  }

  call(){
    var callbacks = this.callbacks,
        i = callbacks.length,
        oldValue = this.oldValue,
        newValue = this.value;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  subscribe(callback) {
    if(!this.callbacks) {
      this.callbacks = [];
      this.disposeHandler = this.handler
        .subscribe(this.element, this.synchronizeValue.bind(this, false));
    }

    this.callbacks.push(callback);
    return this.unsubscribe.bind(this, callback);
  }

  unsubscribe(callback) {
    var callbacks = this.callbacks;
    callbacks.splice(callbacks.indexOf(callback), 1);
    if(callbacks.length === 0){
      this.disposeHandler();
      this.disposeHandler = null;
      this.callbacks = null;
    }
  }

  unbind() {
    if (this.arraySubscription) {
      this.arraySubscription();
      this.arraySubscription = null;
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
        names, name, i;

    // Add the classes, tracking the version at which they were added.
    if (newValue !== null && newValue !== undefined && newValue.length) {
      names = newValue.split(' ');
      i = names.length;
      while(i--) {
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

  subscribe(callback) {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "class" property is not supported.`);
  }
}

export class ComputedPropertyObserver {
  constructor(obj, propertyName, descriptor, observerLocator){
    this.obj = obj;
    this.propertyName = propertyName;
    this.descriptor = descriptor;
    this.observerLocator = observerLocator;
    this.callbacks = [];
  }

  getValue(){
    return this.obj[this.propertyName];
  }

  setValue(newValue){
    this.obj[this.propertyName] = newValue;
  }

  trigger(newValue, oldValue){
    var callbacks = this.callbacks,
        i = callbacks.length;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }
  }

  evaluate() {
    var newValue = this.getValue();
    if (this.oldValue === newValue)
      return;
    this.trigger(newValue, this.oldValue);
    this.oldValue = newValue;
  }

  subscribe(callback){
    var dependencies, i, ii;

    this.callbacks.push(callback);

    if (this.oldValue === undefined) {
      this.oldValue = this.getValue();
      this.subscriptions = [];

      dependencies = this.descriptor.get.dependencies;
      for (i = 0, ii = dependencies.length; i < ii; i++) {
        // todo:  consider throwing when a dependency's observer is an instance of DirtyCheckProperty.
        this.subscriptions.push(this.observerLocator.getObserver(this.obj, dependencies[i]).subscribe(() => this.evaluate()));
      }
    }

    return () => {
      this.callbacks.splice(this.callbacks.indexOf(callback), 1);
      if (this.callbacks.length > 0)
        return;
      while(this.subscriptions.length) {
        this.subscriptions.pop()();
      }
      this.oldValue = undefined;
    };
  }
}

export function hasDeclaredDependencies(descriptor) {
  return descriptor && descriptor.get && descriptor.get.dependencies && descriptor.get.dependencies.length > 0;
}

export function declarePropertyDependencies(ctor, propertyName, dependencies) {
  var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
  descriptor.get.dependencies = dependencies;
}

export var elements = {
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

export var presentationElements = {
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

export var presentationAttributes = {
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

export function isStandardSvgAttribute(nodeName, attributeName) {
  return presentationElements[nodeName] && presentationAttributes[attributeName]
    || elements[nodeName] && elements[nodeName].indexOf(attributeName) !== -1;
}

// SVG elements/attributes are case-sensitive.  Not all browsers use the same casing for all attributes.
function createElement(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

if (createElement('<svg><altGlyph /></svg>').firstElementChild.nodeName === 'altglyph') {
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

if(typeof Object.getPropertyDescriptor !== 'function'){
 Object.getPropertyDescriptor = function (subject, name) {
    var pd = Object.getOwnPropertyDescriptor(subject, name);
    var proto = Object.getPrototypeOf(subject);
    while (typeof pd === 'undefined' && proto !== null) {
      pd = Object.getOwnPropertyDescriptor(proto, name);
      proto = Object.getPrototypeOf(proto);
    }
    return pd;
  };
}

function createObserverLookup(obj, observerLocator) {
  var value = new OoObjectObserver(obj, observerLocator);

  try{
    Object.defineProperty(obj, "__observer__", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    });
  }catch(_){}

  return value;
}

export class ObserverLocator {
  static inject(){ return [TaskQueue, EventManager, DirtyChecker, All.of(ObjectObservationAdapter)]; }
  constructor(taskQueue, eventManager, dirtyChecker, observationAdapters){
    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
    this.observationAdapters = observationAdapters;
  }

  getObserver(obj, propertyName){
    var observersLookup = obj.__observers__,
        observer;

    if(observersLookup && propertyName in observersLookup){
      return observersLookup[propertyName];
    }

    observer = this.createPropertyObserver(obj, propertyName);

    if (!observer.doNotCache){
      if(observersLookup === undefined){
        observersLookup = this.getOrCreateObserversLookup(obj);
      }

      observersLookup[propertyName] = observer;
    }

    return observer;
  }

  getOrCreateObserversLookup(obj){
    return obj.__observers__ || this.createObserversLookup(obj);
  }

  createObserversLookup(obj) {
    var value = {};

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

  getObservationAdapter(obj, propertyName, descriptor) {
    var i, ii, observationAdapter;
    for(i = 0, ii = this.observationAdapters.length; i < ii; i++){
      observationAdapter = this.observationAdapters[i];
      if (observationAdapter.handlesProperty(obj, propertyName, descriptor))
        return observationAdapter;
    }
    return null;
  }

  createPropertyObserver(obj, propertyName){
    var observerLookup, descriptor, handler, observationAdapter, xlinkResult;

    if(obj instanceof Element){
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
        || obj instanceof SVGElement && isStandardSvgAttribute(obj.nodeName, propertyName)) {
        return new DataAttributeObserver(obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);

    if (hasDeclaredDependencies(descriptor)) {
      return new ComputedPropertyObserver(obj, propertyName, descriptor, this)
    }

    let existingGetterOrSetter;
    if(descriptor && (existingGetterOrSetter = descriptor.get || descriptor.set)){
      if(existingGetterOrSetter.getObserver){
        return existingGetterOrSetter.getObserver(obj);
      }

      // attempt to use an adapter before resorting to dirty checking.
      observationAdapter = this.getObservationAdapter(obj, propertyName, descriptor);
      if (observationAdapter)
        return observationAdapter.getObserver(obj, propertyName, descriptor);
      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    }

    if(hasObjectObserve){
      observerLookup = obj.__observer__ || createObserverLookup(obj, this);
      return observerLookup.getObserver(propertyName, descriptor);
    }

    if(obj instanceof Array){
      if (propertyName === 'length') {
        return this.getArrayObserver(obj).getLengthObserver();
      } else {
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }else if(obj instanceof Map){
      if (propertyName === 'size') {
        return this.getMapObserver(obj).getLengthObserver();
      } else {
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }

    return new SetterObserver(this.taskQueue, obj, propertyName);
  }

  getArrayObserver(array){
    if('__array_observer__' in array){
      return array.__array_observer__;
    }

    return array.__array_observer__ = getArrayObserver(this.taskQueue, array);
  }

  getMapObserver(map){
    if('__map_observer__' in map){
      return map.__map_observer__;
    }

    return map.__map_observer__ = getMapObserver(this.taskQueue, map);
  }
}

export class ObjectObservationAdapter {
  handlesProperty(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement handlesProperty(object, propertyName).');
  }

  getObserver(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement createObserver(object, propertyName).');
  }
}

export class BindingExpression {
  constructor(observerLocator, targetProperty, sourceExpression,
    mode, valueConverterLookupFunction, attribute){
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.mode = mode;
    this.valueConverterLookupFunction = valueConverterLookupFunction;
    this.attribute = attribute;
    this.discrete = false;
  }

  createBinding(target){
    return new Binding(
      this.observerLocator,
      this.sourceExpression,
      target,
      this.targetProperty,
      this.mode,
      this.valueConverterLookupFunction
      );
  }

  static create(targetProperty, sourceExpression, mode=bindingMode.oneWay){
    let parser = Container.instance.get(Parser),
        observerLocator = Container.instance.get(ObserverLocator);

    return new BindingExpression(
      observerLocator,
      targetProperty,
      parser.parse(sourceExpression),
      mode
    );
  }
}

class Binding {
  constructor(observerLocator, sourceExpression, target, targetProperty, mode, valueConverterLookupFunction){
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.mode = mode;
    this.valueConverterLookupFunction = valueConverterLookupFunction;
  }

  getObserver(obj, propertyName){
    return this.observerLocator.getObserver(obj, propertyName);
  }

  bind(source){
    var targetProperty = this.targetProperty,
        info;

    if ('bind' in targetProperty){
      targetProperty.bind();
    }

    if(this.mode == bindingMode.oneWay || this.mode == bindingMode.twoWay){
      if(this._disposeObserver){
        if(this.source === source){
          return;
        }

        this.unbind();
      }

      info = this.sourceExpression.connect(this, source);

      if(info.observer){
        this._disposeObserver = info.observer.subscribe(newValue =>{
          var existing = targetProperty.getValue();
          if(newValue !== existing){
            targetProperty.setValue(newValue);
          }
        });
      }

      if(info.value !== undefined){
        targetProperty.setValue(info.value);
      }

      if(this.mode == bindingMode.twoWay){
        this._disposeListener = targetProperty.subscribe(newValue => {
          this.sourceExpression.assign(source, newValue, this.valueConverterLookupFunction);
        });
      }

      this.source = source;
    }else{
      var value = this.sourceExpression.evaluate(source, this.valueConverterLookupFunction);

      if(value !== undefined){
        targetProperty.setValue(value);
      }
    }
  }

  unbind(){
    if ('unbind' in this.targetProperty){
      this.targetProperty.unbind();
    }
    if(this._disposeObserver){
      this._disposeObserver();
      this._disposeObserver = null;
    }

    if(this._disposeListener){
      this._disposeListener();
      this._disposeListener = null;
    }
  }
}

export class CallExpression {
  constructor(observerLocator, targetProperty, sourceExpression, valueConverterLookupFunction){
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.valueConverterLookupFunction = valueConverterLookupFunction;
  }

  createBinding(target){
    return new Call(
      this.observerLocator,
      this.sourceExpression,
      target,
      this.targetProperty,
      this.valueConverterLookupFunction
      );
  }
}

class Call {
  constructor(observerLocator, sourceExpression, target, targetProperty, valueConverterLookupFunction){
    this.sourceExpression = sourceExpression
    this.target = target;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.valueConverterLookupFunction = valueConverterLookupFunction;
  }

  bind(source){
    if(this.source === source){
      return;
    }

    if(this.source){
      this.unbind();
    }

    this.source = source;
    this.targetProperty.setValue($event => {
      var result, temp = source.$event;
      source.$event = $event;
      result = this.sourceExpression.evaluate(source, this.valueConverterLookupFunction);
      source.$event = temp;
      return result;
    });
  }

  unbind(){
    this.targetProperty.setValue(null);
  }
}

/*
 * classList polyfill.  Forked from https://github.com/eligrey/classList.js
 * and maintained at https://github.com/jdanyow/classList.js
 *
 *******************************************************************************
 *
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20150312
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

//if ("document" in self) {

// Full polyfill for browsers with no classList support
// Including IE < Edge missing SVGElement.classList
if (!("classList" in document.createElement("_"))
	|| document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg","g"))) {

(function (view) {

"use strict";

if (!('Element' in view)) return;

var
	  classListProp = "classList"
	, protoProp = "prototype"
	, elemCtrProto = view.Element[protoProp]
	, objCtr = Object
	, strTrim = String[protoProp].trim || function () {
		return this.replace(/^\s+|\s+$/g, "");
	}
	, arrIndexOf = Array[protoProp].indexOf || function (item) {
		var
			  i = 0
			, len = this.length
		;
		for (; i < len; i++) {
			if (i in this && this[i] === item) {
				return i;
			}
		}
		return -1;
	}
	// Vendors: please allow content code to instantiate DOMExceptions
	, DOMEx = function (type, message) {
		this.name = type;
		this.code = DOMException[type];
		this.message = message;
	}
	, checkTokenAndGetIndex = function (classList, token) {
		if (token === "") {
			throw new DOMEx(
				  "SYNTAX_ERR"
				, "An invalid or illegal string was specified"
			);
		}
		if (/\s/.test(token)) {
			throw new DOMEx(
				  "INVALID_CHARACTER_ERR"
				, "String contains an invalid character"
			);
		}
		return arrIndexOf.call(classList, token);
	}
	, ClassList = function (elem) {
		var
			  trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
			, classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
			, i = 0
			, len = classes.length
		;
		for (; i < len; i++) {
			this.push(classes[i]);
		}
		this._updateClassName = function () {
			elem.setAttribute("class", this.toString());
		};
	}
	, classListProto = ClassList[protoProp] = []
	, classListGetter = function () {
		return new ClassList(this);
	}
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
	return this[i] || null;
};
classListProto.contains = function (token) {
	token += "";
	return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
	var
		  tokens = arguments
		, i = 0
		, l = tokens.length
		, token
		, updated = false
	;
	do {
		token = tokens[i] + "";
		if (checkTokenAndGetIndex(this, token) === -1) {
			this.push(token);
			updated = true;
		}
	}
	while (++i < l);

	if (updated) {
		this._updateClassName();
	}
};
classListProto.remove = function () {
	var
		  tokens = arguments
		, i = 0
		, l = tokens.length
		, token
		, updated = false
		, index
	;
	do {
		token = tokens[i] + "";
		index = checkTokenAndGetIndex(this, token);
		while (index !== -1) {
			this.splice(index, 1);
			updated = true;
			index = checkTokenAndGetIndex(this, token);
		}
	}
	while (++i < l);

	if (updated) {
		this._updateClassName();
	}
};
classListProto.toggle = function (token, force) {
	token += "";

	var
		  result = this.contains(token)
		, method = result ?
			force !== true && "remove"
		:
			force !== false && "add"
	;

	if (method) {
		this[method](token);
	}

	if (force === true || force === false) {
		return force;
	} else {
		return !result;
	}
};
classListProto.toString = function () {
	return this.join(" ");
};

if (objCtr.defineProperty) {
	var classListPropDesc = {
		  get: classListGetter
		, enumerable: true
		, configurable: true
	};
	try {
		objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
	} catch (ex) { // IE 8 doesn't support enumerable:true
		if (ex.number === -0x7FF5EC54) {
			classListPropDesc.enumerable = false;
			objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
		}
	}
} else if (objCtr[protoProp].__defineGetter__) {
	elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(self));

} else {
// There is full or partial native classList support, so just check if we need
// to normalize the add/remove and toggle APIs.

(function () {
	"use strict";

	var testElement = document.createElement("_");

	testElement.classList.add("c1", "c2");

	// Polyfill for IE 10/11 and Firefox <26, where classList.add and
	// classList.remove exist but support only one argument at a time.
	if (!testElement.classList.contains("c2")) {
		var createMethod = function(method) {
			var original = DOMTokenList.prototype[method];

			DOMTokenList.prototype[method] = function(token) {
				var i, len = arguments.length;

				for (i = 0; i < len; i++) {
					token = arguments[i];
					original.call(this, token);
				}
			};
		};
		createMethod('add');
		createMethod('remove');
	}

	testElement.classList.toggle("c3", false);

	// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
	// support the second argument.
	if (testElement.classList.contains("c3")) {
		var _toggle = DOMTokenList.prototype.toggle;

		DOMTokenList.prototype.toggle = function(token, force) {
			if (1 in arguments && !this.contains(token) === !force) {
				return force;
			} else {
				return _toggle.call(this, token);
			}
		};

	}

	testElement = null;
}());

}

//}

function camelCase(name){
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export class ValueConverterResource {
  constructor(name){
    this.name = name;
  }

  static convention(name){
    if(name.endsWith('ValueConverter')){
      return new ValueConverterResource(camelCase(name.substring(0, name.length-14)));
    }
  }

  analyze(container, target){
    this.instance = container.get(target);
  }

  register(registry, name){
    registry.registerValueConverter(name || this.name, this.instance);
  }

  load(container, target){
    return Promise.resolve(this);
  }
}

//ES7 Decorators
export function valueConverter(nameOrTarget){
  if(nameOrTarget === undefined || typeof nameOrTarget === 'string'){
    return function(target){
      Metadata.define(Metadata.resource, new ValueConverterResource(nameOrTarget), target);
    }
  }

  Metadata.define(Metadata.resource, new ValueConverterResource(), nameOrTarget);
}

Decorators.configure.parameterizedDecorator('valueConverter', valueConverter);

export function computedFrom(...rest){
  return function(target, key, descriptor){
    descriptor.get.dependencies = rest;
    return descriptor;
  }
}

export class ListenerExpression {
  constructor(eventManager, targetEvent, sourceExpression, delegate, preventDefault){
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.sourceExpression = sourceExpression;
    this.delegate = delegate;
    this.discrete = true;
    this.preventDefault = preventDefault;
  }

  createBinding(target){
    return new Listener(
      this.eventManager,
      this.targetEvent,
      this.delegate,
      this.sourceExpression,
      target,
      this.preventDefault
      );
  }
}

class Listener {
  constructor(eventManager, targetEvent, delegate, sourceExpression, target, preventDefault){
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.delegate = delegate;
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.preventDefault = preventDefault;
  }

  bind(source){
    if(this._disposeListener){
      if(this.source === source){
        return;
      }

      this.unbind();
    }

    this.source = source;
    this._disposeListener = this.eventManager.addEventListener(this.target, this.targetEvent, event =>{
      var prevEvent = source.$event;
      source.$event = event;
      var result = this.sourceExpression.evaluate(source);
      source.$event = prevEvent;
      if(result !== true && this.preventDefault){
        event.preventDefault();
      }
      return result;
    }, this.delegate);
  }

  unbind(){
    if(this._disposeListener){
      this._disposeListener();
      this._disposeListener = null;
    }
  }
}

export class NameExpression {
  constructor(name, mode){
    this.property = name;
    this.discrete = true;
    this.mode = mode;
  }

  createBinding(target){
    return new NameBinder(this.property, target, this.mode);
  }
}

class NameBinder {
  constructor(property, target, mode){
    this.property = property;

    switch (mode) {
      case 'element':
        this.target = target;
        break;
      case 'view-model':
        this.target = target.primaryBehavior.executionContext;
        break;
      default:
        this.target = target[mode];

        if(this.target === undefined){
          throw new Error(`Attempted to reference "${mode}", but it was not found on the target element.`)
        }else{
          this.target = this.target.executionContext || this.target;
        }

        break;
    }
  }

  bind(source){
    if(this.source){
      if(this.source === source){
        return;
      }

      this.unbind();
    }

    this.source = source;
    source[this.property] = this.target;
  }

  unbind(){
    this.source[this.property] = null;
  }
}
