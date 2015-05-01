System.register(['./lexer', './ast'], function (_export) {
  var Lexer, Token, Expression, ArrayOfExpression, Chain, ValueConverter, Assign, Conditional, AccessScope, AccessMember, AccessKeyed, CallScope, CallFunction, CallMember, PrefixNot, Binary, LiteralPrimitive, LiteralArray, LiteralObject, LiteralString, _createClass, _classCallCheck, EOF, Parser, ParserImplementation;

  return {
    setters: [function (_lexer) {
      Lexer = _lexer.Lexer;
      Token = _lexer.Token;
    }, function (_ast) {
      Expression = _ast.Expression;
      ArrayOfExpression = _ast.ArrayOfExpression;
      Chain = _ast.Chain;
      ValueConverter = _ast.ValueConverter;
      Assign = _ast.Assign;
      Conditional = _ast.Conditional;
      AccessScope = _ast.AccessScope;
      AccessMember = _ast.AccessMember;
      AccessKeyed = _ast.AccessKeyed;
      CallScope = _ast.CallScope;
      CallFunction = _ast.CallFunction;
      CallMember = _ast.CallMember;
      PrefixNot = _ast.PrefixNot;
      Binary = _ast.Binary;
      LiteralPrimitive = _ast.LiteralPrimitive;
      LiteralArray = _ast.LiteralArray;
      LiteralObject = _ast.LiteralObject;
      LiteralString = _ast.LiteralString;
    }],
    execute: function () {
      'use strict';

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      EOF = new Token(-1, null);

      Parser = (function () {
        function Parser() {
          _classCallCheck(this, Parser);

          this.cache = {};
          this.lexer = new Lexer();
        }

        Parser.prototype.parse = function parse(input) {
          input = input || '';

          return this.cache[input] || (this.cache[input] = new ParserImplementation(this.lexer, input).parseChain());
        };

        return Parser;
      })();

      _export('Parser', Parser);

      ParserImplementation = (function () {
        function ParserImplementation(lexer, input) {
          _classCallCheck(this, ParserImplementation);

          this.index = 0;
          this.input = input;
          this.tokens = lexer.lex(input);
        }

        ParserImplementation.prototype.parseChain = function parseChain() {
          var isChain = false,
              expressions = [];

          while (this.optional(';')) {
            isChain = true;
          }

          while (this.index < this.tokens.length) {
            if (this.peek.text === ')' || this.peek.text === '}' || this.peek.text === ']') {
              this.error('Unconsumed token ' + this.peek.text);
            }

            var expr = this.parseValueConverter();
            expressions.push(expr);

            while (this.optional(';')) {
              isChain = true;
            }

            if (isChain && expr instanceof ValueConverter) {
              this.error('cannot have a value converter in a chain');
            }
          }

          return expressions.length === 1 ? expressions[0] : new Chain(expressions);
        };

        ParserImplementation.prototype.parseValueConverter = function parseValueConverter() {
          var result = this.parseExpression();

          while (this.optional('|')) {
            var name = this.peek.text,
                args = [];

            this.advance();

            while (this.optional(':')) {
              args.push(this.parseExpression());
            }

            result = new ValueConverter(result, name, args, [result].concat(args));
          }

          return result;
        };

        ParserImplementation.prototype.parseExpression = function parseExpression() {
          var start = this.peek.index,
              result = this.parseConditional();

          while (this.peek.text === '=') {
            if (!result.isAssignable) {
              var end = this.index < this.tokens.length ? this.peek.index : this.input.length;
              var expression = this.input.substring(start, end);

              this.error('Expression ' + expression + ' is not assignable');
            }

            this.expect('=');
            result = new Assign(result, this.parseConditional());
          }

          return result;
        };

        ParserImplementation.prototype.parseConditional = function parseConditional() {
          var start = this.peek.index,
              result = this.parseLogicalOr();

          if (this.optional('?')) {
            var yes = this.parseExpression();

            if (!this.optional(':')) {
              var end = this.index < this.tokens.length ? this.peek.index : this.input.length;
              var expression = this.input.substring(start, end);

              this.error('Conditional expression ' + expression + ' requires all 3 expressions');
            }

            var no = this.parseExpression();
            result = new Conditional(result, yes, no);
          }

          return result;
        };

        ParserImplementation.prototype.parseLogicalOr = function parseLogicalOr() {
          var result = this.parseLogicalAnd();

          while (this.optional('||')) {
            result = new Binary('||', result, this.parseLogicalAnd());
          }

          return result;
        };

        ParserImplementation.prototype.parseLogicalAnd = function parseLogicalAnd() {
          var result = this.parseEquality();

          while (this.optional('&&')) {
            result = new Binary('&&', result, this.parseEquality());
          }

          return result;
        };

        ParserImplementation.prototype.parseEquality = function parseEquality() {
          var result = this.parseRelational();

          while (true) {
            if (this.optional('==')) {
              result = new Binary('==', result, this.parseRelational());
            } else if (this.optional('!=')) {
              result = new Binary('!=', result, this.parseRelational());
            } else if (this.optional('===')) {
              result = new Binary('===', result, this.parseRelational());
            } else if (this.optional('!==')) {
              result = new Binary('!==', result, this.parseRelational());
            } else {
              return result;
            }
          }
        };

        ParserImplementation.prototype.parseRelational = function parseRelational() {
          var result = this.parseAdditive();

          while (true) {
            if (this.optional('<')) {
              result = new Binary('<', result, this.parseAdditive());
            } else if (this.optional('>')) {
              result = new Binary('>', result, this.parseAdditive());
            } else if (this.optional('<=')) {
              result = new Binary('<=', result, this.parseAdditive());
            } else if (this.optional('>=')) {
              result = new Binary('>=', result, this.parseAdditive());
            } else {
              return result;
            }
          }
        };

        ParserImplementation.prototype.parseAdditive = function parseAdditive() {
          var result = this.parseMultiplicative();

          while (true) {
            if (this.optional('+')) {
              result = new Binary('+', result, this.parseMultiplicative());
            } else if (this.optional('-')) {
              result = new Binary('-', result, this.parseMultiplicative());
            } else {
              return result;
            }
          }
        };

        ParserImplementation.prototype.parseMultiplicative = function parseMultiplicative() {
          var result = this.parsePrefix();

          while (true) {
            if (this.optional('*')) {
              result = new Binary('*', result, this.parsePrefix());
            } else if (this.optional('%')) {
              result = new Binary('%', result, this.parsePrefix());
            } else if (this.optional('/')) {
              result = new Binary('/', result, this.parsePrefix());
            } else {
              return result;
            }
          }
        };

        ParserImplementation.prototype.parsePrefix = function parsePrefix() {
          if (this.optional('+')) {
            return this.parsePrefix();
          } else if (this.optional('-')) {
            return new Binary('-', new LiteralPrimitive(0), this.parsePrefix());
          } else if (this.optional('!')) {
            return new PrefixNot('!', this.parsePrefix());
          } else {
            return this.parseAccessOrCallMember();
          }
        };

        ParserImplementation.prototype.parseAccessOrCallMember = function parseAccessOrCallMember() {
          var result = this.parsePrimary();

          while (true) {
            if (this.optional('.')) {
              var name = this.peek.text;

              this.advance();

              if (this.optional('(')) {
                var args = this.parseExpressionList(')');
                this.expect(')');
                result = new CallMember(result, name, args);
              } else {
                result = new AccessMember(result, name);
              }
            } else if (this.optional('[')) {
              var key = this.parseExpression();
              this.expect(']');
              result = new AccessKeyed(result, key);
            } else if (this.optional('(')) {
              var args = this.parseExpressionList(')');
              this.expect(')');
              result = new CallFunction(result, args);
            } else {
              return result;
            }
          }
        };

        ParserImplementation.prototype.parsePrimary = function parsePrimary() {
          if (this.optional('(')) {
            var result = this.parseExpression();
            this.expect(')');
            return result;
          } else if (this.optional('null') || this.optional('undefined')) {
            return new LiteralPrimitive(null);
          } else if (this.optional('true')) {
            return new LiteralPrimitive(true);
          } else if (this.optional('false')) {
            return new LiteralPrimitive(false);
          } else if (this.optional('[')) {
            var elements = this.parseExpressionList(']');
            this.expect(']');
            return new LiteralArray(elements);
          } else if (this.peek.text == '{') {
            return this.parseObject();
          } else if (this.peek.key != null) {
            return this.parseAccessOrCallScope();
          } else if (this.peek.value != null) {
            var value = this.peek.value;
            this.advance();
            return isNaN(value) ? new LiteralString(value) : new LiteralPrimitive(value);
          } else if (this.index >= this.tokens.length) {
            throw new Error('Unexpected end of expression: ' + this.input);
          } else {
            this.error('Unexpected token ' + this.peek.text);
          }
        };

        ParserImplementation.prototype.parseAccessOrCallScope = function parseAccessOrCallScope() {
          var name = this.peek.key;

          this.advance();

          if (!this.optional('(')) {
            return new AccessScope(name);
          }

          var args = this.parseExpressionList(')');
          this.expect(')');
          return new CallScope(name, args);
        };

        ParserImplementation.prototype.parseObject = function parseObject() {
          var keys = [],
              values = [];

          this.expect('{');

          if (this.peek.text !== '}') {
            do {
              var value = this.peek.value;
              keys.push(typeof value === 'string' ? value : this.peek.text);

              this.advance();
              this.expect(':');

              values.push(this.parseExpression());
            } while (this.optional(','));
          }

          this.expect('}');

          return new LiteralObject(keys, values);
        };

        ParserImplementation.prototype.parseExpressionList = function parseExpressionList(terminator) {
          var result = [];

          if (this.peek.text != terminator) {
            do {
              result.push(this.parseExpression());
            } while (this.optional(','));
          }

          return result;
        };

        ParserImplementation.prototype.optional = function optional(text) {
          if (this.peek.text === text) {
            this.advance();
            return true;
          }

          return false;
        };

        ParserImplementation.prototype.expect = function expect(text) {
          if (this.peek.text === text) {
            this.advance();
          } else {
            this.error('Missing expected ' + text);
          }
        };

        ParserImplementation.prototype.advance = function advance() {
          this.index++;
        };

        ParserImplementation.prototype.error = function error(message) {
          var location = this.index < this.tokens.length ? 'at column ' + (this.tokens[this.index].index + 1) + ' in' : 'at the end of the expression';

          throw new Error('Parser Error: ' + message + ' ' + location + ' [' + this.input + ']');
        };

        _createClass(ParserImplementation, [{
          key: 'peek',
          get: function () {
            return this.index < this.tokens.length ? this.tokens[this.index] : EOF;
          }
        }]);

        return ParserImplementation;
      })();

      _export('ParserImplementation', ParserImplementation);
    }
  };
});