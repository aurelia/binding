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

  var App = exports.App = function () {
    function App() {
      _classCallCheck(this, App);

      this.firstName = 'John';
      this.lastName = 'Doe';
    }

    App.prototype.mouseMove = function mouseMove(e) {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    };

    App.prototype.mouseMove200 = function mouseMove200(e) {
      this.mouse200X = e.clientX;
      this.mouse200Y = e.clientY;
    };

    App.prototype.mouseMove800 = function mouseMove800(e) {
      this.mouse800X = e.clientX;
      this.mouse800Y = e.clientY;
    };

    return App;
  }();
});