System.register([], function (_export) {
  var _classCallCheck, _createClass, NameExpression, NameBinder;

  return {
    setters: [],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      NameExpression = (function () {
        function NameExpression(name, mode) {
          _classCallCheck(this, NameExpression);

          this.property = name;
          this.discrete = true;
          this.mode = (mode || 'view-model').toLowerCase();
        }

        _createClass(NameExpression, [{
          key: 'createBinding',
          value: function createBinding(target) {
            return new NameBinder(this.property, target, this.mode);
          }
        }]);

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

        _createClass(NameBinder, [{
          key: 'bind',
          value: function bind(source) {
            if (this.source) {
              if (this.source === source) {
                return;
              }

              this.unbind();
            }

            this.source = source;
            source[this.property] = this.target;
          }
        }, {
          key: 'unbind',
          value: function unbind() {
            this.source[this.property] = null;
          }
        }]);

        return NameBinder;
      })();
    }
  };
});