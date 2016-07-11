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

  var App = exports.App = function App() {
    _classCallCheck(this, App);

    this.products = [{ id: 0, name: 'Motherboard' }, { id: 1, name: 'CPU' }, { id: 2, name: 'Memory' }];
    this.selectedProduct = null;
  };
});