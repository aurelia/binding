System.register(["./array-change-records"], function (_export) {
  var calcSplices, projectArraySplices, _prototypeProperties, _classCallCheck, ModifyCollectionObserver, CollectionLengthObserver;

  return {
    setters: [function (_arrayChangeRecords) {
      calcSplices = _arrayChangeRecords.calcSplices;
      projectArraySplices = _arrayChangeRecords.projectArraySplices;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      ModifyCollectionObserver = _export("ModifyCollectionObserver", (function () {
        function ModifyCollectionObserver(taskQueue, collection) {
          _classCallCheck(this, ModifyCollectionObserver);

          this.taskQueue = taskQueue;
          this.queued = false;
          this.callbacks = [];
          this.changeRecords = [];
          this.oldCollection = null;
          this.collection = collection;
          this.lengthPropertyName = collection instanceof Map ? "size" : "length";
        }

        _prototypeProperties(ModifyCollectionObserver, null, {
          subscribe: {
            value: function subscribe(callback) {
              var callbacks = this.callbacks;
              callbacks.push(callback);
              return function () {
                callbacks.splice(callbacks.indexOf(callback), 1);
              };
            },
            writable: true,
            configurable: true
          },
          addChangeRecord: {
            value: function addChangeRecord(changeRecord) {
              if (this.callbacks.length === 0) {
                return;
              }

              this.changeRecords.push(changeRecord);

              if (!this.queued) {
                this.queued = true;
                this.taskQueue.queueMicroTask(this);
              }
            },
            writable: true,
            configurable: true
          },
          reset: {
            value: function reset(oldCollection) {
              if (!this.callbacks.length) {
                return;
              }

              this.oldCollection = oldCollection;

              if (!this.queued) {
                this.queued = true;
                this.taskQueue.queueMicroTask(this);
              }
            },
            writable: true,
            configurable: true
          },
          getObserver: {
            value: function getObserver(propertyName) {
              if (propertyName == this.lengthPropertyName) {
                return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection, this.lengthPropertyName));
              } else {
                throw new Error("You cannot observe the " + propertyName + " property of an array.");
              }
            },
            writable: true,
            configurable: true
          },
          call: {
            value: function call() {
              var callbacks = this.callbacks,
                  i = callbacks.length,
                  changeRecords = this.changeRecords,
                  oldCollection = this.oldCollection,
                  records;

              this.queued = false;
              this.changeRecords = [];
              this.oldCollection = null;

              if (i) {
                if (oldCollection) {
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

                while (i--) {
                  callbacks[i](records);
                }
              }

              if (this.lengthObserver) {
                this.lengthObserver(this.array.length);
              }
            },
            writable: true,
            configurable: true
          }
        });

        return ModifyCollectionObserver;
      })());
      CollectionLengthObserver = _export("CollectionLengthObserver", (function () {
        function CollectionLengthObserver(collection) {
          _classCallCheck(this, CollectionLengthObserver);

          this.collection = collection;
          this.callbacks = [];
          this.lengthPropertyName = collection instanceof Map ? "size" : "length";
          this.currentValue = collection[this.lengthPropertyName];
        }

        _prototypeProperties(CollectionLengthObserver, null, {
          getValue: {
            value: function getValue() {
              return this.collection[this.lengthPropertyName];
            },
            writable: true,
            configurable: true
          },
          setValue: {
            value: function setValue(newValue) {
              this.collection[this.lengthPropertyName] = newValue;
            },
            writable: true,
            configurable: true
          },
          subscribe: {
            value: function subscribe(callback) {
              var callbacks = this.callbacks;
              callbacks.push(callback);
              return function () {
                callbacks.splice(callbacks.indexOf(callback), 1);
              };
            },
            writable: true,
            configurable: true
          },
          call: {
            value: function call(newValue) {
              var callbacks = this.callbacks,
                  i = callbacks.length,
                  oldValue = this.currentValue;

              while (i--) {
                callbacks[i](newValue, oldValue);
              }

              this.currentValue = newValue;
            },
            writable: true,
            configurable: true
          }
        });

        return CollectionLengthObserver;
      })());
    }
  };
});