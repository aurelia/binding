define(['exports', 'aurelia-http-client'], function (exports, _aureliaHttpClient) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.AureliaRepositories = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var AureliaRepositories = exports.AureliaRepositories = function () {
    function AureliaRepositories() {
      _classCallCheck(this, AureliaRepositories);

      this.repos = [];
    }

    AureliaRepositories.prototype.activate = function activate() {
      var _this = this;

      return new _aureliaHttpClient.HttpClient().get('https://api.github.com/orgs/aurelia/repos').then(function (response) {
        return _this.repos = response.content;
      });
    };

    return AureliaRepositories;
  }();
});