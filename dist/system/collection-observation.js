System.register(['./array-change-records', './map-change-records'], function (_export) {
  var calcSplices, projectArraySplices, getChangeRecords, _classCallCheck, ModifyCollectionObserver, CollectionLengthObserver;

  return {
    setters: [function (_arrayChangeRecords) {
      calcSplices = _arrayChangeRecords.calcSplices;
      projectArraySplices = _arrayChangeRecords.projectArraySplices;
    }, function (_mapChangeRecords) {
      getChangeRecords = _mapChangeRecords.getChangeRecords;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      ModifyCollectionObserver = (function () {
        function ModifyCollectionObserver(taskQueue, collection) {
          _classCallCheck(this, ModifyCollectionObserver);

          this.taskQueue = taskQueue;
          this.queued = false;
          this.callbacks = [];
          this.changeRecords = [];
          this.oldCollection = null;
          this.collection = collection;
          this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
        }

        ModifyCollectionObserver.prototype.subscribe = function subscribe(callback) {
          var callbacks = this.callbacks;
          callbacks.push(callback);
          return function () {
            callbacks.splice(callbacks.indexOf(callback), 1);
          };
        };

        ModifyCollectionObserver.prototype.addChangeRecord = function addChangeRecord(changeRecord) {
          if (this.callbacks.length === 0 && !this.lengthObserver) {
            return;
          }

          this.changeRecords.push(changeRecord);

          if (!this.queued) {
            this.queued = true;
            this.taskQueue.queueMicroTask(this);
          }
        };

        ModifyCollectionObserver.prototype.reset = function reset(oldCollection) {
          if (!this.callbacks.length) {
            return;
          }

          this.oldCollection = oldCollection;

          if (!this.queued) {
            this.queued = true;
            this.taskQueue.queueMicroTask(this);
          }
        };

        ModifyCollectionObserver.prototype.getLengthObserver = function getLengthObserver() {
          return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection));
        };

        ModifyCollectionObserver.prototype.call = function call() {
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

            while (i--) {
              callbacks[i](records);
            }
          }

          if (this.lengthObserver) {
            this.lengthObserver.call(this.collection[this.lengthPropertyName]);
          }
        };

        return ModifyCollectionObserver;
      })();

      _export('ModifyCollectionObserver', ModifyCollectionObserver);

      CollectionLengthObserver = (function () {
        function CollectionLengthObserver(collection) {
          _classCallCheck(this, CollectionLengthObserver);

          this.collection = collection;
          this.callbacks = [];
          this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
          this.currentValue = collection[this.lengthPropertyName];
        }

        CollectionLengthObserver.prototype.getValue = function getValue() {
          return this.collection[this.lengthPropertyName];
        };

        CollectionLengthObserver.prototype.setValue = function setValue(newValue) {
          this.collection[this.lengthPropertyName] = newValue;
        };

        CollectionLengthObserver.prototype.subscribe = function subscribe(callback) {
          var callbacks = this.callbacks;
          callbacks.push(callback);
          return function () {
            callbacks.splice(callbacks.indexOf(callback), 1);
          };
        };

        CollectionLengthObserver.prototype.call = function call(newValue) {
          var callbacks = this.callbacks,
              i = callbacks.length,
              oldValue = this.currentValue;

          while (i--) {
            callbacks[i](newValue, oldValue);
          }

          this.currentValue = newValue;
        };

        return CollectionLengthObserver;
      })();

      _export('CollectionLengthObserver', CollectionLengthObserver);
    }
  };
});