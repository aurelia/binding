System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, Token, Lexer, Scanner, OPERATORS, $EOF, $TAB, $LF, $VTAB, $FF, $CR, $SPACE, $BANG, $DQ, $$, $PERCENT, $AMPERSAND, $SQ, $LPAREN, $RPAREN, $STAR, $PLUS, $COMMA, $MINUS, $PERIOD, $SLASH, $COLON, $SEMICOLON, $LT, $EQ, $GT, $QUESTION, $0, $9, $A, $E, $Z, $LBRACKET, $BACKSLASH, $RBRACKET, $CARET, $_, $a, $e, $f, $n, $r, $t, $u, $v, $z, $LBRACE, $BAR, $RBRACE, $NBSP;

  function isWhitespace(code) {
    return code >= $TAB && code <= $SPACE || code === $NBSP;
  }

  function isIdentifierStart(code) {
    return $a <= code && code <= $z || $A <= code && code <= $Z || code === $_ || code === $$;
  }

  function isIdentifierPart(code) {
    return $a <= code && code <= $z || $A <= code && code <= $Z || $0 <= code && code <= $9 || code === $_ || code === $$;
  }

  function isDigit(code) {
    return $0 <= code && code <= $9;
  }

  function isExponentStart(code) {
    return code === $e || code === $E;
  }

  function isExponentSign(code) {
    return code === $MINUS || code === $PLUS;
  }

  function unescape(code) {
    switch (code) {
      case $n:
        return $LF;
      case $f:
        return $FF;
      case $r:
        return $CR;
      case $t:
        return $TAB;
      case $v:
        return $VTAB;
      default:
        return code;
    }
  }

  function assert(condition, message) {
    if (!condition) {
      throw message || "Assertion failed";
    }
  }
  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      Token = _export("Token", (function () {
        function Token(index, text) {
          _classCallCheck(this, Token);

          this.index = index;
          this.text = text;
        }

        _prototypeProperties(Token, null, {
          withOp: {
            value: function withOp(op) {
              this.opKey = op;
              return this;
            },
            writable: true,
            configurable: true
          },
          withGetterSetter: {
            value: function withGetterSetter(key) {
              this.key = key;
              return this;
            },
            writable: true,
            configurable: true
          },
          withValue: {
            value: function withValue(value) {
              this.value = value;
              return this;
            },
            writable: true,
            configurable: true
          },
          toString: {
            value: function toString() {
              return "Token(" + this.text + ")";
            },
            writable: true,
            configurable: true
          }
        });

        return Token;
      })());
      Lexer = _export("Lexer", (function () {
        function Lexer() {
          _classCallCheck(this, Lexer);
        }

        _prototypeProperties(Lexer, null, {
          lex: {
            value: function lex(text) {
              var scanner = new Scanner(text);
              var tokens = [];
              var token = scanner.scanToken();

              while (token) {
                tokens.push(token);
                token = scanner.scanToken();
              }

              return tokens;
            },
            writable: true,
            configurable: true
          }
        });

        return Lexer;
      })());
      Scanner = _export("Scanner", (function () {
        function Scanner(input) {
          _classCallCheck(this, Scanner);

          this.input = input;
          this.length = input.length;
          this.peek = 0;
          this.index = -1;

          this.advance();
        }

        _prototypeProperties(Scanner, null, {
          scanToken: {
            value: function scanToken() {
              // Skip whitespace.
              while (this.peek <= $SPACE) {
                if (++this.index >= this.length) {
                  this.peek = $EOF;
                  return null;
                } else {
                  this.peek = this.input.charCodeAt(this.index);
                }
              }

              // Handle identifiers and numbers.
              if (isIdentifierStart(this.peek)) {
                return this.scanIdentifier();
              }

              if (isDigit(this.peek)) {
                return this.scanNumber(this.index);
              }

              var start = this.index;

              switch (this.peek) {
                case $PERIOD:
                  this.advance();
                  return isDigit(this.peek) ? this.scanNumber(start) : new Token(start, ".");
                case $LPAREN:
                case $RPAREN:
                case $LBRACE:
                case $RBRACE:
                case $LBRACKET:
                case $RBRACKET:
                case $COMMA:
                case $COLON:
                case $SEMICOLON:
                  return this.scanCharacter(start, String.fromCharCode(this.peek));
                case $SQ:
                case $DQ:
                  return this.scanString();
                case $PLUS:
                case $MINUS:
                case $STAR:
                case $SLASH:
                case $PERCENT:
                case $CARET:
                case $QUESTION:
                  return this.scanOperator(start, String.fromCharCode(this.peek));
                case $LT:
                case $GT:
                case $BANG:
                case $EQ:
                  return this.scanComplexOperator(start, $EQ, String.fromCharCode(this.peek), "=");
                case $AMPERSAND:
                  return this.scanComplexOperator(start, $AMPERSAND, "&", "&");
                case $BAR:
                  return this.scanComplexOperator(start, $BAR, "|", "|");
                case $NBSP:
                  while (isWhitespace(this.peek)) {
                    this.advance();
                  }

                  return this.scanToken();
              }

              var character = String.fromCharCode(this.peek);
              this.error("Unexpected character [" + character + "]");
              return null;
            },
            writable: true,
            configurable: true
          },
          scanCharacter: {
            value: function scanCharacter(start, text) {
              assert(this.peek === text.charCodeAt(0));
              this.advance();
              return new Token(start, text);
            },
            writable: true,
            configurable: true
          },
          scanOperator: {
            value: function scanOperator(start, text) {
              assert(this.peek === text.charCodeAt(0));
              assert(OPERATORS.indexOf(text) !== -1);
              this.advance();
              return new Token(start, text).withOp(text);
            },
            writable: true,
            configurable: true
          },
          scanComplexOperator: {
            value: function scanComplexOperator(start, code, one, two) {
              assert(this.peek === one.charCodeAt(0));
              this.advance();

              var text = one;

              if (this.peek === code) {
                this.advance();
                text += two;
              }

              if (this.peek === code) {
                this.advance();
                text += two;
              }

              assert(OPERATORS.indexOf(text) != -1);

              return new Token(start, text).withOp(text);
            },
            writable: true,
            configurable: true
          },
          scanIdentifier: {
            value: function scanIdentifier() {
              assert(isIdentifierStart(this.peek));
              var start = this.index;

              this.advance();

              while (isIdentifierPart(this.peek)) {
                this.advance();
              }

              var text = this.input.substring(start, this.index);
              var result = new Token(start, text);

              // TODO(kasperl): Deal with null, undefined, true, and false in
              // a cleaner and faster way.
              if (OPERATORS.indexOf(text) !== -1) {
                result.withOp(text);
              } else {
                result.withGetterSetter(text);
              }

              return result;
            },
            writable: true,
            configurable: true
          },
          scanNumber: {
            value: function scanNumber(start) {
              assert(isDigit(this.peek));
              var simple = this.index === start;
              this.advance(); // Skip initial digit.

              while (true) {
                if (isDigit(this.peek)) {} else if (this.peek === $PERIOD) {
                  simple = false;
                } else if (isExponentStart(this.peek)) {
                  this.advance();

                  if (isExponentSign(this.peek)) {
                    this.advance();
                  }

                  if (!isDigit(this.peek)) {
                    this.error("Invalid exponent", -1);
                  }

                  simple = false;
                } else {
                  break;
                }

                this.advance();
              }

              var text = this.input.substring(start, this.index);
              var value = simple ? parseInt(text) : parseFloat(text);
              return new Token(start, text).withValue(value);
            },
            writable: true,
            configurable: true
          },
          scanString: {
            value: function scanString() {
              assert(this.peek === $SQ || this.peek === $DQ);

              var start = this.index;
              var quote = this.peek;

              this.advance(); // Skip initial quote.

              var buffer;
              var marker = this.index;

              while (this.peek !== quote) {
                if (this.peek === $BACKSLASH) {
                  if (buffer === null) {
                    buffer = [];
                  }

                  buffer.push(this.input.substring(marker, this.index));
                  this.advance();

                  var unescaped;

                  if (this.peek === $u) {
                    // TODO(kasperl): Check bounds? Make sure we have test
                    // coverage for this.
                    var hex = this.input.substring(this.index + 1, this.index + 5);

                    if (!/[A-Z0-9]{4}/.test(hex)) {
                      this.error("Invalid unicode escape [\\u" + hex + "]");
                    }

                    unescaped = parseInt(hex, 16);

                    for (var i = 0; i < 5; ++i) {
                      this.advance();
                    }
                  } else {
                    unescaped = decodeURIComponent(this.peek);
                    this.advance();
                  }

                  buffer.push(String.fromCharCode(unescaped));
                  marker = this.index;
                } else if (this.peek === $EOF) {
                  this.error("Unterminated quote");
                } else {
                  this.advance();
                }
              }

              var last = this.input.substring(marker, this.index);
              this.advance(); // Skip terminating quote.
              var text = this.input.substring(start, this.index);

              // Compute the unescaped string value.
              var unescaped = last;

              if (buffer != null) {
                buffer.push(last);
                unescaped = buffer.join("");
              }

              return new Token(start, text).withValue(unescaped);
            },
            writable: true,
            configurable: true
          },
          advance: {
            value: function advance() {
              if (++this.index >= this.length) {
                this.peek = $EOF;
              } else {
                this.peek = this.input.charCodeAt(this.index);
              }
            },
            writable: true,
            configurable: true
          },
          error: {
            value: function error(message) {
              var offset = arguments[1] === undefined ? 0 : arguments[1];

              // TODO(kasperl): Try to get rid of the offset. It is only used to match
              // the error expectations in the lexer tests for numbers with exponents.
              var position = this.index + offset;
              throw new Error("Lexer Error: " + message + " at column " + position + " in expression [" + this.input + "]");
            },
            writable: true,
            configurable: true
          }
        });

        return Scanner;
      })());
      OPERATORS = ["undefined", "null", "true", "false", "+", "-", "*", "/", "%", "^", "=", "==", "===", "!=", "!==", "<", ">", "<=", ">=", "&&", "||", "&", "|", "!", "?"];
      $EOF = 0;
      $TAB = 9;
      $LF = 10;
      $VTAB = 11;
      $FF = 12;
      $CR = 13;
      $SPACE = 32;
      $BANG = 33;
      $DQ = 34;
      $$ = 36;
      $PERCENT = 37;
      $AMPERSAND = 38;
      $SQ = 39;
      $LPAREN = 40;
      $RPAREN = 41;
      $STAR = 42;
      $PLUS = 43;
      $COMMA = 44;
      $MINUS = 45;
      $PERIOD = 46;
      $SLASH = 47;
      $COLON = 58;
      $SEMICOLON = 59;
      $LT = 60;
      $EQ = 61;
      $GT = 62;
      $QUESTION = 63;
      $0 = 48;
      $9 = 57;
      $A = 65;
      $E = 69;
      $Z = 90;
      $LBRACKET = 91;
      $BACKSLASH = 92;
      $RBRACKET = 93;
      $CARET = 94;
      $_ = 95;
      $a = 97;
      $e = 101;
      $f = 102;
      $n = 110;
      $r = 114;
      $t = 116;
      $u = 117;
      $v = 118;
      $z = 122;
      $LBRACE = 123;
      $BAR = 124;
      $RBRACE = 125;
      $NBSP = 160;
    }
  };
});

// Do nothing.