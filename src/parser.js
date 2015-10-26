import {Lexer,Token} from './lexer';
import {Expression, ArrayOfExpression, Chain, ValueConverter, Assign,
        Conditional, AccessThis, AccessScope, AccessMember, AccessKeyed,
        CallScope, CallFunction, CallMember, PrefixNot, BindingBehavior,
        Binary, LiteralPrimitive, LiteralArray, LiteralObject, LiteralString} from './ast';

let EOF = new Token(-1, null);

export class Parser {
  constructor() {
    this.cache = {};
    this.lexer = new Lexer();
  }

  parse(input) {
    input = input || '';

    return this.cache[input]
      || (this.cache[input] = new ParserImplementation(this.lexer, input).parseChain());
  }
}

export class ParserImplementation {
  constructor(lexer, input) {
    this.index = 0;
    this.input = input;
    this.tokens = lexer.lex(input);
  }

  get peek() {
    return (this.index < this.tokens.length) ? this.tokens[this.index] : EOF;
  }

  parseChain() {
    let isChain = false;
    let expressions = [];

    while (this.optional(';')) {
      isChain = true;
    }

    while (this.index < this.tokens.length) {
      if (this.peek.text === ')' || this.peek.text === '}' || this.peek.text === ']') {
        this.error(`Unconsumed token ${this.peek.text}`);
      }

      let expr = this.parseBindingBehavior();
      expressions.push(expr);

      while (this.optional(';')) {
        isChain = true;
      }

      if (isChain && (expr instanceof BindingBehavior || expr instanceof ValueConverter)) {
        this.error('Cannot have a binding behavior or value converter in a chain');
      }
    }

    return (expressions.length === 1) ? expressions[0] : new Chain(expressions);
  }

  parseBindingBehavior() {
    let result = this.parseValueConverter();

    while (this.optional('&')) {
      let name = this.peek.text;
      let args = [];

      this.advance();

      while (this.optional(':')) {
        args.push(this.parseExpression());
      }

      result = new BindingBehavior(result, name, args);
    }

    return result;
  }

  parseValueConverter() {
    let result = this.parseExpression();

    while (this.optional('|')) {
      let name = this.peek.text; // TODO(kasperl): Restrict to identifier?
      let args = [];

      this.advance();

      while (this.optional(':')) {
        // TODO(kasperl): Is this really supposed to be expressions?
        args.push(this.parseExpression());
      }

      result = new ValueConverter(result, name, args, [result].concat(args));
    }

    return result;
  }

  parseExpression() {
    let start = this.peek.index;
    let result = this.parseConditional();

    while (this.peek.text === '=') {
      if (!result.isAssignable) {
        let end = (this.index < this.tokens.length) ? this.peek.index : this.input.length;
        let expression = this.input.substring(start, end);

        this.error(`Expression ${expression} is not assignable`);
      }

      this.expect('=');
      result = new Assign(result, this.parseConditional());
    }

    return result;
  }

  parseConditional() {
    let start = this.peek.index;
    let result = this.parseLogicalOr();

    if (this.optional('?')) {
      let yes = this.parseExpression();

      if (!this.optional(':')) {
        let end = (this.index < this.tokens.length) ? this.peek.index : this.input.length;
        let expression = this.input.substring(start, end);

        this.error(`Conditional expression ${expression} requires all 3 expressions`);
      }

      let no = this.parseExpression();
      result = new Conditional(result, yes, no);
    }

    return result;
  }

  parseLogicalOr() {
    let result = this.parseLogicalAnd();

    while (this.optional('||')) {
      result = new Binary('||', result, this.parseLogicalAnd());
    }

    return result;
  }

  parseLogicalAnd() {
    let result = this.parseEquality();

    while (this.optional('&&')) {
      result = new Binary('&&', result, this.parseEquality());
    }

    return result;
  }

  parseEquality() {
    let result = this.parseRelational();

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
  }

  parseRelational() {
    let result = this.parseAdditive();

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
  }

  parseAdditive() {
    let result = this.parseMultiplicative();

    while (true) {
      if (this.optional('+')) {
        result = new Binary('+', result, this.parseMultiplicative());
      } else if (this.optional('-')) {
        result = new Binary('-', result, this.parseMultiplicative());
      } else {
        return result;
      }
    }
  }

