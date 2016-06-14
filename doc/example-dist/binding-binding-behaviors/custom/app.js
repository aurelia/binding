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
      var _this = this;

      _classCallCheck(this, App);

      this.firstName = 'John';
      this.lastName = 'Doe';
      this.intercepted = [];

      this.myFunc = function (method, update, value) {
        var info = {
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          method: method,
          value: value
        };

        _this.intercepted.splice(0, 0, info);

        update(value);
      };
    }

    App.prototype.mouseMove = function mouseMove(e) {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    };

    App.prototype.clear = function clear() {
      this.firstName = '';
      this.lastName = '';
    };

    return App;
  }();

  var interceptMethods = ['updateTarget', 'updateSource', 'callSource'];

  var DemoInterceptBindingBehavior = exports.DemoInterceptBindingBehavior = function () {
    function DemoInterceptBindingBehavior() {
      _classCallCheck(this, DemoInterceptBindingBehavior);
    }

    DemoInterceptBindingBehavior.prototype.bind = function bind(binding, scope, interceptor) {
      var i = interceptMethods.length;
      while (i--) {
        var method = interceptMethods[i];
        if (!binding[method]) {
          continue;
        }

        binding['intercepted-' + method] = binding[method];
        var update = binding[method].bind(binding);
        binding[method] = interceptor.bind(binding, method, update);
      }
    };

    DemoInterceptBindingBehavior.prototype.unbind = function unbind(binding, scope) {
      var i = interceptMethods.length;
      while (i--) {
        var method = interceptMethods[i];
        if (!binding[method]) {
          continue;
        }

        binding[method] = binding['intercepted-' + method];
        binding['intercepted-' + method] = null;
      }
    };

    return DemoInterceptBindingBehavior;
  }();
});