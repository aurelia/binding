System.register([], function (_export) {
  "use strict";

  var bindingMode;
  return {
    setters: [],
    execute: function () {
      bindingMode = {
        oneTime: 0,
        oneWay: 1,
        twoWay: 2
      };

      _export("bindingMode", bindingMode);
    }
  };
});