  parseMultiplicative() {
    let result = this.parsePrefix();

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
  }

  parsePrefix() {
    if (this.optional('+')) {
      return this.parsePrefix(); // TODO(kasperl): This is different than the original parser.
    } else if (this.optional('-')) {
      return new Binary('-', new LiteralPrimitive(0), this.parsePrefix());
    } else if (this.optional('!')) {
      return new PrefixNot('!', this.parsePrefix());
    } else {
      return this.parseAccessOrCallMember();
    }
  }

  parseAccessOrCallMember() {
    let result = this.parsePrimary();

    while (true) {
      if (this.optional('.')) {
        let name = this.peek.text; // TODO(kasperl): Check that this is an identifier. Are keywords okay?

        this.advance();

        if (this.optional('(')) {
          let args = this.parseExpressionList(')');
          this.expect(')');
          if (result instanceof AccessThis) {
            result = new CallScope(name, args);
          } else {
            result = new CallMember(result, name, args);
          }
        } else {
          if (result instanceof AccessThis) {
            result = new AccessScope(name);
          } else {
            result = new AccessMember(result, name);
          }
        }
      } else if (this.optional('[')) {
        let key = this.parseExpression();
        this.expect(']');
        result = new AccessKeyed(result, key);
      } else if (this.optional('(')) {
        let args = this.parseExpressionList(')');
        this.expect(')');
        result = new CallFunction(result, args);
      } else {
        return result;
      }
    }
  }

  parsePrimary() {
    if (this.optional('(')) {
      let result = this.parseExpression();
      this.expect(')');
      return result;
    } else if (this.optional('null')) {
      return new LiteralPrimitive(null);
    } else if (this.optional('undefined')) {
      return new LiteralPrimitive(undefined);
    } else if (this.optional('true')) {
      return new LiteralPrimitive(true);
    } else if (this.optional('false')) {
      return new LiteralPrimitive(false);
    } else if (this.optional('[')) {
      let elements = this.parseExpressionList(']');
      this.expect(']');
      return new LiteralArray(elements);
    } else if (this.peek.text == '{') {
      return this.parseObject();
    } else if (this.peek.key != null) {
      return this.parseAccessOrCallScope();
    } else if (this.peek.value != null) {
      let value = this.peek.value;
      this.advance();
      return value instanceof String || typeof value === 'string' ? new LiteralString(value) : new LiteralPrimitive(value);
    } else if (this.index >= this.tokens.length) {
      throw new Error(`Unexpected end of expression: ${this.input}`);
    } else {
      this.error(`Unexpected token ${this.peek.text}`);
    }
  }

  parseAccessOrCallScope()  {
    let name = this.peek.key;

    this.advance();

    if (!this.optional('(')) {
      if (name === '$this') {
        return new AccessThis();
      } else {
        return new AccessScope(name);
      }
    }

    let args = this.parseExpressionList(')');
    this.expect(')');
    return new CallScope(name, args);
  }

  parseObject() {
    let keys = [];
    let values = [];

    this.expect('{');

    if (this.peek.text !== '}') {
      do {
        // TODO(kasperl): Stricter checking. Only allow identifiers
        // and strings as keys. Maybe also keywords?
        let value = this.peek.value;
        keys.push(typeof value === 'string' ? value : this.peek.text);

        this.advance();
        this.expect(':');

        values.push(this.parseExpression());
      } while (this.optional(','));
    }

    this.expect('}');

    return new LiteralObject(keys, values);
  }

  parseExpressionList(terminator) {
    let result = [];

    if (this.peek.text != terminator) {
      do {
        result.push(this.parseExpression());
       } while (this.optional(','));
    }

    return result;
  }

  optional(text) {
    if (this.peek.text === text) {
      this.advance();
      return true;
    }

    return false;
  }

  expect(text) {
    if (this.peek.text === text) {
      this.advance();
    } else {
      this.error(`Missing expected ${text}`);
    }
  }

  advance(){
    this.index++;
  }

  error(message) {
    let location = (this.index < this.tokens.length)
        ? `at column ${this.tokens[this.index].index + 1} in`
        : `at the end of the expression`;

    throw new Error(`Parser Error: ${message} ${location} [${this.input}]`);
  }
}
