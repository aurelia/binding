System.register([], function (_export) {
  var bindingMode;
  return {
    setters: [],
    execute: function () {
      "use strict";

      bindingMode = {
        oneTime: 0,
        oneWay: 1,
        twoWay: 2
      };

      _export("bindingMode", bindingMode);
    }
  };
});