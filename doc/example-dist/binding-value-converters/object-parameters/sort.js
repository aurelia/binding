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

  var SortValueConverter = exports.SortValueConverter = function () {
    function SortValueConverter() {
      _classCallCheck(this, SortValueConverter);
    }

    SortValueConverter.prototype.toView = function toView(array, config) {
      var factor = (config.direction || 'ascending') === 'ascending' ? 1 : -1;
      return array.sort(function (a, b) {
        return (a[config.propertyName] - b[config.propertyName]) * factor;
      });
    };

    return SortValueConverter;
  }();
});