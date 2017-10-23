define(['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var FlightTimeValueConverter = exports.FlightTimeValueConverter = function () {
    function FlightTimeValueConverter() {
      _classCallCheck(this, FlightTimeValueConverter);

      this.signals = 'locale-changed';
    }

    FlightTimeValueConverter.prototype.toView = function toView(val) {
      var newVal = val instanceof Date ? val.toLocaleString(window.currentLocale) : val === null ? '' : val;
      return newVal;
    };

    return FlightTimeValueConverter;
  }();
});