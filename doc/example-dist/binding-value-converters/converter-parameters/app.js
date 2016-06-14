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

  var NetWorth = exports.NetWorth = function () {
    function NetWorth() {
      var _this = this;

      _classCallCheck(this, NetWorth);

      this.update();
      setInterval(function () {
        return _this.update();
      }, 1000);
    }

    NetWorth.prototype.update = function update() {
      this.currentDate = new Date();
      this.netWorth = Math.random() * 1000000000;
    };

    return NetWorth;
  }();
});