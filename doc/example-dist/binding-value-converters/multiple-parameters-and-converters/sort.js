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

    SortValueConverter.prototype.toView = function toView(array, propertyName, direction) {
      var factor = direction === 'ascending' ? 1 : -1;
      return array.sort(function (a, b) {
        return (a[propertyName] - b[propertyName]) * factor;
      });
    };

    return SortValueConverter;
  }();
});