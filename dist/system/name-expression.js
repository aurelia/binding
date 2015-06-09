System.register([], function (_export) {
  'use strict';

  var NameExpression, NameBinder;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [],
    execute: function () {
      NameExpression = (function () {
        function NameExpression(name, mode) {
          _classCallCheck(this, NameExpression);

          this.property = name;
          this.discrete = true;
          this.mode = mode;
        }

        NameExpression.prototype.createBinding = function createBinding(target) {
          return new NameBinder(this.property, target, this.mode);
        };

        return NameExpression;
      })();

      _export('NameExpression', NameExpression);

      NameBinder = (function () {
        function NameBinder(property, target, mode) {
          _classCallCheck(this, NameBinder);

          this.property = property;

          switch (mode) {
            case 'element':
              this.target = target;
              break;
            case 'view-model':
              this.target = target.primaryBehavior.executionContext;
              break;
            default:
              this.target = target[mode];

              if (this.target === undefined) {
                throw new Error('Attempted to reference "' + mode + '", but it was not found on the target element.');
              } else {
                this.target = this.target.executionContext || this.target;
              }

              break;
          }
        }

        NameBinder.prototype.bind = function bind(source) {
          if (this.source) {
            if (this.source === source) {
              return;
            }

            this.unbind();
          }

          this.source = source;
          source[this.property] = this.target;
        };

        NameBinder.prototype.unbind = function unbind() {
          this.source[this.property] = null;
        };

        return NameBinder;
      })();
    }
  };
});