define(["exports", "./lexer", "./ast"], function (exports, _lexer, _ast) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps);
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
  };

  var Lexer = _lexer.Lexer;
  var Token = _lexer.Token;
  var Expression = _ast.Expression;
  var ArrayOfExpression = _ast.ArrayOfExpression;
  var Chain = _ast.Chain;
  var ValueConverter = _ast.ValueConverter;
  var Assign = _ast.Assign;
  var Conditional = _ast.Conditional;
  var AccessScope = _ast.AccessScope;
  var AccessMember = _ast.AccessMember;
  var AccessKeyed = _ast.AccessKeyed;
  var CallScope = _ast.CallScope;
  var CallFunction = _ast.CallFunction;
  var CallMember = _ast.CallMember;
  var PrefixNot = _ast.PrefixNot;
  var Binary = _ast.Binary;
  var LiteralPrimitive = _ast.LiteralPrimitive;
  var LiteralArray = _ast.LiteralArray;
  var LiteralObject = _ast.LiteralObject;
  var LiteralString = _ast.LiteralString;


  var EOF = new Token(-1, null);

  var Parser = function Parser() {
    this.cache = {};
    this.lexer = new Lexer();
  };

  Parser.prototype.parse = function (input) {
    input = input || "";

    return this.cache[input] || (this.cache[input] = new ParserImplementation(this.lexer, input).parseChain());
  };

  exports.Parser = Parser;
  var ParserImplementation = function ParserImplementation(lexer, input) {
    this.index = 0;
    this.input = input;
    this.tokens = lexer.lex(input);
  };

  ParserImplementation.prototype.parseChain = function () {
    var isChain = false, expressions = [];

    while (this.optional(";")) {
      isChain = true;
    }

    while (this.index < this.tokens.length) {
      if (this.peek.text == ")" || this.peek.text == "}" || this.peek.text == "]") {
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

    return expressions.length == 1 ? expressions[0] : new Chain(expressions);
  };

  ParserImplementation.prototype.parseValueConverter = function () {
    var result = this.parseExpression();

    while (this.optional("|")) {
      var name = this.peek.text, args = [];

      this.advance();

      while (this.optional(":")) {
        args.push(this.parseExpression());
      }

      result = new ValueConverter(result, name, args, [result].concat(args));
    }

    return result;
  };

  ParserImplementation.prototype.parseExpression = function () {
    var start = this.peek.index, result = this.parseConditional();

    while (this.peek.text == "=") {
      if (!result.isAssignable) {
        var end = this.index < this.tokens.length ? this.peek.index : this.input.length;
        var expression = this.input.substring(start, end);

        this.error("Expression " + expression + " is not assignable");
      }

      this.expect("=");
      result = new Assign(result, this.parseConditional());
    }

    return result;
  };

  ParserImplementation.prototype.parseConditional = function () {
    var start = this.peek.index, result = this.parseLogicalOr();

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
  };

  ParserImplementation.prototype.parseLogicalOr = function () {
    var result = this.parseLogicalAnd();

    while (this.optional("||")) {
      result = new Binary("||", result, this.parseLogicalAnd());
    }

    return result;
  };

  ParserImplementation.prototype.parseLogicalAnd = function () {
    var result = this.parseEquality();

    while (this.optional("&&")) {
      result = new Binary("&&", result, this.parseEquality());
    }

    return result;
  };

  ParserImplementation.prototype.parseEquality = function () {
    var result = this.parseRelational();

    while (true) {
      if (this.optional("==")) {
        result = new Binary("==", result, this.parseRelational());
      } else if (this.optional("!=")) {
        result = new Binary("!=", result, this.parseRelational());
      } else {
        return result;
      }
    }
  };

  ParserImplementation.prototype.parseRelational = function () {
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
  };

  ParserImplementation.prototype.parseAdditive = function () {
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
  };

  ParserImplementation.prototype.parseMultiplicative = function () {
    var result = this.parsePrefix();

    while (true) {
      if (this.optional("*")) {
        result = new Binary("*", result, this.parsePrefix());
      } else if (this.optional("%")) {
        result = new Binary("%", result, this.parsePrefix());
      } else if (this.optional("/")) {
        result = new Binary("/", result, this.parsePrefix());
      } else if (this.optional("~/")) {
        result = new Binary("~/", result, this.parsePrefix());
      } else {
        return result;
      }
    }
  };

  ParserImplementation.prototype.parsePrefix = function () {
    if (this.optional("+")) {
      return this.parsePrefix();
    } else if (this.optional("-")) {
      return new Binary("-", new LiteralPrimitive(0), this.parsePrefix());
    } else if (this.optional("!")) {
      return new PrefixNot("!", this.parsePrefix());
    } else {
      return this.parseAccessOrCallMember();
    }
  };

  ParserImplementation.prototype.parseAccessOrCallMember = function () {
    var result = this.parsePrimary();

    while (true) {
      if (this.optional(".")) {
        var name = this.peek.text;

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
  };

  ParserImplementation.prototype.parsePrimary = function () {
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
  };

  ParserImplementation.prototype.parseAccessOrCallScope = function () {
    var name = this.peek.key;

    this.advance();

    if (!this.optional("(")) {
      return new AccessScope(name);
    }

    var args = this.parseExpressionList(")");
    this.expect(")");
    return new CallScope(name, args);
  };

  ParserImplementation.prototype.parseObject = function () {
    var keys = [], values = [];

    this.expect("{");

    if (this.peek.text != "}") {
      do {
        var value = this.peek.value;
        keys.push(typeof value == "string" ? value : this.peek.text);

        this.advance();
        this.expect(":");

        values.push(this.parseExpression());
      } while (this.optional(","));
    }

    this.expect("}");

    return new LiteralObject(keys, values);
  };

  ParserImplementation.prototype.parseExpressionList = function (terminator) {
    var result = [];

    if (this.peek.text != terminator) {
      do {
        result.push(this.parseExpression());
      } while (this.optional(","));
    }

    return result;
  };

  ParserImplementation.prototype.optional = function (text) {
    if (this.peek.text == text) {
      this.advance();
      return true;
    }

    return false;
  };

  ParserImplementation.prototype.expect = function (text) {
    if (this.peek.text == text) {
      this.advance();
    } else {
      this.error("Missing expected " + text);
    }
  };

  ParserImplementation.prototype.advance = function () {
    this.index++;
  };

  ParserImplementation.prototype.error = function (message) {
    var location = this.index < this.tokens.length ? "at column " + (this.tokens[this.index].index + 1) + " in" : "at the end of the expression";

    throw new Error("Parser Error: " + message + " " + location + " [" + this.input + "]");
  };

  _prototypeProperties(ParserImplementation, null, {
    peek: {
      get: function () {
        return this.index < this.tokens.length ? this.tokens[this.index] : EOF;
      },
      enumerable: true
    }
  });

  exports.ParserImplementation = ParserImplementation;
});