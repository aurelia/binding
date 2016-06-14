define(['exports', 'numeral'], function (exports, _numeral) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.CurrencyFormatValueConverter = undefined;

  var _numeral2 = _interopRequireDefault(_numeral);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
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
      return (0, _numeral2.default)(value).format('($0,0.00)');
    };

    return CurrencyFormatValueConverter;
  }();
});