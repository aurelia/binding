define(['exports', './array-change-records', './map-change-records'], function (exports, _arrayChangeRecords, _mapChangeRecords) {
  'use strict';

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

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

    _createClass(ModifyCollectionObserver, [{
      key: 'subscribe',
      value: function subscribe(callback) {
        var callbacks = this.callbacks;
        callbacks.push(callback);
        return function () {
          callbacks.splice(callbacks.indexOf(callback), 1);
        };
      }
    }, {
      key: 'addChangeRecord',
      value: function addChangeRecord(changeRecord) {
        if (this.callbacks.length === 0) {
          return;
        }

        this.changeRecords.push(changeRecord);

        if (!this.queued) {
          this.queued = true;
          this.taskQueue.queueMicroTask(this);
        }
      }
    }, {
      key: 'reset',
      value: function reset(oldCollection) {
        if (!this.callbacks.length) {
          return;
        }

        this.oldCollection = oldCollection;

        if (!this.queued) {
          this.queued = true;
          this.taskQueue.queueMicroTask(this);
        }
      }
    }, {
      key: 'getObserver',
      value: function getObserver(propertyName) {
        if (propertyName == this.lengthPropertyName) {
          return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection, this.lengthPropertyName));
        } else {
          throw new Error('You cannot observe the ' + propertyName + ' property of an array.');
        }
      }
    }, {
      key: 'call',
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
            if (this.collection instanceof Map) {
              records = _mapChangeRecords.getChangeRecords(oldCollection);
            } else {
              records = _arrayChangeRecords.calcSplices(this.collection, 0, this.collection.length, oldCollection, 0, oldCollection.length);
            }
          } else {
            if (this.collection instanceof Map) {
              records = changeRecords;
            } else {
              records = _arrayChangeRecords.projectArraySplices(this.collection, changeRecords);
            }
          }

          while (i--) {
            callbacks[i](records);
          }
        }

        if (this.lengthObserver) {
          this.lengthObserver(this.array.length);
        }
      }
    }]);

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

    _createClass(CollectionLengthObserver, [{
      key: 'getValue',
      value: function getValue() {
        return this.collection[this.lengthPropertyName];
      }
    }, {
      key: 'setValue',
      value: function setValue(newValue) {
        this.collection[this.lengthPropertyName] = newValue;
      }
    }, {
      key: 'subscribe',
      value: function subscribe(callback) {
        var callbacks = this.callbacks;
        callbacks.push(callback);
        return function () {
          callbacks.splice(callbacks.indexOf(callback), 1);
        };
      }
    }, {
      key: 'call',
      value: function call(newValue) {
        var callbacks = this.callbacks,
            i = callbacks.length,
            oldValue = this.currentValue;

        while (i--) {
          callbacks[i](newValue, oldValue);
        }

        this.currentValue = newValue;
      }
    }]);

    return CollectionLengthObserver;
  })();

  exports.CollectionLengthObserver = CollectionLengthObserver;
});