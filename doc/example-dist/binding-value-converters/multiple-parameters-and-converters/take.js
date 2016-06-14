define(["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var TakeValueConverter = exports.TakeValueConverter = function () {
    function TakeValueConverter() {
      _classCallCheck(this, TakeValueConverter);
    }

    TakeValueConverter.prototype.toView = function toView(array, count) {
      return array.slice(0, count);
    };

    return TakeValueConverter;
  }();
});