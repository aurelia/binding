define(["exports"], function (exports) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var Token = exports.Token = (function () {
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
  })();

  var Lexer = exports.Lexer = (function () {
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
  })();

  var Scanner = exports.Scanner = (function () {
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
  })();

  var OPERATORS = ["undefined", "null", "true", "false", "+", "-", "*", "/", "%", "^", "=", "==", "===", "!=", "!==", "<", ">", "<=", ">=", "&&", "||", "&", "|", "!", "?"];

  var $EOF = 0;
  var $TAB = 9;
  var $LF = 10;
  var $VTAB = 11;
  var $FF = 12;
  var $CR = 13;
  var $SPACE = 32;
  var $BANG = 33;
  var $DQ = 34;
  var $$ = 36;
  var $PERCENT = 37;
  var $AMPERSAND = 38;
  var $SQ = 39;
  var $LPAREN = 40;
  var $RPAREN = 41;
  var $STAR = 42;
  var $PLUS = 43;
  var $COMMA = 44;
  var $MINUS = 45;
  var $PERIOD = 46;
  var $SLASH = 47;
  var $COLON = 58;
  var $SEMICOLON = 59;
  var $LT = 60;
  var $EQ = 61;
  var $GT = 62;
  var $QUESTION = 63;

  var $0 = 48;
  var $9 = 57;

  var $A = 65;
  var $E = 69;
  var $Z = 90;

  var $LBRACKET = 91;
  var $BACKSLASH = 92;
  var $RBRACKET = 93;
  var $CARET = 94;
  var $_ = 95;

  var $a = 97;
  var $e = 101;
  var $f = 102;
  var $n = 110;
  var $r = 114;
  var $t = 116;
  var $u = 117;
  var $v = 118;
  var $z = 122;

  var $LBRACE = 123;
  var $BAR = 124;
  var $RBRACE = 125;
  var $NBSP = 160;

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
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});

// Do nothing.