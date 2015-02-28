System.register(["./lexer", "./ast"], function (_export) {
  var Lexer, Token, Expression, ArrayOfExpression, Chain, ValueConverter, Assign, Conditional, AccessScope, AccessMember, AccessKeyed, CallScope, CallFunction, CallMember, PrefixNot, Binary, LiteralPrimitive, LiteralArray, LiteralObject, LiteralString, _prototypeProperties, _classCallCheck, EOF, Parser, ParserImplementation;

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
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      EOF = new Token(-1, null);
      Parser = _export("Parser", (function () {
        function Parser() {
          _classCallCheck(this, Parser);

          this.cache = {};
          this.lexer = new Lexer();
        }

        _prototypeProperties(Parser, null, {
          parse: {
            value: function parse(input) {
              input = input || "";

              return this.cache[input] || (this.cache[input] = new ParserImplementation(this.lexer, input).parseChain());
            },
            writable: true,
            configurable: true
          }
        });

        return Parser;
      })());
      ParserImplementation = _export("ParserImplementation", (function () {
        function ParserImplementation(lexer, input) {
          _classCallCheck(this, ParserImplementation);

          this.index = 0;
          this.input = input;
          this.tokens = lexer.lex(input);
        }

        _prototypeProperties(ParserImplementation, null, {
          peek: {
            get: function () {
              return this.index < this.tokens.length ? this.tokens[this.index] : EOF;
            },
            configurable: true
          },
          parseChain: {
            value: function parseChain() {
              var isChain = false,
                  expressions = [];

              while (this.optional(";")) {
                isChain = true;
              }

              while (this.index < this.tokens.length) {
                if (this.peek.text === ")" || this.peek.text === "}" || this.peek.text === "]") {
                  this.error("Unconsumed token " + this.peek.text);
                }

                var expr = this.parseValueConverter();
                expressions.push(expr);

                while (this.optional(";")) {
                  isChain = true;
                }

                if (isChain && expr instanceof ValueConverter) {
                  this.error("cannot have a value converter in a chain");
                }
              }

              return expressions.length === 1 ? expressions[0] : new Chain(expressions);
            },
            writable: true,
            configurable: true
          },
          parseValueConverter: {
            value: function parseValueConverter() {
              var result = this.parseExpression();

              while (this.optional("|")) {
                var name = this.peek.text,
                    // TODO(kasperl): Restrict to identifier?
                args = [];

                this.advance();

                while (this.optional(":")) {
                  // TODO(kasperl): Is this really supposed to be expressions?
                  args.push(this.parseExpression());
                }

                result = new ValueConverter(result, name, args, [result].concat(args));
              }

              return result;
            },
            writable: true,
            configurable: true
          },
          parseExpression: {
            value: function parseExpression() {
              var start = this.peek.index,
                  result = this.parseConditional();

              while (this.peek.text === "=") {
                if (!result.isAssignable) {
                  var end = this.index < this.tokens.length ? this.peek.index : this.input.length;
                  var expression = this.input.substring(start, end);

                  this.error("Expression " + expression + " is not assignable");
                }

                this.expect("=");
                result = new Assign(result, this.parseConditional());
              }

              return result;
            },
            writable: true,
            configurable: true
          },
          parseConditional: {
            value: function parseConditional() {
              var start = this.peek.index,
                  result = this.parseLogicalOr();

              if (this.optional("?")) {
                var yes = this.parseExpression();

                if (!this.optional(":")) {
                  var end = this.index < this.tokens.length ? this.peek.index : this.input.length;
                  var expression = this.input.substring(start, end);

                  this.error("Conditional expression " + expression + " requires all 3 expressions");
                }

                var no = this.parseExpression();
                result = new Conditional(result, yes, no);
              }

              return result;
            },
            writable: true,
            configurable: true
          },
          parseLogicalOr: {
            value: function parseLogicalOr() {
              var result = this.parseLogicalAnd();

              while (this.optional("||")) {
                result = new Binary("||", result, this.parseLogicalAnd());
              }

              return result;
            },
            writable: true,
            configurable: true
          },
          parseLogicalAnd: {
            value: function parseLogicalAnd() {
              var result = this.parseEquality();

              while (this.optional("&&")) {
                result = new Binary("&&", result, this.parseEquality());
              }

              return result;
            },
            writable: true,
            configurable: true
          },
          parseEquality: {
            value: function parseEquality() {
              var result = this.parseRelational();

              while (true) {
                if (this.optional("==")) {
                  result = new Binary("==", result, this.parseRelational());
                } else if (this.optional("!=")) {
                  result = new Binary("!=", result, this.parseRelational());
                } else if (this.optional("===")) {
                  result = new Binary("===", result, this.parseRelational());
                } else if (this.optional("!==")) {
                  result = new Binary("!==", result, this.parseRelational());
                } else {
                  return result;
                }
              }
            },
            writable: true,
            configurable: true
          },
          parseRelational: {
            value: function parseRelational() {
              var result = this.parseAdditive();

              while (true) {
                if (this.optional("<")) {
                  result = new Binary("<", result, this.parseAdditive());
                } else if (this.optional(">")) {
                  result = new Binary(">", result, this.parseAdditive());
                } else if (this.optional("<=")) {
                  result = new Binary("<=", result, this.parseAdditive());
                } else if (this.optional(">=")) {
                  result = new Binary(">=", result, this.parseAdditive());
                } else {
                  return result;
                }
              }
            },
            writable: true,
            configurable: true
          },
          parseAdditive: {
            value: function parseAdditive() {
              var result = this.parseMultiplicative();

              while (true) {
                if (this.optional("+")) {
                  result = new Binary("+", result, this.parseMultiplicative());
                } else if (this.optional("-")) {
                  result = new Binary("-", result, this.parseMultiplicative());
                } else {
                  return result;
                }
              }
            },
            writable: true,
            configurable: true
          },
          parseMultiplicative: {
            value: function parseMultiplicative() {
              var result = this.parsePrefix();

              while (true) {
                if (this.optional("*")) {
                  result = new Binary("*", result, this.parsePrefix());
                } else if (this.optional("%")) {
                  result = new Binary("%", result, this.parsePrefix());
                } else if (this.optional("/")) {
                  result = new Binary("/", result, this.parsePrefix());
                } else {
                  return result;
                }
              }
            },
            writable: true,
            configurable: true
          },
          parsePrefix: {
            value: function parsePrefix() {
              if (this.optional("+")) {
                return this.parsePrefix(); // TODO(kasperl): This is different than the original parser.
              } else if (this.optional("-")) {
                return new Binary("-", new LiteralPrimitive(0), this.parsePrefix());
              } else if (this.optional("!")) {
                return new PrefixNot("!", this.parsePrefix());
              } else {
                return this.parseAccessOrCallMember();
              }
            },
            writable: true,
            configurable: true
          },
          parseAccessOrCallMember: {
            value: function parseAccessOrCallMember() {
              var result = this.parsePrimary();

              while (true) {
                if (this.optional(".")) {
                  var name = this.peek.text; // TODO(kasperl): Check that this is an identifier. Are keywords okay?

                  this.advance();

                  if (this.optional("(")) {
                    var args = this.parseExpressionList(")");
                    this.expect(")");
                    result = new CallMember(result, name, args);
                  } else {
                    result = new AccessMember(result, name);
                  }
                } else if (this.optional("[")) {
                  var key = this.parseExpression();
                  this.expect("]");
                  result = new AccessKeyed(result, key);
                } else if (this.optional("(")) {
                  var args = this.parseExpressionList(")");
                  this.expect(")");
                  result = new CallFunction(result, args);
                } else {
                  return result;
                }
              }
            },
            writable: true,
            configurable: true
          },
          parsePrimary: {
            value: function parsePrimary() {
              if (this.optional("(")) {
                var result = this.parseExpression();
                this.expect(")");
                return result;
              } else if (this.optional("null") || this.optional("undefined")) {
                return new LiteralPrimitive(null);
              } else if (this.optional("true")) {
                return new LiteralPrimitive(true);
              } else if (this.optional("false")) {
                return new LiteralPrimitive(false);
              } else if (this.optional("[")) {
                var elements = this.parseExpressionList("]");
                this.expect("]");
                return new LiteralArray(elements);
              } else if (this.peek.text == "{") {
                return this.parseObject();
              } else if (this.peek.key != null) {
                return this.parseAccessOrCallScope();
              } else if (this.peek.value != null) {
                var value = this.peek.value;
                this.advance();
                return isNaN(value) ? new LiteralString(value) : new LiteralPrimitive(value);
              } else if (this.index >= this.tokens.length) {
                throw new Error("Unexpected end of expression: " + this.input);
              } else {
                this.error("Unexpected token " + this.peek.text);
              }
            },
            writable: true,
            configurable: true
          },
          parseAccessOrCallScope: {
            value: function parseAccessOrCallScope() {
              var name = this.peek.key;

              this.advance();

              if (!this.optional("(")) {
                return new AccessScope(name);
              }

              var args = this.parseExpressionList(")");
              this.expect(")");
              return new CallScope(name, args);
            },
            writable: true,
            configurable: true
          },
          parseObject: {
            value: function parseObject() {
              var keys = [],
                  values = [];

              this.expect("{");

              if (this.peek.text !== "}") {
                do {
                  // TODO(kasperl): Stricter checking. Only allow identifiers
                  // and strings as keys. Maybe also keywords?
                  var value = this.peek.value;
                  keys.push(typeof value === "string" ? value : this.peek.text);

                  this.advance();
                  this.expect(":");

                  values.push(this.parseExpression());
                } while (this.optional(","));
              }

              this.expect("}");

              return new LiteralObject(keys, values);
            },
            writable: true,
            configurable: true
          },
          parseExpressionList: {
            value: function parseExpressionList(terminator) {
              var result = [];

              if (this.peek.text != terminator) {
                do {
                  result.push(this.parseExpression());
                } while (this.optional(","));
              }

              return result;
            },
            writable: true,
            configurable: true
          },
          optional: {
            value: function optional(text) {
              if (this.peek.text === text) {
                this.advance();
                return true;
              }

              return false;
            },
            writable: true,
            configurable: true
          },
          expect: {
            value: function expect(text) {
              if (this.peek.text === text) {
                this.advance();
              } else {
                this.error("Missing expected " + text);
              }
            },
            writable: true,
            configurable: true
          },
          advance: {
            value: function advance() {
              this.index++;
            },
            writable: true,
            configurable: true
          },
          error: {
            value: function error(message) {
              var location = this.index < this.tokens.length ? "at column " + (this.tokens[this.index].index + 1) + " in" : "at the end of the expression";

              throw new Error("Parser Error: " + message + " " + location + " [" + this.input + "]");
            },
            writable: true,
            configurable: true
          }
        });

        return ParserImplementation;
      })());
    }
  };
});