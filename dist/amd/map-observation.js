define(["exports", "./map-change-records"], function (exports, _mapChangeRecords) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  exports.getMapObserver = getMapObserver;
  var getEntries = _mapChangeRecords.getEntries;
  var getChangeRecords = _mapChangeRecords.getChangeRecords;


  var mapProto = Map.prototype;

  function getMapObserver(taskQueue, map) {
    return ModifyMapObserver.create(taskQueue, map);
  }

  var ModifyMapObserver = (function () {
    function ModifyMapObserver(taskQueue, map) {
      this.taskQueue = taskQueue;
      this.callbacks = [];
      this.changeRecords = [];
      this.queued = false;
      this.map = map;
      this.oldMap = null;
    }

    _prototypeProperties(ModifyMapObserver, {
      create: {
        value: function create(taskQueue, map) {
          var observer = new ModifyMapObserver(taskQueue, map);

          map.set = function () {
            var oldValue = map.get(arguments[0]);
            var type = oldValue ? "update" : "add";
            var methodCallResult = mapProto.set.apply(map, arguments);
            observer.addChangeRecord({
              type: type,
              object: map,
              key: arguments[0],
              oldValue: oldValue
            });
            return methodCallResult;
          };

          map["delete"] = function () {
            var oldValue = map.get(arguments[0]);
            var methodCallResult = mapProto["delete"].apply(map, arguments);
            observer.addChangeRecord({
              type: "delete",
              object: map,
              key: arguments[0],
              oldValue: oldValue
            });
            return methodCallResult;
          };

          map.clear = function () {
            var methodCallResult = mapProto.clear.apply(map, arguments);
            observer.addChangeRecord({
              type: "clear",
              object: map
            });
            return methodCallResult;
          };

          return observer;
        },
        writable: true,
        configurable: true
      }
    }, {
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
        value: function reset() {
          if (!this.callbacks.length) {
            return;
          }

          this.oldMap = this.map;

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
          if (propertyName == "size") {
            return this.lengthObserver || (this.lengthObserver = new MapLengthObserver(this.map));
          } else {
            throw new Error("You cannot observe the " + propertyName + " property of a map.");
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
              oldMap = this.oldMap,
              records;

          this.queued = false;
          this.changeRecords = [];

          if (i) {
            if (oldMap) {
              records = getChangeRecords(oldMap);
            } else {
              records = changeRecords;
            }

            while (i--) {
              callbacks[i](records);
            }
          }

          if (this.lengthObserver) {
            this.lengthObserver(this.map.size);
          }
        },
        writable: true,
        configurable: true
      }
    });

    return ModifyMapObserver;
  })();

  var MapLengthObserver = (function () {
    function MapLengthObserver(map) {
      this.map = map;
      this.callbacks = [];
      this.currentValue = map.size;
    }

    _prototypeProperties(MapLengthObserver, null, {
      getValue: {
        value: function getValue() {
          return this.map.size;
        },
        writable: true,
        configurable: true
      },
      setValue: {
        value: function setValue(newValue) {
          this.map.size = newValue;
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

    return MapLengthObserver;
  })();

  exports.__esModule = true;
});