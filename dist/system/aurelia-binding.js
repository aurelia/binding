System.register(['core-js', 'aurelia-pal', 'aurelia-task-queue', 'aurelia-metadata'], function (_export) {
  'use strict';

  var PLATFORM, DOM, TaskQueue, metadata, sourceContext, slotNames, versionSlotNames, i, bindings, minimumImmediate, frameBudget, isFlushRequested, immediate, tempContextsRest, tempCallablesRest, EDIT_LEAVE, EDIT_UPDATE, EDIT_ADD, EDIT_DELETE, arraySplice, ModifyCollectionObserver, CollectionLengthObserver, arrayProto, ModifyArrayObserver, Expression, Chain, BindingBehavior, ValueConverter, Assign, Conditional, AccessThis, AccessScope, AccessMember, AccessKeyed, CallScope, CallMember, CallFunction, Binary, PrefixNot, LiteralPrimitive, LiteralString, LiteralArray, LiteralObject, Unparser, evalListCache, bindingMode, Token, Lexer, Scanner, OPERATORS, $EOF, $TAB, $LF, $VTAB, $FF, $CR, $SPACE, $BANG, $DQ, $$, $PERCENT, $AMPERSAND, $SQ, $LPAREN, $RPAREN, $STAR, $PLUS, $COMMA, $MINUS, $PERIOD, $SLASH, $COLON, $SEMICOLON, $LT, $EQ, $GT, $QUESTION, $0, $9, $A, $E, $Z, $LBRACKET, $BACKSLASH, $RBRACKET, $CARET, $_, $a, $e, $f, $n, $r, $t, $u, $v, $z, $LBRACE, $BAR, $RBRACE, $NBSP, EOF, Parser, ParserImplementation, mapProto, ModifyMapObserver, DelegateHandlerEntry, DefaultEventStrategy, EventManager, DirtyChecker, DirtyCheckProperty, propertyAccessor, PrimitiveObserver, SetterObserver, XLinkAttributeObserver, dataAttributeAccessor, DataAttributeObserver, StyleObserver, ValueAttributeObserver, selectArrayContext, SelectValueObserver, checkedArrayContext, CheckedObserver, ClassObserver, computedContext, ComputedPropertyObserver, elements, presentationElements, presentationAttributes, SVGAnalyzer, ObserverLocator, ObjectObservationAdapter, BindingExpression, targetContext, Binding, CallExpression, Call, ValueConverterResource, BindingBehaviorResource, ListenerExpression, Listener, NameExpression, NameBinder, lookupFunctions, BindingEngine, ExpressionObserver;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('camelCase', camelCase);

  _export('createOverrideContext', createOverrideContext);

  _export('getContextFor', getContextFor);

  _export('createScopeForTest', createScopeForTest);

  _export('connectable', connectable);

  _export('enqueueBindingConnect', enqueueBindingConnect);

  _export('subscriberCollection', subscriberCollection);

  _export('calcSplices', calcSplices);

  _export('projectArraySplices', projectArraySplices);

  _export('getChangeRecords', getChangeRecords);

  _export('getArrayObserver', _getArrayObserver);

  _export('getMapObserver', _getMapObserver);

  _export('hasDeclaredDependencies', hasDeclaredDependencies);

  _export('declarePropertyDependencies', declarePropertyDependencies);

  _export('computedFrom', computedFrom);

  _export('valueConverter', valueConverter);

  _export('bindingBehavior', bindingBehavior);

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function camelCase(name) {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  function createOverrideContext(bindingContext, parentOverrideContext) {
    return {
      bindingContext: bindingContext,
      parentOverrideContext: parentOverrideContext || null
    };
  }

  function getContextFor(name, scope, ancestor) {
    var oc = scope.overrideContext;

    if (ancestor) {
      while (ancestor && oc) {
        ancestor--;
        oc = oc.parentOverrideContext;
      }
      if (ancestor || !oc) {
        return undefined;
      }
      return name in oc ? oc : oc.bindingContext;
    }

    while (oc && !(name in oc) && !(oc.bindingContext && name in oc.bindingContext)) {
      oc = oc.parentOverrideContext;
    }
    if (oc) {
      return name in oc ? oc : oc.bindingContext;
    }

    return scope.bindingContext || scope.overrideContext;
  }

  function createScopeForTest(bindingContext, parentBindingContext) {
    if (parentBindingContext) {
      return {
        bindingContext: bindingContext,
        overrideContext: createOverrideContext(bindingContext, createOverrideContext(parentBindingContext))
      };
    }
    return {
      bindingContext: bindingContext,
      overrideContext: createOverrideContext(bindingContext)
    };
  }

  function addObserver(observer) {
    var observerSlots = this._observerSlots === undefined ? 0 : this._observerSlots;
    var i = observerSlots;
    while (i-- && this[slotNames[i]] !== observer) {}

    if (i === -1) {
      i = 0;
      while (this[slotNames[i]]) {
        i++;
      }
      this[slotNames[i]] = observer;
      observer.subscribe(sourceContext, this);

      if (i === observerSlots) {
        this._observerSlots = i + 1;
      }
    }

    if (this._version === undefined) {
      this._version = 0;
    }
    this[versionSlotNames[i]] = this._version;
  }

  function observeProperty(obj, propertyName) {
    var observer = this.observerLocator.getObserver(obj, propertyName);
    addObserver.call(this, observer);
  }

  function observeArray(array) {
    var observer = this.observerLocator.getArrayObserver(array);
    addObserver.call(this, observer);
  }

  function unobserve(all) {
    var i = this._observerSlots;
    while (i--) {
      if (all || this[versionSlotNames[i]] !== this._version) {
        var observer = this[slotNames[i]];
        this[slotNames[i]] = null;
        if (observer) {
          observer.unsubscribe(sourceContext, this);
        }
      }
    }
  }

  function connectable() {
    return function (target) {
      target.prototype.observeProperty = observeProperty;
      target.prototype.observeArray = observeArray;
      target.prototype.unobserve = unobserve;
    };
  }

  function flush(animationFrameStart) {
    var i = 0;
    for (var _iterator = bindings, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var binding = _ref[0];

      bindings['delete'](binding);
      binding.connect(true);
      i++;

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

  function enqueueBindingConnect(binding) {
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
    var rest = this._contextsRest;
    var index = undefined;
    if (!rest || !rest.length || (index = rest.indexOf(context)) === -1 || this._callablesRest[index] !== callable) {
      return false;
    }
    rest.splice(index, 1);
    this._callablesRest.splice(index, 1);
    return true;
  }

  function callSubscribers(newValue, oldValue) {
    var context0 = this._context0;
    var callable0 = this._callable0;
    var context1 = this._context1;
    var callable1 = this._callable1;
    var context2 = this._context2;
    var callable2 = this._callable2;
    var length = !this._contextsRest ? 0 : this._contextsRest.length;
    var i = length;
    if (length) {
      while (i--) {
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
      var callable = tempCallablesRest[i];
      var context = tempContextsRest[i];
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
    return !!(this._context0 || this._context1 || this._context2 || this._contextsRest && this._contextsRest.length);
  }

  function hasSubscriber(context, callable) {
    var has = this._context0 === context && this._callable0 === callable || this._context1 === context && this._callable1 === callable || this._context2 === context && this._callable2 === callable;
    if (has) {
      return true;
    }
    var index = undefined;
    var contexts = this._contextsRest;
    if (!contexts || (index = contexts.length) === 0) {
      return false;
    }
    var callables = this._callablesRest;
    while (index--) {
      if (contexts[index] === context && callables[index] === callable) {
        return true;
      }
    }
    return false;
  }

  function subscriberCollection() {
    return function (target) {
      target.prototype.addSubscriber = addSubscriber;
      target.prototype.removeSubscriber = removeSubscriber;
      target.prototype.callSubscribers = callSubscribers;
      target.prototype.hasSubscribers = hasSubscribers;
      target.prototype.hasSubscriber = hasSubscriber;
    };
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

  function ArraySplice() {}

  function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
    return arraySplice.calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd);
  }

  function intersect(start1, end1, start2, end2) {
    if (end1 < start2 || end2 < start1) return -1;

    if (end1 == start2 || end2 == start1) return 0;

    if (start1 < start2) {
      if (end1 < end2) return end1 - start2;else return end2 - start2;
    } else {
        if (end2 < end1) return end2 - start1;else return end1 - start1;
      }
  }

  function mergeSplice(splices, index, removed, addedCount) {
    var splice = newSplice(index, removed, addedCount);

    var inserted = false;
    var insertionOffset = 0;

    for (var i = 0; i < splices.length; i++) {
      var current = splices[i];
      current.index += insertionOffset;

      if (inserted) continue;

      var intersectCount = intersect(splice.index, splice.index + splice.removed.length, current.index, current.index + current.addedCount);

      if (intersectCount >= 0) {

        splices.splice(i, 1);
        i--;

        insertionOffset -= current.addedCount - current.removed.length;

        splice.addedCount += current.addedCount - intersectCount;
        var deleteCount = splice.removed.length + current.removed.length - intersectCount;

        if (!splice.addedCount && !deleteCount) {
          inserted = true;
        } else {
          var removed = current.removed;

          if (splice.index < current.index) {
            var prepend = splice.removed.slice(0, current.index - splice.index);
            Array.prototype.push.apply(prepend, removed);
            removed = prepend;
          }

          if (splice.index + splice.removed.length > current.index + current.addedCount) {
            var append = splice.removed.slice(current.index + current.addedCount - splice.index);
            Array.prototype.push.apply(removed, append);
          }

          splice.removed = removed;
          if (current.index < splice.index) {
            splice.index = current.index;
          }
        }
      } else if (splice.index < current.index) {

        inserted = true;

        splices.splice(i, 0, splice);
        i++;

        var offset = splice.addedCount - splice.removed.length;
        current.index += offset;
        insertionOffset += offset;
      }
    }

    if (!inserted) splices.push(splice);
  }

  function createInitialSplices(array, changeRecords) {
    var splices = [];

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      switch (record.type) {
        case 'splice':
          mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
          break;
        case 'add':
        case 'update':
        case 'delete':
          if (!isIndex(record.name)) continue;
          var index = toNumber(record.name);
          if (index < 0) continue;
          mergeSplice(splices, index, [record.oldValue], record.type === 'delete' ? 0 : 1);
          break;
        default:
          console.error('Unexpected record type: ' + JSON.stringify(record));
          break;
      }
    }

    return splices;
  }

  function projectArraySplices(array, changeRecords) {
    var splices = [];

    createInitialSplices(array, changeRecords).forEach(function (splice) {
      if (splice.addedCount == 1 && splice.removed.length == 1) {
        if (splice.removed[0] !== array[splice.index]) splices.push(splice);

        return;
      };

      splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount, splice.removed, 0, splice.removed.length));
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

  function getChangeRecords(map) {
    var entries = [];
    for (var _iterator2 = map.keys(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var key = _ref2;

      entries.push(newRecord('added', map, key));
    }
    return entries;
  }

  function _getArrayObserver(taskQueue, array) {
    return ModifyArrayObserver.create(taskQueue, array);
  }

  function evalList(scope, list, lookupFunctions) {
    var length = list.length,
        cacheLength,
        i;

    for (cacheLength = evalListCache.length; cacheLength <= length; ++cacheLength) {
      evalListCache.push([]);
    }

    var result = evalListCache[length];

    for (i = 0; i < length; ++i) {
      result[i] = list[i].evaluate(scope, lookupFunctions);
    }

    return result;
  }

  function autoConvertAdd(a, b) {
    if (a != null && b != null) {
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
    var func = obj === null || obj === undefined ? null : obj[name];
    if (typeof func === 'function') {
      return func;
    }
    if (!mustExist && (func === null || func === undefined)) {
      return null;
    }
    throw new Error(name + ' is not a function');
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

  function isWhitespace(code) {
    return code >= $TAB && code <= $SPACE || code === $NBSP;
  }

  function isIdentifierStart(code) {
    return $a <= code && code <= $z || $A <= code && code <= $Z || code === $_ || code === $$;
  }

  function isIdentifierPart(code) {
    return $a <= code && code <= $z || $A <= code && code <= $Z || $0 <= code && code <= $9 || code === $_ || code === $$;
  }

  function isDigit(code) {
    return $0 <= code && code <= $9;
  }

  function isExponentStart(code) {
    return code === $e || code === $E;
  }

  function isExponentSign(code) {
    return code === $MINUS || code === $PLUS;
  }

  function unescape(code) {
    switch (code) {
      case $n:
        return $LF;
      case $f:
        return $FF;
      case $r:
        return $CR;
      case $t:
        return $TAB;
      case $v:
        return $VTAB;
      default:
        return code;
    }
  }

  function assert(condition, message) {
    if (!condition) {
      throw message || "Assertion failed";
    }
  }

  function _getMapObserver(taskQueue, map) {
    return ModifyMapObserver.create(taskQueue, map);
  }

  function findOriginalEventTarget(event) {
    return event.path && event.path[0] || event.deepPath && event.deepPath[0] || event.target;
  }

  function handleDelegatedEvent(event) {
    var target = findOriginalEventTarget(event);
    var callback = undefined;

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

  function hasDeclaredDependencies(descriptor) {
    return descriptor && descriptor.get && descriptor.get.dependencies && descriptor.get.dependencies.length > 0;
  }

  function declarePropertyDependencies(ctor, propertyName, dependencies) {
    var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
    descriptor.get.dependencies = dependencies;
  }

  function computedFrom() {
    for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
      rest[_key] = arguments[_key];
    }

    return function (target, key, descriptor) {
      descriptor.get.dependencies = rest;
      return descriptor;
    };
  }

  function createElement(html) {
    var div = DOM.createElement('div');
    div.innerHTML = html;
    return div.firstChild;
  }

  function valueConverter(nameOrTarget) {
    if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
      return function (target) {
        metadata.define(metadata.resource, new ValueConverterResource(nameOrTarget), target);
      };
    }

    metadata.define(metadata.resource, new ValueConverterResource(), nameOrTarget);
  }

  function bindingBehavior(nameOrTarget) {
    if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
      return function (target) {
        metadata.define(metadata.resource, new BindingBehaviorResource(nameOrTarget), target);
      };
    }

    metadata.define(metadata.resource, new BindingBehaviorResource(), nameOrTarget);
  }

  function getAU(element) {
    var au = element.au;

    if (au === undefined) {
      throw new Error('No Aurelia APIs are defined for the referenced element.');
    }

    return au;
  }

  return {
    setters: [function (_coreJs) {}, function (_aureliaPal) {
      PLATFORM = _aureliaPal.PLATFORM;
      DOM = _aureliaPal.DOM;
    }, function (_aureliaTaskQueue) {
      TaskQueue = _aureliaTaskQueue.TaskQueue;
    }, function (_aureliaMetadata) {
      metadata = _aureliaMetadata.metadata;
    }],
    execute: function () {
      sourceContext = 'Binding:source';

      _export('sourceContext', sourceContext);

      slotNames = [];
      versionSlotNames = [];

      for (i = 0; i < 100; i++) {
        slotNames.push('_observer' + i);
        versionSlotNames.push('_observerVersion' + i);
      }bindings = new Map();
      minimumImmediate = 100;
      frameBudget = 15;
      isFlushRequested = false;
      immediate = 0;
      tempContextsRest = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
      tempCallablesRest = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
      EDIT_LEAVE = 0;
      EDIT_UPDATE = 1;
      EDIT_ADD = 2;
      EDIT_DELETE = 3;
      ArraySplice.prototype = {
        calcEditDistances: function calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd) {
          var rowCount = oldEnd - oldStart + 1;
          var columnCount = currentEnd - currentStart + 1;
          var distances = new Array(rowCount);
          var i, j, north, west;

          for (i = 0; i < rowCount; ++i) {
            distances[i] = new Array(columnCount);
            distances[i][0] = i;
          }

          for (j = 0; j < columnCount; ++j) {
            distances[0][j] = j;
          }

          for (i = 1; i < rowCount; ++i) {
            for (j = 1; j < columnCount; ++j) {
              if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1])) distances[i][j] = distances[i - 1][j - 1];else {
                north = distances[i - 1][j] + 1;
                west = distances[i][j - 1] + 1;
                distances[i][j] = north < west ? north : west;
              }
            }
          }

          return distances;
        },

        spliceOperationsFromEditDistances: function spliceOperationsFromEditDistances(distances) {
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
            if (west < north) min = west < northWest ? west : northWest;else min = north < northWest ? north : northWest;

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

        calcSplices: function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
          var prefixCount = 0;
          var suffixCount = 0;

          var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
          if (currentStart == 0 && oldStart == 0) prefixCount = this.sharedPrefix(current, old, minLength);

          if (currentEnd == current.length && oldEnd == old.length) suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);

          currentStart += prefixCount;
          oldStart += prefixCount;
          currentEnd -= suffixCount;
          oldEnd -= suffixCount;

          if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0) return [];

          if (currentStart == currentEnd) {
            var splice = newSplice(currentStart, [], 0);
            while (oldStart < oldEnd) splice.removed.push(old[oldStart++]);

            return [splice];
          } else if (oldStart == oldEnd) return [newSplice(currentStart, [], currentEnd - currentStart)];

          var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));

          var splice = undefined;
          var splices = [];
          var index = currentStart;
          var oldIndex = oldStart;
          for (var i = 0; i < ops.length; ++i) {
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
                if (!splice) splice = newSplice(index, [], 0);

                splice.addedCount++;
                index++;

                splice.removed.push(old[oldIndex]);
                oldIndex++;
                break;
              case EDIT_ADD:
                if (!splice) splice = newSplice(index, [], 0);

                splice.addedCount++;
                index++;
                break;
              case EDIT_DELETE:
                if (!splice) splice = newSplice(index, [], 0);

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

        sharedPrefix: function sharedPrefix(current, old, searchLength) {
          for (var i = 0; i < searchLength; ++i) if (!this.equals(current[i], old[i])) return i;
          return searchLength;
        },

        sharedSuffix: function sharedSuffix(current, old, searchLength) {
          var index1 = current.length;
          var index2 = old.length;
          var count = 0;
          while (count < searchLength && this.equals(current[--index1], old[--index2])) count++;

          return count;
        },

        calculateSplices: function calculateSplices(current, previous) {
          return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
        },

        equals: function equals(currentValue, previousValue) {
          return currentValue === previousValue;
        }
      };

      arraySplice = new ArraySplice();

      ModifyCollectionObserver = (function () {
        function ModifyCollectionObserver(taskQueue, collection) {
          _classCallCheck(this, _ModifyCollectionObserver);

          this.taskQueue = taskQueue;
          this.queued = false;
          this.changeRecords = null;
          this.oldCollection = null;
          this.collection = collection;
          this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
        }

        ModifyCollectionObserver.prototype.subscribe = function subscribe(context, callable) {
          this.addSubscriber(context, callable);
        };

        ModifyCollectionObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
          this.removeSubscriber(context, callable);
        };

        ModifyCollectionObserver.prototype.addChangeRecord = function addChangeRecord(changeRecord) {
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
        };

        ModifyCollectionObserver.prototype.flushChangeRecords = function flushChangeRecords() {
          if (this.changeRecords && this.changeRecords.length || this.oldCollection) {
            this.call();
          }
        };

        ModifyCollectionObserver.prototype.reset = function reset(oldCollection) {
          this.oldCollection = oldCollection;

          if (this.hasSubscribers() && !this.queued) {
            this.queued = true;
            this.taskQueue.queueMicroTask(this);
          }
        };

        ModifyCollectionObserver.prototype.getLengthObserver = function getLengthObserver() {
          return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection));
        };

        ModifyCollectionObserver.prototype.call = function call() {
          var changeRecords = this.changeRecords;
          var oldCollection = this.oldCollection;
          var records = undefined;

          this.queued = false;
          this.changeRecords = [];
          this.oldCollection = null;

          if (this.hasSubscribers()) {
            if (oldCollection) {
              if (this.collection instanceof Map) {
                records = getChangeRecords(oldCollection);
              } else {
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
        };

        var _ModifyCollectionObserver = ModifyCollectionObserver;
        ModifyCollectionObserver = subscriberCollection()(ModifyCollectionObserver) || ModifyCollectionObserver;
        return ModifyCollectionObserver;
      })();

      _export('ModifyCollectionObserver', ModifyCollectionObserver);

      CollectionLengthObserver = (function () {
        function CollectionLengthObserver(collection) {
          _classCallCheck(this, _CollectionLengthObserver);

          this.collection = collection;
          this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
          this.currentValue = collection[this.lengthPropertyName];
        }

        CollectionLengthObserver.prototype.getValue = function getValue() {
          return this.collection[this.lengthPropertyName];
        };

        CollectionLengthObserver.prototype.setValue = function setValue(newValue) {
          this.collection[this.lengthPropertyName] = newValue;
        };

        CollectionLengthObserver.prototype.subscribe = function subscribe(context, callable) {
          this.addSubscriber(context, callable);
        };

        CollectionLengthObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
          this.removeSubscriber(context, callable);
        };

        CollectionLengthObserver.prototype.call = function call(newValue) {
          var oldValue = this.currentValue;
          this.callSubscribers(newValue, oldValue);
          this.currentValue = newValue;
        };

        var _CollectionLengthObserver = CollectionLengthObserver;
        CollectionLengthObserver = subscriberCollection()(CollectionLengthObserver) || CollectionLengthObserver;
        return CollectionLengthObserver;
      })();

      _export('CollectionLengthObserver', CollectionLengthObserver);

      arrayProto = Array.prototype;

      ModifyArrayObserver = (function (_ModifyCollectionObserver2) {
        _inherits(ModifyArrayObserver, _ModifyCollectionObserver2);

        function ModifyArrayObserver(taskQueue, array) {
          _classCallCheck(this, ModifyArrayObserver);

          _ModifyCollectionObserver2.call(this, taskQueue, array);
        }

        ModifyArrayObserver.create = function create(taskQueue, array) {
          var observer = new ModifyArrayObserver(taskQueue, array);

          array['pop'] = function () {
            var methodCallResult = arrayProto['pop'].apply(array, arguments);
            observer.addChangeRecord({
              type: 'delete',
              object: array,
              name: array.length,
              oldValue: methodCallResult
            });
            return methodCallResult;
          };

          array['push'] = function () {
            var methodCallResult = arrayProto['push'].apply(array, arguments);
            observer.addChangeRecord({
              type: 'splice',
              object: array,
              index: array.length - arguments.length,
              removed: [],
              addedCount: arguments.length
            });
            return methodCallResult;
          };

          array['reverse'] = function () {
            observer.flushChangeRecords();
            var oldArray = array.slice();
            var methodCallResult = arrayProto['reverse'].apply(array, arguments);
            observer.reset(oldArray);
            return methodCallResult;
          };

          array['shift'] = function () {
            var methodCallResult = arrayProto['shift'].apply(array, arguments);
            observer.addChangeRecord({
              type: 'delete',
              object: array,
              name: 0,
              oldValue: methodCallResult
            });
            return methodCallResult;
          };

          array['sort'] = function () {
            observer.flushChangeRecords();
            var oldArray = array.slice();
            var methodCallResult = arrayProto['sort'].apply(array, arguments);
            observer.reset(oldArray);
            return methodCallResult;
          };

          array['splice'] = function () {
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

          array['unshift'] = function () {
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
        };

        return ModifyArrayObserver;
      })(ModifyCollectionObserver);

      Expression = (function () {
        function Expression() {
          _classCallCheck(this, Expression);

          this.isChain = false;
          this.isAssignable = false;
        }

        Expression.prototype.evaluate = function evaluate(scope, lookupFunctions, args) {
          throw new Error('Binding expression "' + this + '" cannot be evaluated.');
        };

        Expression.prototype.assign = function assign(scope, value, lookupFunctions) {
          throw new Error('Binding expression "' + this + '" cannot be assigned to.');
        };

        Expression.prototype.toString = function toString() {
          return Unparser.unparse(this);
        };

        return Expression;
      })();

      _export('Expression', Expression);

      Chain = (function (_Expression) {
        _inherits(Chain, _Expression);

        function Chain(expressions) {
          _classCallCheck(this, Chain);

          _Expression.call(this);

          this.expressions = expressions;
          this.isChain = true;
        }

        Chain.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var result,
              expressions = this.expressions,
              length = expressions.length,
              i,
              last;

          for (i = 0; i < length; ++i) {
            last = expressions[i].evaluate(scope, lookupFunctions);

            if (last !== null) {
              result = last;
            }
          }

          return result;
        };

        Chain.prototype.accept = function accept(visitor) {
          visitor.visitChain(this);
        };

        return Chain;
      })(Expression);

      _export('Chain', Chain);

      BindingBehavior = (function (_Expression2) {
        _inherits(BindingBehavior, _Expression2);

        function BindingBehavior(expression, name, args) {
          _classCallCheck(this, BindingBehavior);

          _Expression2.call(this);

          this.expression = expression;
          this.name = name;
          this.args = args;
        }

        BindingBehavior.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          return this.expression.evaluate(scope, lookupFunctions);
        };

        BindingBehavior.prototype.assign = function assign(scope, value, lookupFunctions) {
          return this.expression.assign(scope, value, lookupFunctions);
        };

        BindingBehavior.prototype.accept = function accept(visitor) {
          visitor.visitBindingBehavior(this);
        };

        BindingBehavior.prototype.connect = function connect(binding, scope) {
          this.expression.connect(binding, scope);
        };

        BindingBehavior.prototype.bind = function bind(binding, scope, lookupFunctions) {
          if (this.expression.expression && this.expression.bind) {
            this.expression.bind(binding, scope, lookupFunctions);
          }
          var behavior = lookupFunctions.bindingBehaviors(this.name);
          if (!behavior) {
            throw new Error('No BindingBehavior named "' + this.name + '" was found!');
          }
          var behaviorKey = 'behavior-' + this.name;
          if (binding[behaviorKey]) {
            throw new Error('A binding behavior named "' + this.name + '" has already been applied to "' + this.expression + '"');
          }
          binding[behaviorKey] = behavior;
          behavior.bind.apply(behavior, [binding, scope].concat(evalList(scope, this.args, binding.lookupFunctions)));
        };

        BindingBehavior.prototype.unbind = function unbind(binding, scope) {
          var behaviorKey = 'behavior-' + this.name;
          binding[behaviorKey].unbind(binding, scope);
          binding[behaviorKey] = null;
          if (this.expression.expression && this.expression.unbind) {
            this.expression.unbind(binding, scope);
          }
        };

        return BindingBehavior;
      })(Expression);

      _export('BindingBehavior', BindingBehavior);

      ValueConverter = (function (_Expression3) {
        _inherits(ValueConverter, _Expression3);

        function ValueConverter(expression, name, args, allArgs) {
          _classCallCheck(this, ValueConverter);

          _Expression3.call(this);

          this.expression = expression;
          this.name = name;
          this.args = args;
          this.allArgs = allArgs;
        }

        ValueConverter.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var converter = lookupFunctions.valueConverters(this.name);
          if (!converter) {
            throw new Error('No ValueConverter named "' + this.name + '" was found!');
          }

          if ('toView' in converter) {
            return converter.toView.apply(converter, evalList(scope, this.allArgs, lookupFunctions));
          }

          return this.allArgs[0].evaluate(scope, lookupFunctions);
        };

        ValueConverter.prototype.assign = function assign(scope, value, lookupFunctions) {
          var converter = lookupFunctions.valueConverters(this.name);
          if (!converter) {
            throw new Error('No ValueConverter named "' + this.name + '" was found!');
          }

          if ('fromView' in converter) {
            value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, lookupFunctions)));
          }

          return this.allArgs[0].assign(scope, value, lookupFunctions);
        };

        ValueConverter.prototype.accept = function accept(visitor) {
          visitor.visitValueConverter(this);
        };

        ValueConverter.prototype.connect = function connect(binding, scope) {
          var expressions = this.allArgs;
          var i = expressions.length;
          while (i--) {
            expressions[i].connect(binding, scope);
          }
        };

        return ValueConverter;
      })(Expression);

      _export('ValueConverter', ValueConverter);

      Assign = (function (_Expression4) {
        _inherits(Assign, _Expression4);

        function Assign(target, value) {
          _classCallCheck(this, Assign);

          _Expression4.call(this);

          this.target = target;
          this.value = value;
        }

        Assign.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          return this.target.assign(scope, this.value.evaluate(scope, lookupFunctions));
        };

        Assign.prototype.accept = function accept(vistor) {
          vistor.visitAssign(this);
        };

        Assign.prototype.connect = function connect(binding, scope) {};

        return Assign;
      })(Expression);

      _export('Assign', Assign);

      Conditional = (function (_Expression5) {
        _inherits(Conditional, _Expression5);

        function Conditional(condition, yes, no) {
          _classCallCheck(this, Conditional);

          _Expression5.call(this);

          this.condition = condition;
          this.yes = yes;
          this.no = no;
        }

        Conditional.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          return !!this.condition.evaluate(scope) ? this.yes.evaluate(scope) : this.no.evaluate(scope);
        };

        Conditional.prototype.accept = function accept(visitor) {
          visitor.visitConditional(this);
        };

        Conditional.prototype.connect = function connect(binding, scope) {
          this.condition.connect(binding, scope);
          if (this.condition.evaluate(scope)) {
            this.yes.connect(binding, scope);
          } else {
            this.no.connect(binding, scope);
          }
        };

        return Conditional;
      })(Expression);

      _export('Conditional', Conditional);

      AccessThis = (function (_Expression6) {
        _inherits(AccessThis, _Expression6);

        function AccessThis(ancestor) {
          _classCallCheck(this, AccessThis);

          _Expression6.call(this);
          this.ancestor = ancestor;
        }

        AccessThis.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var oc = scope.overrideContext;
          var i = this.ancestor;
          while (i-- && oc) {
            oc = oc.parentOverrideContext;
          }
          return i < 1 && oc ? oc.bindingContext : undefined;
        };

        AccessThis.prototype.accept = function accept(visitor) {
          visitor.visitAccessThis(this);
        };

        AccessThis.prototype.connect = function connect(binding, scope) {};

        return AccessThis;
      })(Expression);

      _export('AccessThis', AccessThis);

      AccessScope = (function (_Expression7) {
        _inherits(AccessScope, _Expression7);

        function AccessScope(name, ancestor) {
          _classCallCheck(this, AccessScope);

          _Expression7.call(this);

          this.name = name;
          this.ancestor = ancestor;
          this.isAssignable = true;
        }

        AccessScope.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var context = getContextFor(this.name, scope, this.ancestor);
          return context[this.name];
        };

        AccessScope.prototype.assign = function assign(scope, value) {
          var context = getContextFor(this.name, scope, this.ancestor);
          return context[this.name] = value;
        };

        AccessScope.prototype.accept = function accept(visitor) {
          visitor.visitAccessScope(this);
        };

        AccessScope.prototype.connect = function connect(binding, scope) {
          var context = getContextFor(this.name, scope, this.ancestor);
          binding.observeProperty(context, this.name);
        };

        return AccessScope;
      })(Expression);

      _export('AccessScope', AccessScope);

      AccessMember = (function (_Expression8) {
        _inherits(AccessMember, _Expression8);

        function AccessMember(object, name) {
          _classCallCheck(this, AccessMember);

          _Expression8.call(this);

          this.object = object;
          this.name = name;
          this.isAssignable = true;
        }

        AccessMember.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var instance = this.object.evaluate(scope, lookupFunctions);
          return instance === null || instance === undefined ? instance : instance[this.name];
        };

        AccessMember.prototype.assign = function assign(scope, value) {
          var instance = this.object.evaluate(scope);

          if (instance === null || instance === undefined) {
            instance = {};
            this.object.assign(scope, instance);
          }

          return instance[this.name] = value;
        };

        AccessMember.prototype.accept = function accept(visitor) {
          visitor.visitAccessMember(this);
        };

        AccessMember.prototype.connect = function connect(binding, scope) {
          this.object.connect(binding, scope);
          var obj = this.object.evaluate(scope);
          if (obj) {
            binding.observeProperty(obj, this.name);
          }
        };

        return AccessMember;
      })(Expression);

      _export('AccessMember', AccessMember);

      AccessKeyed = (function (_Expression9) {
        _inherits(AccessKeyed, _Expression9);

        function AccessKeyed(object, key) {
          _classCallCheck(this, AccessKeyed);

          _Expression9.call(this);

          this.object = object;
          this.key = key;
          this.isAssignable = true;
        }

        AccessKeyed.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var instance = this.object.evaluate(scope, lookupFunctions);
          var lookup = this.key.evaluate(scope, lookupFunctions);
          return getKeyed(instance, lookup);
        };

        AccessKeyed.prototype.assign = function assign(scope, value) {
          var instance = this.object.evaluate(scope);
          var lookup = this.key.evaluate(scope);
          return setKeyed(instance, lookup, value);
        };

        AccessKeyed.prototype.accept = function accept(visitor) {
          visitor.visitAccessKeyed(this);
        };

        AccessKeyed.prototype.connect = function connect(binding, scope) {
          this.object.connect(binding, scope);
          var obj = this.object.evaluate(scope);
          if (obj instanceof Object) {
            this.key.connect(binding, scope);
            var key = this.key.evaluate(scope);
            if (key !== null && key !== undefined) {
              binding.observeProperty(obj, key);
            }
          }
        };

        return AccessKeyed;
      })(Expression);

      _export('AccessKeyed', AccessKeyed);

      CallScope = (function (_Expression10) {
        _inherits(CallScope, _Expression10);

        function CallScope(name, args, ancestor) {
          _classCallCheck(this, CallScope);

          _Expression10.call(this);

          this.name = name;
          this.args = args;
          this.ancestor = ancestor;
        }

        CallScope.prototype.evaluate = function evaluate(scope, lookupFunctions, mustEvaluate) {
          var args = evalList(scope, this.args, lookupFunctions);
          var context = getContextFor(this.name, scope, this.ancestor);
          var func = getFunction(context, this.name, mustEvaluate);
          if (func) {
            return func.apply(context, args);
          }
          return undefined;
        };

        CallScope.prototype.accept = function accept(visitor) {
          visitor.visitCallScope(this);
        };

        CallScope.prototype.connect = function connect(binding, scope) {
          var args = this.args;
          var i = args.length;
          while (i--) {
            args[i].connect(binding, scope);
          }
        };

        return CallScope;
      })(Expression);

      _export('CallScope', CallScope);

      CallMember = (function (_Expression11) {
        _inherits(CallMember, _Expression11);

        function CallMember(object, name, args) {
          _classCallCheck(this, CallMember);

          _Expression11.call(this);

          this.object = object;
          this.name = name;
          this.args = args;
        }

        CallMember.prototype.evaluate = function evaluate(scope, lookupFunctions, mustEvaluate) {
          var instance = this.object.evaluate(scope, lookupFunctions);
          var args = evalList(scope, this.args, lookupFunctions);
          var func = getFunction(instance, this.name, mustEvaluate);
          if (func) {
            return func.apply(instance, args);
          }
          return undefined;
        };

        CallMember.prototype.accept = function accept(visitor) {
          visitor.visitCallMember(this);
        };

        CallMember.prototype.connect = function connect(binding, scope) {
          this.object.connect(binding, scope);
          var obj = this.object.evaluate(scope);
          if (getFunction(obj, this.name, false)) {
            var args = this.args;
            var i = args.length;
            while (i--) {
              args[i].connect(binding, scope);
            }
          }
        };

        return CallMember;
      })(Expression);

      _export('CallMember', CallMember);

      CallFunction = (function (_Expression12) {
        _inherits(CallFunction, _Expression12);

        function CallFunction(func, args) {
          _classCallCheck(this, CallFunction);

          _Expression12.call(this);

          this.func = func;
          this.args = args;
        }

        CallFunction.prototype.evaluate = function evaluate(scope, lookupFunctions, mustEvaluate) {
          var func = this.func.evaluate(scope, lookupFunctions);
          if (typeof func === 'function') {
            return func.apply(null, evalList(scope, this.args, lookupFunctions));
          }
          if (!mustEvaluate && (func === null || func === undefined)) {
            return undefined;
          }
          throw new Error(this.func + ' is not a function');
        };

        CallFunction.prototype.accept = function accept(visitor) {
          visitor.visitCallFunction(this);
        };

        CallFunction.prototype.connect = function connect(binding, scope) {
          this.func.connect(binding, scope);
          var func = this.func.evaluate(scope);
          if (typeof func === 'function') {
            var args = this.args;
            var i = args.length;
            while (i--) {
              args[i].connect(binding, scope);
            }
          }
        };

        return CallFunction;
      })(Expression);

      _export('CallFunction', CallFunction);

      Binary = (function (_Expression13) {
        _inherits(Binary, _Expression13);

        function Binary(operation, left, right) {
          _classCallCheck(this, Binary);

          _Expression13.call(this);

          this.operation = operation;
          this.left = left;
          this.right = right;
        }

        Binary.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var left = this.left.evaluate(scope);

          switch (this.operation) {
            case '&&':
              return left && this.right.evaluate(scope);
            case '||':
              return left || this.right.evaluate(scope);
          }

          var right = this.right.evaluate(scope);

          switch (this.operation) {
            case '==':
              return left == right;
            case '===':
              return left === right;
            case '!=':
              return left != right;
            case '!==':
              return left !== right;
          }

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
            case '+':
              return autoConvertAdd(left, right);
            case '-':
              return left - right;
            case '*':
              return left * right;
            case '/':
              return left / right;
            case '%':
              return left % right;
            case '<':
              return left < right;
            case '>':
              return left > right;
            case '<=':
              return left <= right;
            case '>=':
              return left >= right;
            case '^':
              return left ^ right;
          }

          throw new Error('Internal error [' + this.operation + '] not handled');
        };

        Binary.prototype.accept = function accept(visitor) {
          visitor.visitBinary(this);
        };

        Binary.prototype.connect = function connect(binding, scope) {
          this.left.connect(binding, scope);
          var left = this.left.evaluate(scope);
          if (this.operation === '&&' && !left || this.operation === '||' && left) {
            return;
          }
          this.right.connect(binding, scope);
        };

        return Binary;
      })(Expression);

      _export('Binary', Binary);

      PrefixNot = (function (_Expression14) {
        _inherits(PrefixNot, _Expression14);

        function PrefixNot(operation, expression) {
          _classCallCheck(this, PrefixNot);

          _Expression14.call(this);

          this.operation = operation;
          this.expression = expression;
        }

        PrefixNot.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          return !this.expression.evaluate(scope);
        };

        PrefixNot.prototype.accept = function accept(visitor) {
          visitor.visitPrefix(this);
        };

        PrefixNot.prototype.connect = function connect(binding, scope) {
          this.expression.connect(binding, scope);
        };

        return PrefixNot;
      })(Expression);

      _export('PrefixNot', PrefixNot);

      LiteralPrimitive = (function (_Expression15) {
        _inherits(LiteralPrimitive, _Expression15);

        function LiteralPrimitive(value) {
          _classCallCheck(this, LiteralPrimitive);

          _Expression15.call(this);

          this.value = value;
        }

        LiteralPrimitive.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          return this.value;
        };

        LiteralPrimitive.prototype.accept = function accept(visitor) {
          visitor.visitLiteralPrimitive(this);
        };

        LiteralPrimitive.prototype.connect = function connect(binding, scope) {};

        return LiteralPrimitive;
      })(Expression);

      _export('LiteralPrimitive', LiteralPrimitive);

      LiteralString = (function (_Expression16) {
        _inherits(LiteralString, _Expression16);

        function LiteralString(value) {
          _classCallCheck(this, LiteralString);

          _Expression16.call(this);

          this.value = value;
        }

        LiteralString.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          return this.value;
        };

        LiteralString.prototype.accept = function accept(visitor) {
          visitor.visitLiteralString(this);
        };

        LiteralString.prototype.connect = function connect(binding, scope) {};

        return LiteralString;
      })(Expression);

      _export('LiteralString', LiteralString);

      LiteralArray = (function (_Expression17) {
        _inherits(LiteralArray, _Expression17);

        function LiteralArray(elements) {
          _classCallCheck(this, LiteralArray);

          _Expression17.call(this);

          this.elements = elements;
        }

        LiteralArray.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var elements = this.elements,
              length = elements.length,
              result = [],
              i;

          for (i = 0; i < length; ++i) {
            result[i] = elements[i].evaluate(scope, lookupFunctions);
          }

          return result;
        };

        LiteralArray.prototype.accept = function accept(visitor) {
          visitor.visitLiteralArray(this);
        };

        LiteralArray.prototype.connect = function connect(binding, scope) {
          var length = this.elements.length;
          for (var i = 0; i < length; i++) {
            this.elements[i].connect(binding, scope);
          }
        };

        return LiteralArray;
      })(Expression);

      _export('LiteralArray', LiteralArray);

      LiteralObject = (function (_Expression18) {
        _inherits(LiteralObject, _Expression18);

        function LiteralObject(keys, values) {
          _classCallCheck(this, LiteralObject);

          _Expression18.call(this);

          this.keys = keys;
          this.values = values;
        }

        LiteralObject.prototype.evaluate = function evaluate(scope, lookupFunctions) {
          var instance = {},
              keys = this.keys,
              values = this.values,
              length = keys.length,
              i;

          for (i = 0; i < length; ++i) {
            instance[keys[i]] = values[i].evaluate(scope, lookupFunctions);
          }

          return instance;
        };

        LiteralObject.prototype.accept = function accept(visitor) {
          visitor.visitLiteralObject(this);
        };

        LiteralObject.prototype.connect = function connect(binding, scope) {
          var length = this.keys.length;
          for (var i = 0; i < length; i++) {
            this.values[i].connect(binding, scope);
          }
        };

        return LiteralObject;
      })(Expression);

      _export('LiteralObject', LiteralObject);

      Unparser = (function () {
        function Unparser(buffer) {
          _classCallCheck(this, Unparser);

          this.buffer = buffer;
        }

        Unparser.unparse = function unparse(expression) {
          var buffer = [],
              visitor = new Unparser(buffer);

          expression.accept(visitor);

          return buffer.join('');
        };

        Unparser.prototype.write = function write(text) {
          this.buffer.push(text);
        };

        Unparser.prototype.writeArgs = function writeArgs(args) {
          var i, length;

          this.write('(');

          for (i = 0, length = args.length; i < length; ++i) {
            if (i !== 0) {
              this.write(',');
            }

            args[i].accept(this);
          }

          this.write(')');
        };

        Unparser.prototype.visitChain = function visitChain(chain) {
          var expressions = chain.expressions,
              length = expressions.length,
              i;

          for (i = 0; i < length; ++i) {
            if (i !== 0) {
              this.write(';');
            }

            expressions[i].accept(this);
          }
        };

        Unparser.prototype.visitBindingBehavior = function visitBindingBehavior(behavior) {
          var args = behavior.args,
              length = args.length,
              i;

          this.write('(');
          behavior.expression.accept(this);
          this.write('&' + behavior.name);

          for (i = 0; i < length; ++i) {
            this.write(' :');
            args[i].accept(this);
          }

          this.write(')');
        };

        Unparser.prototype.visitValueConverter = function visitValueConverter(converter) {
          var args = converter.args,
              length = args.length,
              i;

          this.write('(');
          converter.expression.accept(this);
          this.write('|' + converter.name);

          for (i = 0; i < length; ++i) {
            this.write(' :');
            args[i].accept(this);
          }

          this.write(')');
        };

        Unparser.prototype.visitAssign = function visitAssign(assign) {
          assign.target.accept(this);
          this.write('=');
          assign.value.accept(this);
        };

        Unparser.prototype.visitConditional = function visitConditional(conditional) {
          conditional.condition.accept(this);
          this.write('?');
          conditional.yes.accept(this);
          this.write(':');
          conditional.no.accept(this);
        };

        Unparser.prototype.visitAccessThis = function visitAccessThis(access) {
          if (access.ancestor === 0) {
            this.write('$this');
            return;
          }
          this.write('$parent');
          var i = access.ancestor - 1;
          while (i--) {
            this.write('.$parent');
          }
        };

        Unparser.prototype.visitAccessScope = function visitAccessScope(access) {
          var i = access.ancestor;
          while (i--) {
            this.write('$parent.');
          }
          this.write(access.name);
        };

        Unparser.prototype.visitAccessMember = function visitAccessMember(access) {
          access.object.accept(this);
          this.write('.' + access.name);
        };

        Unparser.prototype.visitAccessKeyed = function visitAccessKeyed(access) {
          access.object.accept(this);
          this.write('[');
          access.key.accept(this);
          this.write(']');
        };

        Unparser.prototype.visitCallScope = function visitCallScope(call) {
          var i = call.ancestor;
          while (i--) {
            this.write('$parent.');
          }
          this.write(call.name);
          this.writeArgs(call.args);
        };

        Unparser.prototype.visitCallFunction = function visitCallFunction(call) {
          call.func.accept(this);
          this.writeArgs(call.args);
        };

        Unparser.prototype.visitCallMember = function visitCallMember(call) {
          call.object.accept(this);
          this.write('.' + call.name);
          this.writeArgs(call.args);
        };

        Unparser.prototype.visitPrefix = function visitPrefix(prefix) {
          this.write('(' + prefix.operation);
          prefix.expression.accept(this);
          this.write(')');
        };

        Unparser.prototype.visitBinary = function visitBinary(binary) {
          this.write('(');
          binary.left.accept(this);
          this.write(binary.operation);
          binary.right.accept(this);
          this.write(')');
        };

        Unparser.prototype.visitLiteralPrimitive = function visitLiteralPrimitive(literal) {
          this.write('' + literal.value);
        };

        Unparser.prototype.visitLiteralArray = function visitLiteralArray(literal) {
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
        };

        Unparser.prototype.visitLiteralObject = function visitLiteralObject(literal) {
          var keys = literal.keys,
              values = literal.values,
              length = keys.length,
              i;

          this.write('{');

          for (i = 0; i < length; ++i) {
            if (i !== 0) {
              this.write(',');
            }

            this.write('\'' + keys[i] + '\':');
            values[i].accept(this);
          }

          this.write('}');
        };

        Unparser.prototype.visitLiteralString = function visitLiteralString(literal) {
          var escaped = literal.value.replace(/'/g, "\'");
          this.write('\'' + escaped + '\'');
        };

        return Unparser;
      })();

      _export('Unparser', Unparser);

      evalListCache = [[], [0], [0, 0], [0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0, 0]];
      bindingMode = {
        oneTime: 0,
        oneWay: 1,
        twoWay: 2
      };

      _export('bindingMode', bindingMode);

      Token = (function () {
        function Token(index, text) {
          _classCallCheck(this, Token);

          this.index = index;
          this.text = text;
        }

        Token.prototype.withOp = function withOp(op) {
          this.opKey = op;
          return this;
        };

        Token.prototype.withGetterSetter = function withGetterSetter(key) {
          this.key = key;
          return this;
        };

        Token.prototype.withValue = function withValue(value) {
          this.value = value;
          return this;
        };

        Token.prototype.toString = function toString() {
          return 'Token(' + this.text + ')';
        };

        return Token;
      })();

      _export('Token', Token);

      Lexer = (function () {
        function Lexer() {
          _classCallCheck(this, Lexer);
        }

        Lexer.prototype.lex = function lex(text) {
          var scanner = new Scanner(text);
          var tokens = [];
          var token = scanner.scanToken();

          while (token) {
            tokens.push(token);
            token = scanner.scanToken();
          }

          return tokens;
        };

        return Lexer;
      })();

      _export('Lexer', Lexer);

      Scanner = (function () {
        function Scanner(input) {
          _classCallCheck(this, Scanner);

          this.input = input;
          this.length = input.length;
          this.peek = 0;
          this.index = -1;

          this.advance();
        }

        Scanner.prototype.scanToken = function scanToken() {
          while (this.peek <= $SPACE) {
            if (++this.index >= this.length) {
              this.peek = $EOF;
              return null;
            } else {
              this.peek = this.input.charCodeAt(this.index);
            }
          }

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
              while (isWhitespace(this.peek)) {
                this.advance();
              }

              return this.scanToken();
          }

          var character = String.fromCharCode(this.peek);
          this.error('Unexpected character [' + character + ']');
          return null;
        };

        Scanner.prototype.scanCharacter = function scanCharacter(start, text) {
          assert(this.peek === text.charCodeAt(0));
          this.advance();
          return new Token(start, text);
        };

        Scanner.prototype.scanOperator = function scanOperator(start, text) {
          assert(this.peek === text.charCodeAt(0));
          assert(OPERATORS.indexOf(text) !== -1);
          this.advance();
          return new Token(start, text).withOp(text);
        };

        Scanner.prototype.scanComplexOperator = function scanComplexOperator(start, code, one, two) {
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
        };

        Scanner.prototype.scanIdentifier = function scanIdentifier() {
          assert(isIdentifierStart(this.peek));
          var start = this.index;

          this.advance();

          while (isIdentifierPart(this.peek)) {
            this.advance();
          }

          var text = this.input.substring(start, this.index);
          var result = new Token(start, text);

          if (OPERATORS.indexOf(text) !== -1) {
            result.withOp(text);
          } else {
            result.withGetterSetter(text);
          }

          return result;
        };

        Scanner.prototype.scanNumber = function scanNumber(start) {
          assert(isDigit(this.peek));
          var simple = this.index === start;
          this.advance();

          while (true) {
            if (isDigit(this.peek)) {} else if (this.peek === $PERIOD) {
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

            this.advance();
          }

          var text = this.input.substring(start, this.index);
          var value = simple ? parseInt(text) : parseFloat(text);
          return new Token(start, text).withValue(value);
        };

        Scanner.prototype.scanString = function scanString() {
          assert(this.peek === $SQ || this.peek === $DQ);

          var start = this.index;
          var quote = this.peek;

          this.advance();

          var buffer = undefined;
          var marker = this.index;

          while (this.peek !== quote) {
            if (this.peek === $BACKSLASH) {
              if (!buffer) {
                buffer = [];
              }

              buffer.push(this.input.substring(marker, this.index));
              this.advance();

              var _unescaped = undefined;

              if (this.peek === $u) {
                var hex = this.input.substring(this.index + 1, this.index + 5);

                if (!/[A-Z0-9]{4}/.test(hex)) {
                  this.error('Invalid unicode escape [\\u' + hex + ']');
                }

                _unescaped = parseInt(hex, 16);

                for (var i = 0; i < 5; ++i) {
                  this.advance();
                }
              } else {
                _unescaped = unescape(this.peek);
                this.advance();
              }

              buffer.push(String.fromCharCode(_unescaped));
              marker = this.index;
            } else if (this.peek === $EOF) {
              this.error('Unterminated quote');
            } else {
              this.advance();
            }
          }

          var last = this.input.substring(marker, this.index);
          this.advance();
          var text = this.input.substring(start, this.index);

          var unescaped = last;

          if (buffer != null) {
            buffer.push(last);
            unescaped = buffer.join('');
          }

          return new Token(start, text).withValue(unescaped);
        };

        Scanner.prototype.advance = function advance() {
          if (++this.index >= this.length) {
            this.peek = $EOF;
          } else {
            this.peek = this.input.charCodeAt(this.index);
          }
        };

        Scanner.prototype.error = function error(message) {
          var offset = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

          var position = this.index + offset;
          throw new Error('Lexer Error: ' + message + ' at column ' + position + ' in expression [' + this.input + ']');
        };

        return Scanner;
      })();

      _export('Scanner', Scanner);

      OPERATORS = ['undefined', 'null', 'true', 'false', '+', '-', '*', '/', '%', '^', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '&', '|', '!', '?'];
      $EOF = 0;
      $TAB = 9;
      $LF = 10;
      $VTAB = 11;
      $FF = 12;
      $CR = 13;
      $SPACE = 32;
      $BANG = 33;
      $DQ = 34;
      $$ = 36;
      $PERCENT = 37;
      $AMPERSAND = 38;
      $SQ = 39;
      $LPAREN = 40;
      $RPAREN = 41;
      $STAR = 42;
      $PLUS = 43;
      $COMMA = 44;
      $MINUS = 45;
      $PERIOD = 46;
      $SLASH = 47;
      $COLON = 58;
      $SEMICOLON = 59;
      $LT = 60;
      $EQ = 61;
      $GT = 62;
      $QUESTION = 63;
      $0 = 48;
      $9 = 57;
      $A = 65;
      $E = 69;
      $Z = 90;
      $LBRACKET = 91;
      $BACKSLASH = 92;
      $RBRACKET = 93;
      $CARET = 94;
      $_ = 95;
      $a = 97;
      $e = 101;
      $f = 102;
      $n = 110;
      $r = 114;
      $t = 116;
      $u = 117;
      $v = 118;
      $z = 122;
      $LBRACE = 123;
      $BAR = 124;
      $RBRACE = 125;
      $NBSP = 160;
      EOF = new Token(-1, null);

      Parser = (function () {
        function Parser() {
          _classCallCheck(this, Parser);

          this.cache = {};
          this.lexer = new Lexer();
        }

        Parser.prototype.parse = function parse(input) {
          input = input || '';

          return this.cache[input] || (this.cache[input] = new ParserImplementation(this.lexer, input).parseChain());
        };

        return Parser;
      })();

      _export('Parser', Parser);

      ParserImplementation = (function () {
        function ParserImplementation(lexer, input) {
          _classCallCheck(this, ParserImplementation);

          this.index = 0;
          this.input = input;
          this.tokens = lexer.lex(input);
        }

        ParserImplementation.prototype.parseChain = function parseChain() {
          var isChain = false;
          var expressions = [];

          while (this.optional(';')) {
            isChain = true;
          }

          while (this.index < this.tokens.length) {
            if (this.peek.text === ')' || this.peek.text === '}' || this.peek.text === ']') {
              this.error('Unconsumed token ' + this.peek.text);
            }

            var expr = this.parseBindingBehavior();
            expressions.push(expr);

            while (this.optional(';')) {
              isChain = true;
            }

            if (isChain) {
              this.error('Multiple expressions are not allowed.');
            }
          }

          return expressions.length === 1 ? expressions[0] : new Chain(expressions);
        };

        ParserImplementation.prototype.parseBindingBehavior = function parseBindingBehavior() {
          var result = this.parseValueConverter();

          while (this.optional('&')) {
            var _name = this.peek.text;
            var args = [];

            this.advance();

            while (this.optional(':')) {
              args.push(this.parseExpression());
            }

            result = new BindingBehavior(result, _name, args);
          }

          return result;
        };

        ParserImplementation.prototype.parseValueConverter = function parseValueConverter() {
          var result = this.parseExpression();

          while (this.optional('|')) {
            var _name2 = this.peek.text;
            var args = [];

            this.advance();

            while (this.optional(':')) {
              args.push(this.parseExpression());
            }

            result = new ValueConverter(result, _name2, args, [result].concat(args));
          }

          return result;
        };

        ParserImplementation.prototype.parseExpression = function parseExpression() {
          var start = this.peek.index;
          var result = this.parseConditional();

          while (this.peek.text === '=') {
            if (!result.isAssignable) {
              var end = this.index < this.tokens.length ? this.peek.index : this.input.length;
              var expression = this.input.substring(start, end);

              this.error('Expression ' + expression + ' is not assignable');
            }

            this.expect('=');
            result = new Assign(result, this.parseConditional());
          }

          return result;
        };

        ParserImplementation.prototype.parseConditional = function parseConditional() {
          var start = this.peek.index;
          var result = this.parseLogicalOr();

          if (this.optional('?')) {
            var yes = this.parseExpression();

            if (!this.optional(':')) {
              var end = this.index < this.tokens.length ? this.peek.index : this.input.length;
              var expression = this.input.substring(start, end);

              this.error('Conditional expression ' + expression + ' requires all 3 expressions');
            }

            var no = this.parseExpression();
            result = new Conditional(result, yes, no);
          }

          return result;
        };

        ParserImplementation.prototype.parseLogicalOr = function parseLogicalOr() {
          var result = this.parseLogicalAnd();

          while (this.optional('||')) {
            result = new Binary('||', result, this.parseLogicalAnd());
          }

          return result;
        };

        ParserImplementation.prototype.parseLogicalAnd = function parseLogicalAnd() {
          var result = this.parseEquality();

          while (this.optional('&&')) {
            result = new Binary('&&', result, this.parseEquality());
          }

          return result;
        };

        ParserImplementation.prototype.parseEquality = function parseEquality() {
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
        };

        ParserImplementation.prototype.parseRelational = function parseRelational() {
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
        };

        ParserImplementation.prototype.parseAdditive = function parseAdditive() {
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
        };

        ParserImplementation.prototype.parseMultiplicative = function parseMultiplicative() {
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
        };

        ParserImplementation.prototype.parsePrefix = function parsePrefix() {
          if (this.optional('+')) {
            return this.parsePrefix();
          } else if (this.optional('-')) {
              return new Binary('-', new LiteralPrimitive(0), this.parsePrefix());
            } else if (this.optional('!')) {
              return new PrefixNot('!', this.parsePrefix());
            } else {
              return this.parseAccessOrCallMember();
            }
        };

        ParserImplementation.prototype.parseAccessOrCallMember = function parseAccessOrCallMember() {
          var result = this.parsePrimary();

          while (true) {
            if (this.optional('.')) {
              var _name3 = this.peek.text;

              this.advance();

              if (this.optional('(')) {
                var args = this.parseExpressionList(')');
                this.expect(')');
                if (result instanceof AccessThis) {
                  result = new CallScope(_name3, args, result.ancestor);
                } else {
                  result = new CallMember(result, _name3, args);
                }
              } else {
                if (result instanceof AccessThis) {
                  result = new AccessScope(_name3, result.ancestor);
                } else {
                  result = new AccessMember(result, _name3);
                }
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
        };

        ParserImplementation.prototype.parsePrimary = function parsePrimary() {
          if (this.optional('(')) {
            var result = this.parseExpression();
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
            var _elements = this.parseExpressionList(']');
            this.expect(']');
            return new LiteralArray(_elements);
          } else if (this.peek.text == '{') {
            return this.parseObject();
          } else if (this.peek.key != null) {
            return this.parseAccessOrCallScope();
          } else if (this.peek.value != null) {
            var value = this.peek.value;
            this.advance();
            return value instanceof String || typeof value === 'string' ? new LiteralString(value) : new LiteralPrimitive(value);
          } else if (this.index >= this.tokens.length) {
            throw new Error('Unexpected end of expression: ' + this.input);
          } else {
            this.error('Unexpected token ' + this.peek.text);
          }
        };

        ParserImplementation.prototype.parseAccessOrCallScope = function parseAccessOrCallScope() {
          var name = this.peek.key;

          this.advance();

          if (name === '$this') {
            return new AccessThis(0);
          }

          var ancestor = 0;
          while (name === '$parent') {
            ancestor++;
            if (this.optional('.')) {
              name = this.peek.key;
              this.advance();
            } else if (this.peek === EOF || this.peek.text === '(' || this.peek.text === '[' || this.peek.text === '}') {
              return new AccessThis(ancestor);
            } else {
              this.error('Unexpected token ' + this.peek.text);
            }
          }

          if (this.optional('(')) {
            var args = this.parseExpressionList(')');
            this.expect(')');
            return new CallScope(name, args, ancestor);
          }

          return new AccessScope(name, ancestor);
        };

        ParserImplementation.prototype.parseObject = function parseObject() {
          var keys = [];
          var values = [];

          this.expect('{');

          if (this.peek.text !== '}') {
            do {
              var value = this.peek.value;
              keys.push(typeof value === 'string' ? value : this.peek.text);

              this.advance();
              this.expect(':');

              values.push(this.parseExpression());
            } while (this.optional(','));
          }

          this.expect('}');

          return new LiteralObject(keys, values);
        };

        ParserImplementation.prototype.parseExpressionList = function parseExpressionList(terminator) {
          var result = [];

          if (this.peek.text != terminator) {
            do {
              result.push(this.parseExpression());
            } while (this.optional(','));
          }

          return result;
        };

        ParserImplementation.prototype.optional = function optional(text) {
          if (this.peek.text === text) {
            this.advance();
            return true;
          }

          return false;
        };

        ParserImplementation.prototype.expect = function expect(text) {
          if (this.peek.text === text) {
            this.advance();
          } else {
            this.error('Missing expected ' + text);
          }
        };

        ParserImplementation.prototype.advance = function advance() {
          this.index++;
        };

        ParserImplementation.prototype.error = function error(message) {
          var location = this.index < this.tokens.length ? 'at column ' + (this.tokens[this.index].index + 1) + ' in' : 'at the end of the expression';

          throw new Error('Parser Error: ' + message + ' ' + location + ' [' + this.input + ']');
        };

        _createClass(ParserImplementation, [{
          key: 'peek',
          get: function get() {
            return this.index < this.tokens.length ? this.tokens[this.index] : EOF;
          }
        }]);

        return ParserImplementation;
      })();

      _export('ParserImplementation', ParserImplementation);

      mapProto = Map.prototype;

      ModifyMapObserver = (function (_ModifyCollectionObserver3) {
        _inherits(ModifyMapObserver, _ModifyCollectionObserver3);

        function ModifyMapObserver(taskQueue, map) {
          _classCallCheck(this, ModifyMapObserver);

          _ModifyCollectionObserver3.call(this, taskQueue, map);
        }

        ModifyMapObserver.create = function create(taskQueue, map) {
          var observer = new ModifyMapObserver(taskQueue, map);

          map['set'] = function () {
            var oldValue = map.get(arguments[0]);
            var type = typeof oldValue !== 'undefined' ? 'update' : 'add';
            var methodCallResult = mapProto['set'].apply(map, arguments);
            observer.addChangeRecord({
              type: type,
              object: map,
              key: arguments[0],
              oldValue: oldValue
            });
            return methodCallResult;
          };

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
          };

          map['clear'] = function () {
            var methodCallResult = mapProto['clear'].apply(map, arguments);
            observer.addChangeRecord({
              type: 'clear',
              object: map
            });
            return methodCallResult;
          };

          return observer;
        };

        return ModifyMapObserver;
      })(ModifyCollectionObserver);

      DelegateHandlerEntry = (function () {
        function DelegateHandlerEntry(eventName) {
          _classCallCheck(this, DelegateHandlerEntry);

          this.eventName = eventName;
          this.count = 0;
        }

        DelegateHandlerEntry.prototype.increment = function increment() {
          this.count++;

          if (this.count === 1) {
            DOM.addEventListener(this.eventName, handleDelegatedEvent, false);
          }
        };

        DelegateHandlerEntry.prototype.decrement = function decrement() {
          this.count--;

          if (this.count === 0) {
            DOM.removeEventListener(this.eventName, handleDelegatedEvent);
          }
        };

        return DelegateHandlerEntry;
      })();

      DefaultEventStrategy = (function () {
        function DefaultEventStrategy() {
          _classCallCheck(this, DefaultEventStrategy);

          this.delegatedHandlers = [];
        }

        DefaultEventStrategy.prototype.subscribe = function subscribe(target, targetEvent, callback, delegate) {
          var _this = this;

          if (delegate) {
            var _ret = (function () {
              var delegatedHandlers = _this.delegatedHandlers;
              var handlerEntry = delegatedHandlers[targetEvent] || (delegatedHandlers[targetEvent] = new DelegateHandlerEntry(targetEvent));
              var delegatedCallbacks = target.delegatedCallbacks || (target.delegatedCallbacks = {});

              handlerEntry.increment();
              delegatedCallbacks[targetEvent] = callback;

              return {
                v: function () {
                  handlerEntry.decrement();
                  delegatedCallbacks[targetEvent] = null;
                }
              };
            })();

            if (typeof _ret === 'object') return _ret.v;
          } else {
            target.addEventListener(targetEvent, callback, false);

            return function () {
              target.removeEventListener(targetEvent, callback);
            };
          }
        };

        return DefaultEventStrategy;
      })();

      EventManager = (function () {
        function EventManager() {
          _classCallCheck(this, EventManager);

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

        EventManager.prototype.registerElementConfig = function registerElementConfig(config) {
          var tagName = config.tagName.toLowerCase();
          var properties = config.properties;
          var propertyName = undefined;

          this.elementHandlerLookup[tagName] = {};

          for (propertyName in properties) {
            if (properties.hasOwnProperty(propertyName)) {
              this.registerElementPropertyConfig(tagName, propertyName, properties[propertyName]);
            }
          }
        };

        EventManager.prototype.registerElementPropertyConfig = function registerElementPropertyConfig(tagName, propertyName, events) {
          this.elementHandlerLookup[tagName][propertyName] = this.createElementHandler(events);
        };

        EventManager.prototype.createElementHandler = function createElementHandler(events) {
          return {
            subscribe: function subscribe(target, callback) {
              events.forEach(function (changeEvent) {
                target.addEventListener(changeEvent, callback, false);
              });

              return function () {
                events.forEach(function (changeEvent) {
                  target.removeEventListener(changeEvent, callback);
                });
              };
            }
          };
        };

        EventManager.prototype.registerElementHandler = function registerElementHandler(tagName, handler) {
          this.elementHandlerLookup[tagName.toLowerCase()] = handler;
        };

        EventManager.prototype.registerEventStrategy = function registerEventStrategy(eventName, strategy) {
          this.eventStrategyLookup[eventName] = strategy;
        };

        EventManager.prototype.getElementHandler = function getElementHandler(target, propertyName) {
          var tagName = undefined;
          var lookup = this.elementHandlerLookup;

          if (target.tagName) {
            tagName = target.tagName.toLowerCase();

            if (lookup[tagName] && lookup[tagName][propertyName]) {
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
        };

        EventManager.prototype.addEventListener = function addEventListener(target, targetEvent, callback, delegate) {
          return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy).subscribe(target, targetEvent, callback, delegate);
        };

        return EventManager;
      })();

      _export('EventManager', EventManager);

      DirtyChecker = (function () {
        function DirtyChecker() {
          _classCallCheck(this, DirtyChecker);

          this.tracked = [];
          this.checkDelay = 120;
        }

        DirtyChecker.prototype.addProperty = function addProperty(property) {
          var tracked = this.tracked;

          tracked.push(property);

          if (tracked.length === 1) {
            this.scheduleDirtyCheck();
          }
        };

        DirtyChecker.prototype.removeProperty = function removeProperty(property) {
          var tracked = this.tracked;
          tracked.splice(tracked.indexOf(property), 1);
        };

        DirtyChecker.prototype.scheduleDirtyCheck = function scheduleDirtyCheck() {
          var _this2 = this;

          setTimeout(function () {
            return _this2.check();
          }, this.checkDelay);
        };

        DirtyChecker.prototype.check = function check() {
          var tracked = this.tracked,
              i = tracked.length;

          while (i--) {
            var current = tracked[i];

            if (current.isDirty()) {
              current.call();
            }
          }

          if (tracked.length) {
            this.scheduleDirtyCheck();
          }
        };

        return DirtyChecker;
      })();

      _export('DirtyChecker', DirtyChecker);

      DirtyCheckProperty = (function () {
        function DirtyCheckProperty(dirtyChecker, obj, propertyName) {
          _classCallCheck(this, _DirtyCheckProperty);

          this.dirtyChecker = dirtyChecker;
          this.obj = obj;
          this.propertyName = propertyName;
        }

        DirtyCheckProperty.prototype.getValue = function getValue() {
          return this.obj[this.propertyName];
        };

        DirtyCheckProperty.prototype.setValue = function setValue(newValue) {
          this.obj[this.propertyName] = newValue;
        };

        DirtyCheckProperty.prototype.call = function call() {
          var oldValue = this.oldValue;
          var newValue = this.getValue();

          this.callSubscribers(newValue, oldValue);

          this.oldValue = newValue;
        };

        DirtyCheckProperty.prototype.isDirty = function isDirty() {
          return this.oldValue !== this.obj[this.propertyName];
        };

        DirtyCheckProperty.prototype.subscribe = function subscribe(context, callable) {
          if (!this.hasSubscribers()) {
            this.oldValue = this.getValue();
            this.dirtyChecker.addProperty(this);
          }
          this.addSubscriber(context, callable);
        };

        DirtyCheckProperty.prototype.unsubscribe = function unsubscribe(context, callable) {
          if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
            this.dirtyChecker.removeProperty(this);
          }
        };

        var _DirtyCheckProperty = DirtyCheckProperty;
        DirtyCheckProperty = subscriberCollection()(DirtyCheckProperty) || DirtyCheckProperty;
        return DirtyCheckProperty;
      })();

      _export('DirtyCheckProperty', DirtyCheckProperty);

      propertyAccessor = {
        getValue: function getValue(obj, propertyName) {
          return obj[propertyName];
        },
        setValue: function setValue(value, obj, propertyName) {
          return obj[propertyName] = value;
        }
      };

      _export('propertyAccessor', propertyAccessor);

      PrimitiveObserver = (function () {
        function PrimitiveObserver(primitive, propertyName) {
          _classCallCheck(this, PrimitiveObserver);

          this.doNotCache = true;

          this.primitive = primitive;
          this.propertyName = propertyName;
        }

        PrimitiveObserver.prototype.getValue = function getValue() {
          return this.primitive[this.propertyName];
        };

        PrimitiveObserver.prototype.setValue = function setValue() {
          var type = typeof this.primitive;
          throw new Error('The ' + this.propertyName + ' property of a ' + type + ' (' + this.primitive + ') cannot be assigned.');
        };

        PrimitiveObserver.prototype.subscribe = function subscribe() {};

        PrimitiveObserver.prototype.unsubscribe = function unsubscribe() {};

        return PrimitiveObserver;
      })();

      _export('PrimitiveObserver', PrimitiveObserver);

      SetterObserver = (function () {
        function SetterObserver(taskQueue, obj, propertyName) {
          _classCallCheck(this, _SetterObserver);

          this.taskQueue = taskQueue;
          this.obj = obj;
          this.propertyName = propertyName;
          this.queued = false;
          this.observing = false;
        }

        SetterObserver.prototype.getValue = function getValue() {
          return this.obj[this.propertyName];
        };

        SetterObserver.prototype.setValue = function setValue(newValue) {
          this.obj[this.propertyName] = newValue;
        };

        SetterObserver.prototype.getterValue = function getterValue() {
          return this.currentValue;
        };

        SetterObserver.prototype.setterValue = function setterValue(newValue) {
          var oldValue = this.currentValue;

          if (oldValue !== newValue) {
            if (!this.queued) {
              this.oldValue = oldValue;
              this.queued = true;
              this.taskQueue.queueMicroTask(this);
            }

            this.currentValue = newValue;
          }
        };

        SetterObserver.prototype.call = function call() {
          var oldValue = this.oldValue;
          var newValue = this.currentValue;

          this.queued = false;

          this.callSubscribers(newValue, oldValue);
        };

        SetterObserver.prototype.subscribe = function subscribe(context, callable) {
          if (!this.observing) {
            this.convertProperty();
          }
          this.addSubscriber(context, callable);
        };

        SetterObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
          this.removeSubscriber(context, callable);
        };

        SetterObserver.prototype.convertProperty = function convertProperty() {
          this.observing = true;
          this.currentValue = this.obj[this.propertyName];
          this.setValue = this.setterValue;
          this.getValue = this.getterValue;

          try {
            Object.defineProperty(this.obj, this.propertyName, {
              configurable: true,
              enumerable: true,
              get: this.getValue.bind(this),
              set: this.setValue.bind(this)
            });
          } catch (_) {}
        };

        var _SetterObserver = SetterObserver;
        SetterObserver = subscriberCollection()(SetterObserver) || SetterObserver;
        return SetterObserver;
      })();

      _export('SetterObserver', SetterObserver);

      XLinkAttributeObserver = (function () {
        function XLinkAttributeObserver(element, propertyName, attributeName) {
          _classCallCheck(this, XLinkAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
          this.attributeName = attributeName;
        }

        XLinkAttributeObserver.prototype.getValue = function getValue() {
          return this.element.getAttributeNS('http://www.w3.org/1999/xlink', this.attributeName);
        };

        XLinkAttributeObserver.prototype.setValue = function setValue(newValue) {
          return this.element.setAttributeNS('http://www.w3.org/1999/xlink', this.attributeName, newValue);
        };

        XLinkAttributeObserver.prototype.subscribe = function subscribe() {
          throw new Error('Observation of a "' + this.element.nodeName + '" element\'s "' + this.propertyName + '" property is not supported.');
        };

        return XLinkAttributeObserver;
      })();

      _export('XLinkAttributeObserver', XLinkAttributeObserver);

      dataAttributeAccessor = {
        getValue: function getValue(obj, propertyName) {
          return obj.getAttribute(propertyName);
        },
        setValue: function setValue(value, obj, propertyName) {
          return obj.setAttribute(propertyName, value);
        }
      };

      _export('dataAttributeAccessor', dataAttributeAccessor);

      DataAttributeObserver = (function () {
        function DataAttributeObserver(element, propertyName) {
          _classCallCheck(this, DataAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
        }

        DataAttributeObserver.prototype.getValue = function getValue() {
          return this.element.getAttribute(this.propertyName);
        };

        DataAttributeObserver.prototype.setValue = function setValue(newValue) {
          return this.element.setAttribute(this.propertyName, newValue);
        };

        DataAttributeObserver.prototype.subscribe = function subscribe() {
          throw new Error('Observation of a "' + this.element.nodeName + '" element\'s "' + this.propertyName + '" property is not supported.');
        };

        return DataAttributeObserver;
      })();

      _export('DataAttributeObserver', DataAttributeObserver);

      StyleObserver = (function () {
        function StyleObserver(element, propertyName) {
          _classCallCheck(this, StyleObserver);

          this.element = element;
          this.propertyName = propertyName;
        }

        StyleObserver.prototype.getValue = function getValue() {
          return this.element.style.cssText;
        };

        StyleObserver.prototype.setValue = function setValue(newValue) {
          if (newValue instanceof Object) {
            newValue = this.flattenCss(newValue);
          }
          this.element.style.cssText = newValue;
        };

        StyleObserver.prototype.subscribe = function subscribe() {
          throw new Error('Observation of a "' + this.element.nodeName + '" element\'s "' + this.propertyName + '" property is not supported.');
        };

        StyleObserver.prototype.flattenCss = function flattenCss(object) {
          var s = '';
          for (var propertyName in object) {
            if (object.hasOwnProperty(propertyName)) {
              s += propertyName + ': ' + object[propertyName] + '; ';
            }
          }
          return s;
        };

        return StyleObserver;
      })();

      _export('StyleObserver', StyleObserver);

      ValueAttributeObserver = (function () {
        function ValueAttributeObserver(element, propertyName, handler) {
          _classCallCheck(this, _ValueAttributeObserver);

          this.element = element;
          this.propertyName = propertyName;
          this.handler = handler;
          if (propertyName === 'files') {
            this.setValue = function () {};
          }
        }

        ValueAttributeObserver.prototype.getValue = function getValue() {
          return this.element[this.propertyName];
        };

        ValueAttributeObserver.prototype.setValue = function setValue(newValue) {
          this.element[this.propertyName] = newValue === undefined || newValue === null ? '' : newValue;

          this.notify();
        };

        ValueAttributeObserver.prototype.notify = function notify() {
          var oldValue = this.oldValue;
          var newValue = this.getValue();

          this.callSubscribers(newValue, oldValue);

          this.oldValue = newValue;
        };

        ValueAttributeObserver.prototype.subscribe = function subscribe(context, callable) {
          if (!this.hasSubscribers()) {
            this.oldValue = this.getValue();
            this.disposeHandler = this.handler.subscribe(this.element, this.notify.bind(this));
          }

          this.addSubscriber(context, callable);
        };

        ValueAttributeObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
          if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
            this.disposeHandler();
            this.disposeHandler = null;
          }
        };

        var _ValueAttributeObserver = ValueAttributeObserver;
        ValueAttributeObserver = subscriberCollection()(ValueAttributeObserver) || ValueAttributeObserver;
        return ValueAttributeObserver;
      })();

      _export('ValueAttributeObserver', ValueAttributeObserver);

      selectArrayContext = 'SelectValueObserver:array';

      SelectValueObserver = (function () {
        function SelectValueObserver(element, handler, observerLocator) {
          _classCallCheck(this, _SelectValueObserver);

          this.element = element;
          this.handler = handler;
          this.observerLocator = observerLocator;
        }

        SelectValueObserver.prototype.getValue = function getValue() {
          return this.value;
        };

        SelectValueObserver.prototype.setValue = function setValue(newValue) {
          if (newValue !== null && newValue !== undefined && this.element.multiple && !Array.isArray(newValue)) {
            throw new Error('Only null or Array instances can be bound to a multi-select.');
          }
          if (this.value === newValue) {
            return;
          }

          if (this.arrayObserver) {
            this.arrayObserver.unsubscribe(selectArrayContext, this);
            this.arrayObserver = null;
          }

          if (Array.isArray(newValue)) {
            this.arrayObserver = this.observerLocator.getArrayObserver(newValue);
            this.arrayObserver.subscribe(selectArrayContext, this);
          }

          this.value = newValue;
          this.synchronizeOptions();

          if (!this.initialSync) {
            this.initialSync = true;
            this.observerLocator.taskQueue.queueMicroTask(this);
          }
        };

        SelectValueObserver.prototype.call = function call(context, splices) {
          this.synchronizeOptions();
        };

        SelectValueObserver.prototype.synchronizeOptions = function synchronizeOptions() {
          var value = this.value,
              clear = undefined,
              isArray = undefined;

          if (value === null || value === undefined) {
            clear = true;
          } else if (Array.isArray(value)) {
            isArray = true;
          }

          var options = this.element.options;
          var i = options.length;
          var matcher = this.element.matcher || function (a, b) {
            return a === b;
          };

          var _loop = function () {
            var option = options.item(i);
            if (clear) {
              option.selected = false;
              return 'continue';
            }
            var optionValue = option.hasOwnProperty('model') ? option.model : option.value;
            if (isArray) {
              option.selected = !!value.find(function (item) {
                return !!matcher(optionValue, item);
              });
              return 'continue';
            }
            option.selected = !!matcher(optionValue, value);
          };

          while (i--) {
            var _ret2 = _loop();

            if (_ret2 === 'continue') continue;
          }
        };

        SelectValueObserver.prototype.synchronizeValue = function synchronizeValue() {
          var _this3 = this;

          var options = this.element.options,
              count = 0,
              value = [];

          for (var i = 0, ii = options.length; i < ii; i++) {
            var option = options.item(i);
            if (!option.selected) {
              continue;
            }
            value.push(option.hasOwnProperty('model') ? option.model : option.value);
            count++;
          }

          if (this.element.multiple) {
            if (Array.isArray(this.value)) {
              var _ret3 = (function () {
                var matcher = _this3.element.matcher || function (a, b) {
                  return a === b;
                };

                var i = 0;

                var _loop2 = function () {
                  var a = _this3.value[i];
                  if (value.findIndex(function (b) {
                    return matcher(a, b);
                  }) === -1) {
                    _this3.value.splice(i, 1);
                  } else {
                    i++;
                  }
                };

                while (i < _this3.value.length) {
                  _loop2();
                }

                i = 0;

                var _loop3 = function () {
                  var a = value[i];
                  if (_this3.value.findIndex(function (b) {
                    return matcher(a, b);
                  }) === -1) {
                    _this3.value.push(a);
                  }
                  i++;
                };

                while (i < value.length) {
                  _loop3();
                }
                return {
                  v: undefined
                };
              })();

              if (typeof _ret3 === 'object') return _ret3.v;
            }
          } else {
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
        };

        SelectValueObserver.prototype.notify = function notify() {
          var oldValue = this.oldValue;
          var newValue = this.value;

          this.callSubscribers(newValue, oldValue);
        };

        SelectValueObserver.prototype.subscribe = function subscribe(context, callable) {
          if (!this.hasSubscribers()) {
            this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
          }
          this.addSubscriber(context, callable);
        };

        SelectValueObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
          if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
            this.disposeHandler();
            this.disposeHandler = null;
          }
        };

        SelectValueObserver.prototype.bind = function bind() {
          var _this4 = this;

          this.domObserver = DOM.createMutationObserver(function () {
            _this4.synchronizeOptions();
            _this4.synchronizeValue();
          });
          this.domObserver.observe(this.element, { childList: true, subtree: true });
        };

        SelectValueObserver.prototype.unbind = function unbind() {
          this.domObserver.disconnect();
          this.domObserver = null;

          if (this.arrayObserver) {
            this.arrayObserver.unsubscribe(selectArrayContext, this);
            this.arrayObserver = null;
          }
        };

        var _SelectValueObserver = SelectValueObserver;
        SelectValueObserver = subscriberCollection()(SelectValueObserver) || SelectValueObserver;
        return SelectValueObserver;
      })();

      _export('SelectValueObserver', SelectValueObserver);

      checkedArrayContext = 'CheckedObserver:array';

      CheckedObserver = (function () {
        function CheckedObserver(element, handler, observerLocator) {
          _classCallCheck(this, _CheckedObserver);

          this.element = element;
          this.handler = handler;
          this.observerLocator = observerLocator;
        }

        CheckedObserver.prototype.getValue = function getValue() {
          return this.value;
        };

        CheckedObserver.prototype.setValue = function setValue(newValue) {
          if (this.value === newValue) {
            return;
          }

          if (this.arrayObserver) {
            this.arrayObserver.unsubscribe(checkedArrayContext, this);
            this.arrayObserver = null;
          }

          if (this.element.type === 'checkbox' && Array.isArray(newValue)) {
            this.arrayObserver = this.observerLocator.getArrayObserver(newValue);
            this.arrayObserver.subscribe(checkedArrayContext, this);
          }

          this.value = newValue;
          this.synchronizeElement();

          if (!this.initialSync) {
            this.initialSync = true;
            this.observerLocator.taskQueue.queueMicroTask(this);
          }
        };

        CheckedObserver.prototype.call = function call(context, splices) {
          this.synchronizeElement();
        };

        CheckedObserver.prototype.synchronizeElement = function synchronizeElement() {
          var value = this.value,
              element = this.element,
              elementValue = element.hasOwnProperty('model') ? element.model : element.value,
              isRadio = element.type === 'radio',
              matcher = element.matcher || function (a, b) {
            return a === b;
          };

          element.checked = isRadio && !!matcher(value, elementValue) || !isRadio && value === true || !isRadio && Array.isArray(value) && !!value.find(function (item) {
            return !!matcher(item, elementValue);
          });
        };

        CheckedObserver.prototype.synchronizeValue = function synchronizeValue() {
          var value = this.value,
              element = this.element,
              elementValue = element.hasOwnProperty('model') ? element.model : element.value,
              index = undefined,
              matcher = element.matcher || function (a, b) {
            return a === b;
          };

          if (element.type === 'checkbox') {
            if (Array.isArray(value)) {
              index = value.findIndex(function (item) {
                return !!matcher(item, elementValue);
              });
              if (element.checked && index === -1) {
                value.push(elementValue);
              } else if (!element.checked && index !== -1) {
                value.splice(index, 1);
              }

              return;
            } else {
              value = element.checked;
            }
          } else if (element.checked) {
            value = elementValue;
          } else {
            return;
          }

          this.oldValue = this.value;
          this.value = value;
          this.notify();
        };

        CheckedObserver.prototype.notify = function notify() {
          var oldValue = this.oldValue;
          var newValue = this.value;

          this.callSubscribers(newValue, oldValue);
        };

        CheckedObserver.prototype.subscribe = function subscribe(context, callable) {
          if (!this.hasSubscribers()) {
            this.disposeHandler = this.handler.subscribe(this.element, this.synchronizeValue.bind(this, false));
          }
          this.addSubscriber(context, callable);
        };

        CheckedObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
          if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
            this.disposeHandler();
            this.disposeHandler = null;
          }
        };

        CheckedObserver.prototype.unbind = function unbind() {
          if (this.arrayObserver) {
            this.arrayObserver.unsubscribe(checkedArrayContext, this);
            this.arrayObserver = null;
          }
        };

        var _CheckedObserver = CheckedObserver;
        CheckedObserver = subscriberCollection()(CheckedObserver) || CheckedObserver;
        return CheckedObserver;
      })();

      _export('CheckedObserver', CheckedObserver);

      ClassObserver = (function () {
        function ClassObserver(element) {
          _classCallCheck(this, ClassObserver);

          this.element = element;
          this.doNotCache = true;
          this.value = '';
          this.version = 0;
        }

        ClassObserver.prototype.getValue = function getValue() {
          return this.value;
        };

        ClassObserver.prototype.setValue = function setValue(newValue) {
          var nameIndex = this.nameIndex || {},
              version = this.version,
              names,
              name;

          if (newValue !== null && newValue !== undefined && newValue.length) {
            names = newValue.split(' ');
            for (var i = 0, _length = names.length; i < _length; i++) {
              name = names[i];
              if (name === '') {
                continue;
              }
              nameIndex[name] = version;
              this.element.classList.add(name);
            }
          }

          this.value = newValue;
          this.nameIndex = nameIndex;
          this.version += 1;

          if (version === 0) {
            return;
          }

          version -= 1;
          for (name in nameIndex) {
            if (!nameIndex.hasOwnProperty(name) || nameIndex[name] !== version) {
              continue;
            }
            this.element.classList.remove(name);
          }
        };

        ClassObserver.prototype.subscribe = function subscribe() {
          throw new Error('Observation of a "' + this.element.nodeName + '" element\'s "class" property is not supported.');
        };

        return ClassObserver;
      })();

      _export('ClassObserver', ClassObserver);

      computedContext = 'ComputedPropertyObserver';

      ComputedPropertyObserver = (function () {
        function ComputedPropertyObserver(obj, propertyName, descriptor, observerLocator) {
          _classCallCheck(this, _ComputedPropertyObserver);

          this.obj = obj;
          this.propertyName = propertyName;
          this.descriptor = descriptor;
          this.observerLocator = observerLocator;
        }

        ComputedPropertyObserver.prototype.getValue = function getValue() {
          return this.obj[this.propertyName];
        };

        ComputedPropertyObserver.prototype.setValue = function setValue(newValue) {
          this.obj[this.propertyName] = newValue;
        };

        ComputedPropertyObserver.prototype.call = function call(context) {
          var newValue = this.getValue();
          if (this.oldValue === newValue) return;
          this.callSubscribers(newValue, this.oldValue);
          this.oldValue = newValue;
          return;
        };

        ComputedPropertyObserver.prototype.subscribe = function subscribe(context, callable) {
          if (!this.hasSubscribers()) {
            this.oldValue = this.getValue();

            var dependencies = this.descriptor.get.dependencies;
            this.observers = [];
            for (var i = 0, ii = dependencies.length; i < ii; i++) {
              var observer = this.observerLocator.getObserver(this.obj, dependencies[i]);

              this.observers.push(observer);
              observer.subscribe(computedContext, this);
            }
          }

          this.addSubscriber(context, callable);
        };

        ComputedPropertyObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
          if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
            this.oldValue = undefined;

            var i = this.observers.length;
            while (i--) {
              this.observers[i].unsubscribe(computedContext, this);
            }
            this.observers = null;
          }
        };

        var _ComputedPropertyObserver = ComputedPropertyObserver;
        ComputedPropertyObserver = subscriberCollection()(ComputedPropertyObserver) || ComputedPropertyObserver;
        return ComputedPropertyObserver;
      })();

      _export('ComputedPropertyObserver', ComputedPropertyObserver);

      elements = {
        a: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'target', 'transform', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        altGlyph: ['class', 'dx', 'dy', 'externalResourcesRequired', 'format', 'glyphRef', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        altGlyphDef: ['id', 'xml:base', 'xml:lang', 'xml:space'],
        altGlyphItem: ['id', 'xml:base', 'xml:lang', 'xml:space'],
        animate: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        animateColor: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        animateMotion: ['accumulate', 'additive', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keyPoints', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'origin', 'path', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'rotate', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        animateTransform: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'type', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        circle: ['class', 'cx', 'cy', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'r', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        clipPath: ['class', 'clipPathUnits', 'externalResourcesRequired', 'id', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        'color-profile': ['id', 'local', 'name', 'rendering-intent', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        cursor: ['externalResourcesRequired', 'id', 'requiredExtensions', 'requiredFeatures', 'systemLanguage', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        defs: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        desc: ['class', 'id', 'style', 'xml:base', 'xml:lang', 'xml:space'],
        ellipse: ['class', 'cx', 'cy', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rx', 'ry', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        feBlend: ['class', 'height', 'id', 'in', 'in2', 'mode', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feColorMatrix: ['class', 'height', 'id', 'in', 'result', 'style', 'type', 'values', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feComponentTransfer: ['class', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feComposite: ['class', 'height', 'id', 'in', 'in2', 'k1', 'k2', 'k3', 'k4', 'operator', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feConvolveMatrix: ['bias', 'class', 'divisor', 'edgeMode', 'height', 'id', 'in', 'kernelMatrix', 'kernelUnitLength', 'order', 'preserveAlpha', 'result', 'style', 'targetX', 'targetY', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feDiffuseLighting: ['class', 'diffuseConstant', 'height', 'id', 'in', 'kernelUnitLength', 'result', 'style', 'surfaceScale', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feDisplacementMap: ['class', 'height', 'id', 'in', 'in2', 'result', 'scale', 'style', 'width', 'x', 'xChannelSelector', 'xml:base', 'xml:lang', 'xml:space', 'y', 'yChannelSelector'],
        feDistantLight: ['azimuth', 'elevation', 'id', 'xml:base', 'xml:lang', 'xml:space'],
        feFlood: ['class', 'height', 'id', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feFuncA: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
        feFuncB: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
        feFuncG: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
        feFuncR: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
        feGaussianBlur: ['class', 'height', 'id', 'in', 'result', 'stdDeviation', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feImage: ['class', 'externalResourcesRequired', 'height', 'id', 'preserveAspectRatio', 'result', 'style', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feMerge: ['class', 'height', 'id', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feMergeNode: ['id', 'xml:base', 'xml:lang', 'xml:space'],
        feMorphology: ['class', 'height', 'id', 'in', 'operator', 'radius', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feOffset: ['class', 'dx', 'dy', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        fePointLight: ['id', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'z'],
        feSpecularLighting: ['class', 'height', 'id', 'in', 'kernelUnitLength', 'result', 'specularConstant', 'specularExponent', 'style', 'surfaceScale', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feSpotLight: ['id', 'limitingConeAngle', 'pointsAtX', 'pointsAtY', 'pointsAtZ', 'specularExponent', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'z'],
        feTile: ['class', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        feTurbulence: ['baseFrequency', 'class', 'height', 'id', 'numOctaves', 'result', 'seed', 'stitchTiles', 'style', 'type', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        filter: ['class', 'externalResourcesRequired', 'filterRes', 'filterUnits', 'height', 'id', 'primitiveUnits', 'style', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        font: ['class', 'externalResourcesRequired', 'horiz-adv-x', 'horiz-origin-x', 'horiz-origin-y', 'id', 'style', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
        'font-face': ['accent-height', 'alphabetic', 'ascent', 'bbox', 'cap-height', 'descent', 'font-family', 'font-size', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'hanging', 'id', 'ideographic', 'mathematical', 'overline-position', 'overline-thickness', 'panose-1', 'slope', 'stemh', 'stemv', 'strikethrough-position', 'strikethrough-thickness', 'underline-position', 'underline-thickness', 'unicode-range', 'units-per-em', 'v-alphabetic', 'v-hanging', 'v-ideographic', 'v-mathematical', 'widths', 'x-height', 'xml:base', 'xml:lang', 'xml:space'],
        'font-face-format': ['id', 'string', 'xml:base', 'xml:lang', 'xml:space'],
        'font-face-name': ['id', 'name', 'xml:base', 'xml:lang', 'xml:space'],
        'font-face-src': ['id', 'xml:base', 'xml:lang', 'xml:space'],
        'font-face-uri': ['id', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        foreignObject: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        g: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        glyph: ['arabic-form', 'class', 'd', 'glyph-name', 'horiz-adv-x', 'id', 'lang', 'orientation', 'style', 'unicode', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
        glyphRef: ['class', 'dx', 'dy', 'format', 'glyphRef', 'id', 'style', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        hkern: ['g1', 'g2', 'id', 'k', 'u1', 'u2', 'xml:base', 'xml:lang', 'xml:space'],
        image: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        line: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'x1', 'x2', 'xml:base', 'xml:lang', 'xml:space', 'y1', 'y2'],
        linearGradient: ['class', 'externalResourcesRequired', 'gradientTransform', 'gradientUnits', 'id', 'spreadMethod', 'style', 'x1', 'x2', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y1', 'y2'],
        marker: ['class', 'externalResourcesRequired', 'id', 'markerHeight', 'markerUnits', 'markerWidth', 'orient', 'preserveAspectRatio', 'refX', 'refY', 'style', 'viewBox', 'xml:base', 'xml:lang', 'xml:space'],
        mask: ['class', 'externalResourcesRequired', 'height', 'id', 'maskContentUnits', 'maskUnits', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        metadata: ['id', 'xml:base', 'xml:lang', 'xml:space'],
        'missing-glyph': ['class', 'd', 'horiz-adv-x', 'id', 'style', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
        mpath: ['externalResourcesRequired', 'id', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        path: ['class', 'd', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'pathLength', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        pattern: ['class', 'externalResourcesRequired', 'height', 'id', 'patternContentUnits', 'patternTransform', 'patternUnits', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'viewBox', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        polygon: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'points', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        polyline: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'points', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        radialGradient: ['class', 'cx', 'cy', 'externalResourcesRequired', 'fx', 'fy', 'gradientTransform', 'gradientUnits', 'id', 'r', 'spreadMethod', 'style', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        rect: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rx', 'ry', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        script: ['externalResourcesRequired', 'id', 'type', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        set: ['attributeName', 'attributeType', 'begin', 'dur', 'end', 'externalResourcesRequired', 'fill', 'id', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        stop: ['class', 'id', 'offset', 'style', 'xml:base', 'xml:lang', 'xml:space'],
        style: ['id', 'media', 'title', 'type', 'xml:base', 'xml:lang', 'xml:space'],
        svg: ['baseProfile', 'class', 'contentScriptType', 'contentStyleType', 'externalResourcesRequired', 'height', 'id', 'onabort', 'onactivate', 'onclick', 'onerror', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onresize', 'onscroll', 'onunload', 'onzoom', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'version', 'viewBox', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'zoomAndPan'],
        'switch': ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
        symbol: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'preserveAspectRatio', 'style', 'viewBox', 'xml:base', 'xml:lang', 'xml:space'],
        text: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'transform', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        textPath: ['class', 'externalResourcesRequired', 'id', 'lengthAdjust', 'method', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'spacing', 'startOffset', 'style', 'systemLanguage', 'textLength', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
        title: ['class', 'id', 'style', 'xml:base', 'xml:lang', 'xml:space'],
        tref: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'x', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        tspan: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        use: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
        view: ['externalResourcesRequired', 'id', 'preserveAspectRatio', 'viewBox', 'viewTarget', 'xml:base', 'xml:lang', 'xml:space', 'zoomAndPan'],
        vkern: ['g1', 'g2', 'id', 'k', 'u1', 'u2', 'xml:base', 'xml:lang', 'xml:space']
      };

      _export('elements', elements);

      presentationElements = {
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

      _export('presentationElements', presentationElements);

      presentationAttributes = {
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

      _export('presentationAttributes', presentationAttributes);

      SVGAnalyzer = (function () {
        function SVGAnalyzer() {
          _classCallCheck(this, SVGAnalyzer);

          if (createElement('<svg><altGlyph /></svg>').firstElementChild.nodeName === 'altglyph' && elements.altGlyph) {
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

        SVGAnalyzer.prototype.isStandardSvgAttribute = function isStandardSvgAttribute(nodeName, attributeName) {
          return presentationElements[nodeName] && presentationAttributes[attributeName] || elements[nodeName] && elements[nodeName].indexOf(attributeName) !== -1;
        };

        return SVGAnalyzer;
      })();

      _export('SVGAnalyzer', SVGAnalyzer);

      ObserverLocator = (function () {
        _createClass(ObserverLocator, null, [{
          key: 'inject',
          value: [TaskQueue, EventManager, DirtyChecker, SVGAnalyzer],
          enumerable: true
        }]);

        function ObserverLocator(taskQueue, eventManager, dirtyChecker, svgAnalyzer) {
          _classCallCheck(this, ObserverLocator);

          this.taskQueue = taskQueue;
          this.eventManager = eventManager;
          this.dirtyChecker = dirtyChecker;
          this.svgAnalyzer = svgAnalyzer;
          this.adapters = [];
        }

        ObserverLocator.prototype.getObserver = function getObserver(obj, propertyName) {
          var observersLookup = obj.__observers__;
          var observer = undefined;

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
        };

        ObserverLocator.prototype.getOrCreateObserversLookup = function getOrCreateObserversLookup(obj) {
          return obj.__observers__ || this.createObserversLookup(obj);
        };

        ObserverLocator.prototype.createObserversLookup = function createObserversLookup(obj) {
          var value = {};

          try {
            Object.defineProperty(obj, "__observers__", {
              enumerable: false,
              configurable: false,
              writable: false,
              value: value
            });
          } catch (_) {}

          return value;
        };

        ObserverLocator.prototype.addAdapter = function addAdapter(adapter) {
          this.adapters.push(adapter);
        };

        ObserverLocator.prototype.getAdapterObserver = function getAdapterObserver(obj, propertyName, descriptor) {
          for (var i = 0, ii = this.adapters.length; i < ii; i++) {
            var adapter = this.adapters[i];
            var observer = adapter.getObserver(obj, propertyName, descriptor);
            if (observer) {
              return observer;
            }
          }
          return null;
        };

        ObserverLocator.prototype.createPropertyObserver = function createPropertyObserver(obj, propertyName) {
          var observerLookup = undefined;
          var descriptor = undefined;
          var handler = undefined;
          var xlinkResult = undefined;

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
            if (/^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)) {
              return new DataAttributeObserver(obj, propertyName);
            }
          }

          descriptor = Object.getPropertyDescriptor(obj, propertyName);

          if (hasDeclaredDependencies(descriptor)) {
            return new ComputedPropertyObserver(obj, propertyName, descriptor, this);
          }

          var existingGetterOrSetter = undefined;
          if (descriptor && (existingGetterOrSetter = descriptor.get || descriptor.set)) {
            if (existingGetterOrSetter.getObserver) {
              return existingGetterOrSetter.getObserver(obj);
            }

            var adapterObserver = this.getAdapterObserver(obj, propertyName, descriptor);
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
        };

        ObserverLocator.prototype.getAccessor = function getAccessor(obj, propertyName) {
          if (obj instanceof DOM.Element) {
            if (propertyName === 'class' || propertyName === 'style' || propertyName === 'css' || propertyName === 'value' && obj.tagName.toLowerCase() === 'select' || propertyName === 'checked' && obj.tagName.toLowerCase() === 'input' || /^xlink:.+$/.exec(propertyName)) {
              return this.getObserver(obj, propertyName);
            }
            if (/^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)) {
              return dataAttributeAccessor;
            }
          }
          return propertyAccessor;
        };

        ObserverLocator.prototype.getArrayObserver = function getArrayObserver(array) {
          if ('__array_observer__' in array) {
            return array.__array_observer__;
          }

          return array.__array_observer__ = _getArrayObserver(this.taskQueue, array);
        };

        ObserverLocator.prototype.getMapObserver = function getMapObserver(map) {
          if ('__map_observer__' in map) {
            return map.__map_observer__;
          }

          return map.__map_observer__ = _getMapObserver(this.taskQueue, map);
        };

        return ObserverLocator;
      })();

      _export('ObserverLocator', ObserverLocator);

      ObjectObservationAdapter = (function () {
        function ObjectObservationAdapter() {
          _classCallCheck(this, ObjectObservationAdapter);
        }

        ObjectObservationAdapter.prototype.getObserver = function getObserver(object, propertyName, descriptor) {
          throw new Error('BindingAdapters must implement getObserver(object, propertyName).');
        };

        return ObjectObservationAdapter;
      })();

      _export('ObjectObservationAdapter', ObjectObservationAdapter);

      BindingExpression = (function () {
        function BindingExpression(observerLocator, targetProperty, sourceExpression, mode, lookupFunctions, attribute) {
          _classCallCheck(this, BindingExpression);

          this.observerLocator = observerLocator;
          this.targetProperty = targetProperty;
          this.sourceExpression = sourceExpression;
          this.mode = mode;
          this.lookupFunctions = lookupFunctions;
          this.attribute = attribute;
          this.discrete = false;
        }

        BindingExpression.prototype.createBinding = function createBinding(target) {
          return new Binding(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.mode, this.lookupFunctions);
        };

        return BindingExpression;
      })();

      _export('BindingExpression', BindingExpression);

      targetContext = 'Binding:target';

      Binding = (function () {
        function Binding(observerLocator, sourceExpression, target, targetProperty, mode, lookupFunctions) {
          _classCallCheck(this, _Binding);

          this.observerLocator = observerLocator;
          this.sourceExpression = sourceExpression;
          this.target = target;
          this.targetProperty = targetProperty;
          this.mode = mode;
          this.lookupFunctions = lookupFunctions;
        }

        Binding.prototype.updateTarget = function updateTarget(value) {
          this.targetObserver.setValue(value, this.target, this.targetProperty);
        };

        Binding.prototype.updateSource = function updateSource(value) {
          this.sourceExpression.assign(this.source, value, this.lookupFunctions);
        };

        Binding.prototype.call = function call(context, newValue, oldValue) {
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
          throw new Error('Unexpected call context ' + context);
        };

        Binding.prototype.bind = function bind(source) {
          if (this.isBound) {
            if (this.source === source) {
              return;
            }
            this.unbind();
          }
          this.isBound = true;
          this.source = source;

          var sourceExpression = this.sourceExpression;
          if (sourceExpression.bind) {
            sourceExpression.bind(this, source, this.lookupFunctions);
          }

          var mode = this.mode;
          if (!this.targetObserver) {
            var method = mode === bindingMode.twoWay ? 'getObserver' : 'getAccessor';
            this.targetObserver = this.observerLocator[method](this.target, this.targetProperty);
          }

          if ('bind' in this.targetObserver) {
            this.targetObserver.bind();
          }
          var value = sourceExpression.evaluate(source, this.lookupFunctions);
          this.updateTarget(value);

          if (mode === bindingMode.oneWay) {
            enqueueBindingConnect(this);
          } else if (mode === bindingMode.twoWay) {
            sourceExpression.connect(this, source);
            this.targetObserver.subscribe(targetContext, this);
          }
        };

        Binding.prototype.unbind = function unbind() {
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
        };

        Binding.prototype.connect = function connect(evaluate) {
          if (!this.isBound) {
            return;
          }
          if (evaluate) {
            var value = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
            this.updateTarget(value);
          }
          this.sourceExpression.connect(this, this.source);
        };

        var _Binding = Binding;
        Binding = connectable()(Binding) || Binding;
        return Binding;
      })();

      _export('Binding', Binding);

      CallExpression = (function () {
        function CallExpression(observerLocator, targetProperty, sourceExpression, lookupFunctions) {
          _classCallCheck(this, CallExpression);

          this.observerLocator = observerLocator;
          this.targetProperty = targetProperty;
          this.sourceExpression = sourceExpression;
          this.lookupFunctions = lookupFunctions;
        }

        CallExpression.prototype.createBinding = function createBinding(target) {
          return new Call(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.lookupFunctions);
        };

        return CallExpression;
      })();

      _export('CallExpression', CallExpression);

      Call = (function () {
        function Call(observerLocator, sourceExpression, target, targetProperty, lookupFunctions) {
          _classCallCheck(this, Call);

          this.sourceExpression = sourceExpression;
          this.target = target;
          this.targetProperty = observerLocator.getObserver(target, targetProperty);
          this.lookupFunctions = lookupFunctions;
        }

        Call.prototype.callSource = function callSource($event) {
          var overrideContext = this.source.overrideContext;
          Object.assign(overrideContext, $event);
          overrideContext.$event = $event;
          var mustEvaluate = true;
          var result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
          delete overrideContext.$event;
          for (var prop in $event) {
            delete overrideContext[prop];
          }
          return result;
        };

        Call.prototype.bind = function bind(source) {
          var _this5 = this;

          if (this.isBound) {
            if (this.source === source) {
              return;
            }
            this.unbind();
          }
          this.isBound = true;
          this.source = source;

          var sourceExpression = this.sourceExpression;
          if (sourceExpression.bind) {
            sourceExpression.bind(this, source, this.lookupFunctions);
          }
          this.targetProperty.setValue(function ($event) {
            return _this5.callSource($event);
          });
        };

        Call.prototype.unbind = function unbind() {
          if (!this.isBound) {
            return;
          }
          this.isBound = false;
          if (this.sourceExpression.unbind) {
            this.sourceExpression.unbind(this, this.source);
          }
          this.source = null;
          this.targetProperty.setValue(null);
        };

        return Call;
      })();

      _export('Call', Call);

      ValueConverterResource = (function () {
        function ValueConverterResource(name) {
          _classCallCheck(this, ValueConverterResource);

          this.name = name;
        }

        ValueConverterResource.convention = function convention(name) {
          if (name.endsWith('ValueConverter')) {
            return new ValueConverterResource(camelCase(name.substring(0, name.length - 14)));
          }
        };

        ValueConverterResource.prototype.initialize = function initialize(container, target) {
          this.instance = container.get(target);
        };

        ValueConverterResource.prototype.register = function register(registry, name) {
          registry.registerValueConverter(name || this.name, this.instance);
        };

        ValueConverterResource.prototype.load = function load(container, target) {};

        return ValueConverterResource;
      })();

      _export('ValueConverterResource', ValueConverterResource);

      BindingBehaviorResource = (function () {
        function BindingBehaviorResource(name) {
          _classCallCheck(this, BindingBehaviorResource);

          this.name = name;
        }

        BindingBehaviorResource.convention = function convention(name) {
          if (name.endsWith('BindingBehavior')) {
            return new BindingBehaviorResource(camelCase(name.substring(0, name.length - 15)));
          }
        };

        BindingBehaviorResource.prototype.initialize = function initialize(container, target) {
          this.instance = container.get(target);
        };

        BindingBehaviorResource.prototype.register = function register(registry, name) {
          registry.registerBindingBehavior(name || this.name, this.instance);
        };

        BindingBehaviorResource.prototype.load = function load(container, target) {};

        return BindingBehaviorResource;
      })();

      _export('BindingBehaviorResource', BindingBehaviorResource);

      ListenerExpression = (function () {
        function ListenerExpression(eventManager, targetEvent, sourceExpression, delegate, preventDefault, lookupFunctions) {
          _classCallCheck(this, ListenerExpression);

          this.eventManager = eventManager;
          this.targetEvent = targetEvent;
          this.sourceExpression = sourceExpression;
          this.delegate = delegate;
          this.discrete = true;
          this.preventDefault = preventDefault;
          this.lookupFunctions = lookupFunctions;
        }

        ListenerExpression.prototype.createBinding = function createBinding(target) {
          return new Listener(this.eventManager, this.targetEvent, this.delegate, this.sourceExpression, target, this.preventDefault, this.lookupFunctions);
        };

        return ListenerExpression;
      })();

      _export('ListenerExpression', ListenerExpression);

      Listener = (function () {
        function Listener(eventManager, targetEvent, delegate, sourceExpression, target, preventDefault, lookupFunctions) {
          _classCallCheck(this, Listener);

          this.eventManager = eventManager;
          this.targetEvent = targetEvent;
          this.delegate = delegate;
          this.sourceExpression = sourceExpression;
          this.target = target;
          this.preventDefault = preventDefault;
          this.lookupFunctions = lookupFunctions;
        }

        Listener.prototype.callSource = function callSource(event) {
          var overrideContext = this.source.overrideContext;
          overrideContext.$event = event;
          var mustEvaluate = true;
          var result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
          delete overrideContext.$event;
          if (result !== true && this.preventDefault) {
            event.preventDefault();
          }
          return result;
        };

        Listener.prototype.bind = function bind(source) {
          var _this6 = this;

          if (this.isBound) {
            if (this.source === source) {
              return;
            }
            this.unbind();
          }
          this.isBound = true;
          this.source = source;

          var sourceExpression = this.sourceExpression;
          if (sourceExpression.bind) {
            sourceExpression.bind(this, source, this.lookupFunctions);
          }
          this._disposeListener = this.eventManager.addEventListener(this.target, this.targetEvent, function (event) {
            return _this6.callSource(event);
          }, this.delegate);
        };

        Listener.prototype.unbind = function unbind() {
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
        };

        return Listener;
      })();

      _export('Listener', Listener);

      NameExpression = (function () {
        function NameExpression(property, apiName) {
          _classCallCheck(this, NameExpression);

          this.property = property;
          this.apiName = apiName;
          this.discrete = true;
        }

        NameExpression.prototype.createBinding = function createBinding(target) {
          return new NameBinder(this.property, NameExpression.locateAPI(target, this.apiName));
        };

        NameExpression.locateAPI = function locateAPI(element, apiName) {
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
              var target = getAU(element)[apiName];

              if (target === undefined) {
                throw new Error('Attempted to reference "' + apiName + '", but it was not found amongst the target\'s API.');
              }

              return target.viewModel;
          }
        };

        return NameExpression;
      })();

      _export('NameExpression', NameExpression);

      NameBinder = (function () {
        function NameBinder(property, target) {
          _classCallCheck(this, NameBinder);

          this.property = property;
          this.target = target;
          this.source = null;
          this.context = null;
        }

        NameBinder.prototype.bind = function bind(source) {
          if (this.source !== null) {
            if (this.source === source) {
              return;
            }

            this.unbind();
          }

          this.source = source || null;
          this.context = source.bindingContext || source.overrideContext || null;

          if (this.context !== null) {
            this.context[this.property] = this.target;
          }
        };

        NameBinder.prototype.unbind = function unbind() {
          if (this.source !== null) {
            this.source = null;
          }

          if (this.context !== null) {
            this.context[this.property] = null;
          }
        };

        return NameBinder;
      })();

      lookupFunctions = {
        bindingBehaviors: function bindingBehaviors(name) {
          return null;
        },
        valueConverters: function valueConverters(name) {
          return null;
        }
      };

      BindingEngine = (function () {
        _createClass(BindingEngine, null, [{
          key: 'inject',
          value: [ObserverLocator, Parser],
          enumerable: true
        }]);

        function BindingEngine(observerLocator, parser) {
          _classCallCheck(this, BindingEngine);

          this.observerLocator = observerLocator;
          this.parser = parser;
        }

        BindingEngine.prototype.createBindingExpression = function createBindingExpression(targetProperty, sourceExpression) {
          var mode = arguments.length <= 2 || arguments[2] === undefined ? bindingMode.oneWay : arguments[2];
          var lookupFunctions = arguments.length <= 3 || arguments[3] === undefined ? lookupFunctions : arguments[3];
          return (function () {
            return new BindingExpression(this.observerLocator, targetProperty, this.parser.parse(sourceExpression), mode, lookupFunctions);
          }).apply(this, arguments);
        };

        BindingEngine.prototype.propertyObserver = function propertyObserver(obj, propertyName) {
          var _this7 = this;

          return {
            subscribe: function subscribe(callback) {
              var observer = _this7.observerLocator.getObserver(obj, propertyName);
              observer.subscribe(callback);
              return {
                dispose: function dispose() {
                  return observer.unsubscribe(callback);
                }
              };
            }
          };
        };

        BindingEngine.prototype.collectionObserver = function collectionObserver(collection) {
          var _this8 = this;

          return {
            subscribe: function subscribe(callback) {
              var observer = undefined;
              if (collection instanceof Array) {
                observer = _this8.observerLocator.getArrayObserver(collection);
              } else if (collection instanceof Map) {
                observer = _this8.observerLocator.getMapObserver(collection);
              } else {
                throw new Error('collection must be an instance of Array or Map.');
              }
              observer.subscribe(callback);
              return {
                dispose: function dispose() {
                  return observer.unsubscribe(callback);
                }
              };
            }
          };
        };

        BindingEngine.prototype.expressionObserver = function expressionObserver(bindingContext, expression) {
          var scope = { bindingContext: bindingContext, overrideContext: createOverrideContext(bindingContext) };
          return new ExpressionObserver(scope, this.parser.parse(expression), this.observerLocator);
        };

        BindingEngine.prototype.parseExpression = function parseExpression(expression) {
          return this.parser.parse(expression);
        };

        BindingEngine.prototype.registerAdapter = function registerAdapter(adapter) {
          this.observerLocator.addAdapter(adapter);
        };

        return BindingEngine;
      })();

      _export('BindingEngine', BindingEngine);

      ExpressionObserver = (function () {
        function ExpressionObserver(scope, expression, observerLocator) {
          _classCallCheck(this, _ExpressionObserver);

          this.scope = scope;
          this.expression = expression;
          this.observerLocator = observerLocator;
        }

        ExpressionObserver.prototype.subscribe = function subscribe(callback) {
          var _this9 = this;

          if (!this.hasSubscribers()) {
            this.oldValue = this.expression.evaluate(this.scope, lookupFunctions);
            this.expression.connect(this, this.scope);
          }
          this.addSubscriber(callback);
          return {
            dispose: function dispose() {
              if (_this9.removeSubscriber(callback) && !_this9.hasSubscribers()) {
                _this9.unobserve(true);
              }
            }
          };
        };

        ExpressionObserver.prototype.call = function call() {
          var newValue = this.expression.evaluate(this.scope, lookupFunctions);
          var oldValue = this.oldValue;
          if (newValue !== oldValue) {
            this.oldValue = newValue;
            this.callSubscribers(newValue, oldValue);
          }
          this._version++;
          this.expression.connect(this, this.scope);
          this.unobserve(false);
        };

        var _ExpressionObserver = ExpressionObserver;
        ExpressionObserver = subscriberCollection()(ExpressionObserver) || ExpressionObserver;
        ExpressionObserver = connectable()(ExpressionObserver) || ExpressionObserver;
        return ExpressionObserver;
      })();
    }
  };
});