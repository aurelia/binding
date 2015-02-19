define(["exports"], function (exports) {
  "use strict";

  exports.getChangeRecords = getChangeRecords;
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
    for (var _iterator = map.keys()[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      var key = _step.value;
      entries.push(newRecord("added", map, key));
    }

    return entries;
  }
  exports.__esModule = true;
});