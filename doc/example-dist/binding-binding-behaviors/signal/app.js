define(['exports', 'aurelia-dependency-injection', 'aurelia-templating-resources'], function (exports, _aureliaDependencyInjection, _aureliaTemplatingResources) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.DemoTimeAgoValueConverter = exports.App = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var App = exports.App = (_dec = (0, _aureliaDependencyInjection.inject)(_aureliaTemplatingResources.BindingSignaler), _dec(_class = function () {
    function App(signaler) {
      _classCallCheck(this, App);

      this.postDateTime = new Date();

      this.signaler = signaler;
    }

    App.prototype.signalBindings = function signalBindings() {
      this.signaler.signal('my-signal');
    };

    return App;
  }()) || _class);

  var DemoTimeAgoValueConverter = exports.DemoTimeAgoValueConverter = function () {
    function DemoTimeAgoValueConverter() {
      _classCallCheck(this, DemoTimeAgoValueConverter);
    }

    DemoTimeAgoValueConverter.prototype.toView = function toView(value) {
      return Math.floor((new Date() - value) / 1000).toString() + ' seconds ago';
    };

    return DemoTimeAgoValueConverter;
  }();
});