define(['exports', 'numeral'], function (exports, _numeral) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.NumberFormatValueConverter = undefined;

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

  var NumberFormatValueConverter = exports.NumberFormatValueConverter = function () {
    function NumberFormatValueConverter() {
      _classCallCheck(this, NumberFormatValueConverter);
    }

    NumberFormatValueConverter.prototype.toView = function toView(value, format) {
      return (0, _numeral2.default)(value).format(format);
    };

    return NumberFormatValueConverter;
  }();
});