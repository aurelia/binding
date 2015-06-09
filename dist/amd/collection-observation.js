define(['exports', './array-change-records', './map-change-records'], function (exports, _arrayChangeRecords, _mapChangeRecords) {
  'use strict';

  exports.__esModule = true;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var ModifyCollectionObserver = (function () {
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
            records = (0, _mapChangeRecords.getChangeRecords)(oldCollection);
          } else {
            records = (0, _arrayChangeRecords.calcSplices)(this.collection, 0, this.collection.length, oldCollection, 0, oldCollection.length);
          }
        } else {
          if (this.collection instanceof Map) {
            records = changeRecords;
          } else {
            records = (0, _arrayChangeRecords.projectArraySplices)(this.collection, changeRecords);
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

  exports.ModifyCollectionObserver = ModifyCollectionObserver;

  var CollectionLengthObserver = (function () {
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

  exports.CollectionLengthObserver = CollectionLengthObserver;
});