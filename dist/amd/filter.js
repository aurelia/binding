define(["exports", "aurelia-metadata"], function (exports, _aureliaMetadata) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var ResourceType = _aureliaMetadata.ResourceType;


  var capitalMatcher = /([A-Z])/g;

  function addHyphenAndLower(char) {
    return "-" + char.toLowerCase();
  }

  function hyphenate(name) {
    return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
  }

  var Filter = (function (ResourceType) {
    var Filter = function Filter(name) {
      this.name = name;
    };

    _extends(Filter, ResourceType);

    Filter.convention = function (name) {
      if (name.endsWith("ValueConverter")) {
        return new Filter(hyphenate(name.substring(0, name.length - 14)));
      }
    };

    Filter.prototype.register = function (registry, name) {
      registry.registerFilter(name || this.name, target);
    };

    return Filter;
  })(ResourceType);

  exports.Filter = Filter;
});