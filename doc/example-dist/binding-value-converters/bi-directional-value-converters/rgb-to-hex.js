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

  var RgbToHexValueConverter = exports.RgbToHexValueConverter = function () {
    function RgbToHexValueConverter() {
      _classCallCheck(this, RgbToHexValueConverter);
    }

    RgbToHexValueConverter.prototype.toView = function toView(rgb) {
      return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
    };

    RgbToHexValueConverter.prototype.fromView = function fromView(hex) {
      var exp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
          result = exp.exec(hex);
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      };
    };

    return RgbToHexValueConverter;
  }();
});