define(["exports"], function (exports) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var NameExpression = exports.NameExpression = (function () {
    function NameExpression(name, mode) {
      _classCallCheck(this, NameExpression);

      this.property = name;
      this.discrete = true;
      this.mode = (mode || "view-model").toLowerCase();
    }

    _prototypeProperties(NameExpression, null, {
      createBinding: {
        value: function createBinding(target) {
          return new NameBinder(this.property, target, this.mode);
        },
        writable: true,
        configurable: true
      }
    });

    return NameExpression;
  })();

  var NameBinder = (function () {
    function NameBinder(property, target, mode) {
      _classCallCheck(this, NameBinder);

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
    }

    _prototypeProperties(NameBinder, null, {
      bind: {
        value: function bind(source) {
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
        configurable: true
      },
      unbind: {
        value: function unbind() {
          this.source[this.property] = null;
        },
        writable: true,
        configurable: true
      }
    });

    return NameBinder;
  })();

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});