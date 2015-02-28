System.register(["./array-change-records", "./collection-observation"], function (_export) {
  var projectArraySplices, ModifyCollectionObserver, CollectionLengthObserver, _prototypeProperties, _get, _inherits, _classCallCheck, arrayProto, hasArrayObserve, ModifyArrayObserver, ArrayObserveObserver;

  _export("getArrayObserver", getArrayObserver);

  function getArrayObserver(taskQueue, array) {
    if (hasArrayObserve) {
      return new ArrayObserveObserver(array);
    } else {
      return ModifyArrayObserver.create(taskQueue, array);
    }
  }

  return {
    setters: [function (_arrayChangeRecords) {
      projectArraySplices = _arrayChangeRecords.projectArraySplices;
    }, function (_collectionObservation) {
      ModifyCollectionObserver = _collectionObservation.ModifyCollectionObserver;
      CollectionLengthObserver = _collectionObservation.CollectionLengthObserver;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

      _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      arrayProto = Array.prototype;

      hasArrayObserve = (function detectArrayObserve() {
        if (typeof Array.observe !== "function") {
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
        if (records.length !== 2) {
          return false;
        }if (records[0].type != "splice" || records[1].type != "splice") {
          return false;
        }

        Array.unobserve(arr, callback);

        return true;
      })();

      ModifyArrayObserver = (function (ModifyCollectionObserver) {
        function ModifyArrayObserver(taskQueue, array) {
          _classCallCheck(this, ModifyArrayObserver);

          _get(Object.getPrototypeOf(ModifyArrayObserver.prototype), "constructor", this).call(this, taskQueue, array);
        }

        _inherits(ModifyArrayObserver, ModifyCollectionObserver);

        _prototypeProperties(ModifyArrayObserver, {
          create: {
            value: function create(taskQueue, array) {
              var observer = new ModifyArrayObserver(taskQueue, array);

              array.pop = function () {
                var methodCallResult = arrayProto.pop.apply(array, arguments);
                observer.addChangeRecord({
                  type: "delete",
                  object: array,
                  name: array.length,
                  oldValue: methodCallResult
                });
                return methodCallResult;
              };

              array.push = function () {
                var methodCallResult = arrayProto.push.apply(array, arguments);
                observer.addChangeRecord({
                  type: "splice",
                  object: array,
                  index: array.length - arguments.length,
                  removed: [],
                  addedCount: arguments.length
                });
                return methodCallResult;
              };

              array.reverse = function () {
                var oldArray = array.slice();
                var methodCallResult = arrayProto.reverse.apply(array, arguments);
                observer.reset(oldArray);
                return methodCallResult;
              };

              array.shift = function () {
                var methodCallResult = arrayProto.shift.apply(array, arguments);
                observer.addChangeRecord({
                  type: "delete",
                  object: array,
                  name: 0,
                  oldValue: methodCallResult
                });
                return methodCallResult;
              };

              array.sort = function () {
                var oldArray = array.slice();
                var methodCallResult = arrayProto.sort.apply(array, arguments);
                observer.reset(oldArray);
                return methodCallResult;
              };

              array.splice = function () {
                var methodCallResult = arrayProto.splice.apply(array, arguments);
                observer.addChangeRecord({
                  type: "splice",
                  object: array,
                  index: arguments[0],
                  removed: methodCallResult,
                  addedCount: arguments.length > 2 ? arguments.length - 2 : 0
                });
                return methodCallResult;
              };

              array.unshift = function () {
                var methodCallResult = arrayProto.unshift.apply(array, arguments);
                observer.addChangeRecord({
                  type: "splice",
                  object: array,
                  index: 0,
                  removed: [],
                  addedCount: arguments.length
                });
                return methodCallResult;
              };

              return observer;
            },
            writable: true,
            configurable: true
          }
        });

        return ModifyArrayObserver;
      })(ModifyCollectionObserver);

      ArrayObserveObserver = (function () {
        function ArrayObserveObserver(array) {
          _classCallCheck(this, ArrayObserveObserver);

          this.array = array;
          this.callbacks = [];
          this.observing = false;
        }

        _prototypeProperties(ArrayObserveObserver, null, {
          subscribe: {
            value: function subscribe(callback) {
              var _this = this;

              var callbacks = this.callbacks;

              callbacks.push(callback);

              if (!this.observing) {
                this.observing = true;
                Array.observe(this.array, function (changes) {
                  return _this.handleChanges(changes);
                });
              }

              return function () {
                callbacks.splice(callbacks.indexOf(callback), 1);
              };
            },
            writable: true,
            configurable: true
          },
          getObserver: {
            value: function getObserver(propertyName) {
              if (propertyName == "length") {
                return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.array));
              } else {
                throw new Error("You cannot observe the " + propertyName + " property of an array.");
              }
            },
            writable: true,
            configurable: true
          },
          handleChanges: {
            value: function handleChanges(changeRecords) {
              var callbacks = this.callbacks,
                  i = callbacks.length,
                  splices;

              if (!i) {
                return;
              }

              splices = projectArraySplices(this.array, changeRecords);

              while (i--) {
                callbacks[i](splices);
              }

              if (this.lengthObserver) {
                this.lengthObserver.call(this.array.length);
              }
            },
            writable: true,
            configurable: true
          }
        });

        return ArrayObserveObserver;
      })();
    }
  };
});