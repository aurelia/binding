System.register([], function (_export) {
  var _classCallCheck, NameExpression, NameBinder;

  return {
    setters: [],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      NameExpression = (function () {
        function NameExpression(name, mode) {
          _classCallCheck(this, NameExpression);

          this.property = name;
          this.discrete = true;
          this.mode = (mode || 'view-model').toLowerCase();
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
              this.target = target.primaryBehavior ? target.primaryBehavior.executionContext : target;
              break;
            default:
              throw new Error('Name expressions do not support mode: ' + mode);
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