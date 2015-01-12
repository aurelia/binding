define(["exports"], function (exports) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps);
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
  };

  var NameExpression = (function () {
    var NameExpression = function NameExpression(name, mode) {
      this.property = name;
      this.discrete = true;
      this.mode = (mode || "view-model").toLowerCase();
    };

    _prototypeProperties(NameExpression, null, {
      createBinding: {
        value: function (target) {
          return new NameBinder(this.property, target, this.mode);
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return NameExpression;
  })();

  exports.NameExpression = NameExpression;
  var NameBinder = (function () {
    var NameBinder = function NameBinder(property, target, mode) {
      this.property = property;

      switch (mode) {
        case "element":
          this.target = target;
          break;
        case "view-model":
          this.target = target.primaryBehavior ? target.primaryBehavior.executionContext : target;
          break;
        default:
          throw new Error("Name expressions do not support mode: " + mode);
      }
    };

    _prototypeProperties(NameBinder, null, {
      bind: {
        value: function (source) {
          if (this.source) {
            if (this.source === source) {
              return;
            }

            this.unbind();
          }

          this.source = source;
          source[this.property] = this.target;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      unbind: {
        value: function () {
          this.source[this.property] = null;
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return NameBinder;
  })();
});