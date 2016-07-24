define(['exports', 'numeral'], function (exports, _numeral) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.CurrencyFormatValueConverter = undefined;

  var numeral = _interopRequireWildcard(_numeral);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var CurrencyFormatValueConverter = exports.CurrencyFormatValueConverter = function () {
    function CurrencyFormatValueConverter() {
      _classCallCheck(this, CurrencyFormatValueConverter);
    }

    CurrencyFormatValueConverter.prototype.toView = function toView(value) {
      return numeral(value).format('($0,0.00)');
    };

    return CurrencyFormatValueConverter;
  }();
});