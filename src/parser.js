import {
  Chain, ValueConverter, Assign, Conditional,
  AccessThis, AccessScope, AccessMember, AccessKeyed,
  CallScope, CallFunction, CallMember,
  PrefixNot, BindingBehavior, Binary,
  LiteralPrimitive, LiteralArray, LiteralObject, LiteralString
} from './ast';

export class Parser {
  cache;
  constructor() {
    this.cache = Object.create(null);
  }

  parse(input) {
    input = input || '';

    return this.cache[input]
      || (this.cache[input] = new ParserImplementation(input).parseChain());
  }
}

export class ParserImplementation {
  constructor(input) {
    this.index = 0;
    this.startIndex = 0;
    this.lastIndex = 0;
    this.input = input;
    this.length = input.length;
    this.token = T_EndOfSource;
    this.tokenValue = undefined;
    this.tokenRaw = '';
    this.lastValue = 0;
  }

  parseChain() {
    this.nextToken();

    let isChain = false;
    let expressions = [];

    while (this.token !== T_EndOfSource) {
      while (this.optional(T_Semicolon)) {
        isChain = true;
      }

      if ((this.token & T_ClosingToken) === T_ClosingToken) {
        this.error(`Unconsumed token ${String.fromCharCode(this.tokenValue)}`);
      }

      const expr = this.parseBindingBehavior();
      expressions.push(expr);

      while (this.optional(T_Semicolon)) {
        isChain = true;
      }

      if (isChain) {
        this.error('Multiple expressions are not allowed.');
      }
    }

    return (expressions.length === 1) ? expressions[0] : new Chain(expressions);
  }

  parseBindingBehavior() {
    let result = this.parseValueConverter();

    while (this.optional(T_BindingBehavior)) {
      let name = this.tokenValue;
      let args = [];

      this.nextToken();

      while (this.optional(T_Colon)) {
        args.push(this.parseExpression());
      }

      result = new BindingBehavior(result, name, args);
    }

    return result;
  }

  parseValueConverter() {
    let result = this.parseExpression();

    while (this.optional(T_ValueConverter)) {
      let name = this.tokenValue;
      let args = [];

      this.nextToken();

      while (this.optional(T_Colon)) {
        // todo(kasperl): Is this really supposed to be expressions?
        args.push(this.parseExpression());
      }

      result = new ValueConverter(result, name, args);
    }

    return result;
  }

  parseExpression() {
    let start = this.index;
    let result = this.parseConditional();

    while (this.token === T_Assign) {
      if (!result.isAssignable) {
        let end = (this.index < this.length) ? this.index : this.length;
        let expression = this.input.slice(start, end);

        this.error(`Expression ${expression} is not assignable`);
      }

      this.expect(T_Assign);
      result = new Assign(result, this.parseConditional());
    }

    return result;
  }

  parseConditional() {
    let start = this.index;
    let result = this.parseBinary(0);

    if (this.optional(T_QuestionMark)) {
      let yes = this.parseExpression();

      if (!this.optional(T_Colon)) {
        let end = (this.index < this.length) ? this.index : this.length;
        let expression = this.input.slice(start, end);

        this.error(`Conditional expression ${expression} requires all 3 expressions`);
      }

      let no = this.parseExpression();
      result = new Conditional(result, yes, no);
    }

    return result;
  }

  parseBinary(minPrecedence) {
    let left = this.parseUnary();

    if ((this.token & T_BinaryOperator) !== T_BinaryOperator) {
      return left;
    }

    while ((this.token & T_BinaryOperator) === T_BinaryOperator) {
      const opToken = this.token;
      const precedence = opToken & T_Precedence;
      if (precedence < minPrecedence) {
        break;
      }
      this.nextToken();
      left = new Binary(TokenValues[opToken & T_TokenMask], left, this.parseBinary(precedence));
    }
    return left;
  }

  parseUnary() {
    const opToken = this.token;
    if ((opToken & T_UnaryOperator) === T_UnaryOperator) {
      this.nextToken();
      switch(opToken) {
        case T_Add:
          return this.parseUnary();
        case T_Subtract:
          return new Binary('-', new LiteralPrimitive(0), this.parseUnary());
        case T_LogicalNot:
          return new PrefixNot('!', this.parseUnary());
      }
    }
    return this.parseAccessOrCallMember();
  }

  parseAccessOrCallMember() {
    let result = this.parsePrimary();

    while (true) { // eslint-disable-line no-constant-condition
      if (this.optional(T_Period)) {
        let name = this.tokenValue; // todo(kasperl): Check that this is an identifier. Are keywords okay?

        this.nextToken();

        if (this.optional(T_LeftParen)) {
          let args = this.parseExpressionList(T_RightParen);
          this.expect(T_RightParen);
          if (result instanceof AccessThis) {
            result = new CallScope(name, args, result.ancestor);
          } else {
            result = new CallMember(result, name, args);
          }
        } else {
          if (result instanceof AccessThis) {
            result = new AccessScope(name, result.ancestor);
          } else {
            result = new AccessMember(result, name);
          }
        }
      } else if (this.optional(T_LeftBracket)) {
        let key = this.parseExpression();
        this.expect(T_RightBracket);
        result = new AccessKeyed(result, key);
      } else if (this.optional(T_LeftParen)) {
        let args = this.parseExpressionList(T_RightParen);
        this.expect(T_RightParen);
        result = new CallFunction(result, args);
      } else {
        return result;
      }
    }
  }

  parsePrimary() {
    const token = this.token;
    switch (token) {
      case T_Identifier:
      case T_ParentScope:
        return this.parseAccessOrCallScope();
      case T_ThisScope:
        this.nextToken();
        return new AccessThis(0);
      case T_LeftParen:
        this.nextToken();
        const result = this.parseExpression();
        this.expect(T_RightParen);
        return result;
      case T_LeftBracket:
        this.nextToken();
        const elements = this.parseExpressionList(T_RightBracket);
        this.expect(T_RightBracket);
        return new LiteralArray(elements);
      case T_LeftBrace:
        return this.parseObject();
      case T_StringLiteral:
      {
        const value = this.tokenValue;
        this.nextToken();
        return new LiteralString(value);
      }
      case T_NumericLiteral:
      {
        const value = this.tokenValue;
        this.nextToken();
        return new LiteralPrimitive(value);
      }
      case T_NullKeyword:
      case T_UndefinedKeyword:
      case T_TrueKeyword:
      case T_FalseKeyword:
        this.nextToken();
        return new LiteralPrimitive(TokenValues[token & T_TokenMask]);
      default:
        if (this.index >= this.length) {
          throw new Error(`Unexpected end of expression at column ${this.index} of ${this.input}`);
        } else {
          const expression = this.input.slice(this.lastIndex, this.index);
          this.error(`Unexpected token ${expression}`);
        }
    }
  }

  parseAccessOrCallScope()  {
    let name = this.tokenValue;
    let token = this.token;

    this.nextToken();

    let ancestor = 0;
    while (token === T_ParentScope) {
      ancestor++;
      if (this.optional(T_Period)) {
        name = this.tokenValue;
        token = this.token;
        this.nextToken();
      } else if ((this.token & T_AccessScopeTerminal) === T_AccessScopeTerminal) {
        return new AccessThis(ancestor);
      } else {
        const expression = this.input.slice(this.lastIndex, this.index);
        this.error(`Unexpected token ${expression}`);
      }
    }

    if (this.optional(T_LeftParen)) {
      let args = this.parseExpressionList(T_RightParen);
      this.expect(T_RightParen);
      return new CallScope(name, args, ancestor);
    }

    return new AccessScope(name, ancestor);
  }

  parseObject() {
    let keys = [];
    let values = [];

    this.expect(T_LeftBrace);

    if (this.token ^ T_RightBrace) {
      do {
        // todo(kasperl): Stricter checking. Only allow identifiers
        // and strings as keys. Maybe also keywords?

        let token = this.token;
        keys.push(this.tokenValue);

        this.nextToken();
        if (token === T_Identifier && (this.token === T_Comma || this.token === T_RightBrace)) {
          --this.index;
          values.push(this.parseAccessOrCallScope());
        } else {
          this.expect(T_Colon);
          values.push(this.parseExpression());
        }
      } while (this.optional(T_Comma));
    }

    this.expect(T_RightBrace);

    return new LiteralObject(keys, values);
  }

  parseExpressionList(terminator) {
    let result = [];

    if (this.token ^ terminator) {
      do {
        result.push(this.parseExpression());
      } while (this.optional(T_Comma));
    }

    return result;
  }

  nextToken() {
    this.lastIndex = this.index;

    return this.token = this.scanToken();
  }

  scanToken() {
    while (this.index < this.length) {
      this.startIndex = this.index;
      let current = this.input.charCodeAt(this.index);
      // skip whitespace.
      if (current <= $SPACE) {
        this.index++;
        continue;
      }
  
      // handle identifiers and numbers.
      if (isIdentifierStart(current)) {
        return this.scanIdentifier();
      }
  
      if (isDigit(current)) {
        return this.scanNumber(false);
      }
  
      let start = this.index;
  
      switch (current) {
        case $PERIOD:
        {
          if (this.index < this.length) {
            const next = this.input.charCodeAt(this.index + 1);
            if (next >= $0 && next <= $9) {
              return this.scanNumber(true);
            }
            this.index++;
          }
          return T_Period;
        }
        case $LPAREN:
          this.index++;
          return T_LeftParen;
        case $RPAREN:
          this.index++;
          return T_RightParen;
        case $LBRACE:
          this.index++;
          return T_LeftBrace;
        case $RBRACE:
          this.index++;
          return T_RightBrace;
        case $LBRACKET:
          this.index++;
          return T_LeftBracket;
        case $RBRACKET:
          this.index++;
          return T_RightBracket;
        case $COMMA:
          this.index++;
          return T_Comma;
        case $COLON:
          this.index++;
          return T_Colon;
        case $SEMICOLON:
          this.index++;
          return T_Semicolon;
        case $SQ:
        case $DQ:
          return this.scanString();
        case $PLUS:
          this.index++;
          return T_Add;
        case $MINUS:
          this.index++;
          return T_Subtract;
        case $STAR:
          this.index++;
          return T_Multiply;
        case $SLASH:
          this.index++;
          return T_Divide;
        case $PERCENT:
          this.index++;
          return T_Modulo;
        case $CARET:
          this.index++;
          return T_BitwiseXor;
        case $QUESTION:
          this.index++;
          return T_QuestionMark;
        case $LT:
        {
          let next = this.input.charCodeAt(++this.index);
          if (next === $EQ) {
            this.index++;
            return T_LessThanOrEqual;
          }
          return T_LessThan;
        }
        case $GT:
        {
          let next = this.input.charCodeAt(++this.index);
          if (next === $EQ) {
            this.index++;
            return T_GreaterThanOrEqual;
          }
          return T_GreaterThan;
        }
        case $BANG:
        {
          let next = this.input.charCodeAt(++this.index);
          if (next === $EQ) {
            let next = this.input.charCodeAt(++this.index);
            if (next === $EQ) {
              this.index++;
              return T_StrictNotEqual;
            }
            return T_LooseNotEqual;
          }
          return T_LogicalNot;
        }
        case $EQ:
        {
          let next = this.input.charCodeAt(++this.index);
          if (next === $EQ) {
            let next = this.input.charCodeAt(++this.index);
            if (next === $EQ) {
              this.index++;
              return T_StrictEqual;
            }
            return T_LooseEqual;
          }
          return T_Assign;
        }
        case $AMPERSAND:
        {
          let next = this.input.charCodeAt(++this.index);
          if (next === $AMPERSAND) {
            this.index++;
            return T_LogicalAnd;
          }
          return T_BindingBehavior;
        }
        case $BAR:
        {
          let next = this.input.charCodeAt(++this.index);
          if (next === $BAR) {
            this.index++;
            return T_LogicalOr;
          }
          return T_ValueConverter;
        }
        case $NBSP:
          this.index++;
          continue;
        // no default
      }
  
      let character = String.fromCharCode(this.input.charCodeAt(this.index));
      this.error(`Unexpected character [${character}]`);
      return null;
    }

    return T_EndOfSource;
  }

  scanIdentifier() {
    const start = this.index;
    let char = this.input.charCodeAt(++this.index);

    while (isIdentifierPart(char)) {
      char = this.input.charCodeAt(++this.index);
    }

    let text = this.input.slice(start, this.index);
    this.tokenValue = text;

    let len = text.length;
    if (len >= 4 && len <= 9) {
      const token = KeywordLookup[text];
      if (token !== undefined) {
        return token;
      }
    }

    return T_Identifier;
  }

  scanNumber(isFloat) {
    let start = this.index;
    this.index++;
    let char = this.input.charCodeAt(this.index);
    loop: while (true) {
      switch(char) {
        case $PERIOD:
          // todo(fkleuver): Should deal with spread operator elsewhere,
          // and throw here when seeing more than one period
          isFloat = true;
          break;
        case $e:
        case $E:
          char = this.input.charCodeAt(++this.index);
          if (char === $PLUS || char === $MINUS) {
            char = this.input.charCodeAt(++this.index);
          }
          if (char < $0 || char > $9) {
            this.error('Invalid exponent', -1);
          }
          isFloat = true;
          break;
        default:
          if (char < $0 || char > $9 || this.index === this.length) {
            break loop;
          }
      }
      char = this.input.charCodeAt(++this.index);
    }

    const text = this.input.slice(start, this.index);
    this.tokenValue = isFloat ? parseFloat(text) : parseInt(text, 10);
    return T_NumericLiteral;
  }

  scanString() {
    let start = this.index;
    let quote = this.input.charCodeAt(this.index++); // Skip initial quote.

    let buffer;
    let marker = this.index;
    let char = this.input.charCodeAt(this.index);

    while (char !== quote) {
      if (char === $BACKSLASH) {
        if (!buffer) {
          buffer = [];
        }

        buffer.push(this.input.slice(marker, this.index));
        char = this.input.charCodeAt(++this.index)

        let unescaped;

        if (char === $u) {
          // todo(kasperl): Check bounds? Make sure we have test
          // coverage for this.
          let hex = this.input.slice(this.index + 1, this.index + 5);

          if (!/[A-Z0-9]{4}/.test(hex)) {
            this.error(`Invalid unicode escape [\\u${hex}]`);
          }

          unescaped = parseInt(hex, 16);
          this.index += 5;
        } else {
          unescaped = unescape(this.input.charCodeAt(this.index));
          this.index++;
        }

        buffer.push(String.fromCharCode(unescaped));
        marker = this.index;
      } else if (char === $EOF) {
        this.error('Unterminated quote');
      } else {
        this.index++;
      }

      char = this.input.charCodeAt(this.index)
    }

    let last = this.input.slice(marker, this.index);
    this.index++; // Skip terminating quote.
    let text = this.input.slice(start, this.index);

    // Compute the unescaped string value.
    let unescaped = last;

    if (buffer !== null && buffer !== undefined) {
      buffer.push(last);
      unescaped = buffer.join('');
    }

    this.tokenValue = unescaped;
    this.tokenRaw = text;
    return T_StringLiteral;
  }

  error(message, offset = 0) {
    // todo(kasperl): Try to get rid of the offset. It is only used to match
    // the error expectations in the lexer tests for numbers with exponents.
    let position = this.index + offset;
    throw new Error(`Lexer Error: ${message} at column ${position} in expression [${this.input}]`);
  }

  optional(type) {
    if (this.token === type) {
      this.nextToken();
      return true;
    }

    return false;
  }

  expect(type) {
    if (this.token === type) {
      this.nextToken();
    } else {
      this.error(`Missing expected token type ${type}`);
    }
  }
}

const $EOF = 0;
const $TAB = 9;
const $LF = 10;
const $VTAB = 11;
const $FF = 12;
const $CR = 13;
const $SPACE = 32;
const $BANG = 33;
const $DQ = 34;
const $$ = 36;
const $PERCENT = 37;
const $AMPERSAND = 38;
const $SQ = 39;
const $LPAREN = 40;
const $RPAREN = 41;
const $STAR = 42;
const $PLUS = 43;
const $COMMA = 44;
const $MINUS = 45;
const $PERIOD = 46;
const $SLASH = 47;
const $COLON = 58;
const $SEMICOLON = 59;
const $LT = 60;
const $EQ = 61;
const $GT = 62;
const $QUESTION = 63;

const $0 = 48;
const $9 = 57;

const $A = 65;
const $E = 69;
const $Z = 90;

const $LBRACKET = 91;
const $BACKSLASH = 92;
const $RBRACKET = 93;
const $CARET = 94;
const $_ = 95;

const $a = 97;
const $e = 101;
const $f = 102;
const $n = 110;
const $r = 114;
const $t = 116;
const $u = 117;
const $v = 118;
const $z = 122;

const $LBRACE = 123;
const $BAR = 124;
const $RBRACE = 125;
const $NBSP = 160;

function isIdentifierStart(code) {
  return ($a <= code && code <= $z)
      || ($A <= code && code <= $Z)
      || (code === $_)
      || (code === $$);
}

function isIdentifierPart(code) {
  return ($a <= code && code <= $z)
      || ($A <= code && code <= $Z)
      || ($0 <= code && code <= $9)
      || (code === $_)
      || (code === $$);
}

function isDigit(code) {
  return ($0 <= code && code <= $9);
}

function unescape(code) {
  switch (code) {
  case $n: return $LF;
  case $f: return $FF;
  case $r: return $CR;
  case $t: return $TAB;
  case $v: return $VTAB;
  default: return code;
  }
}

/* Performing a bitwise and (&) with this value (63) will return only the
 * token bit, which corresponds to the index of the token's value in the
 * TokenValues array */
const T_TokenMask = (1 << 6) - 1;

/* Shifting 6 bits to the left gives us a step size of 64 in a range of 
 * 64 (1 << 6) to 448 (7 << 6) for our precedence bit
 * This is the lowest value which does not overlap with the token bits 0-38. */
const T_PrecedenceShift = 6; 

/* Performing a bitwise and (&) with this value will return only the
 * precedence bit, which is used to determine the parsing order of bitwise
 * expressions */
const T_Precedence = 7 << T_PrecedenceShift;

/** ')' | '}' | ']' */
const T_ClosingToken        = 1 << 9;
/** EndOfSource | '(' | '}' | ')' | ',' | '[' | '&' | '|' */
const T_AccessScopeTerminal = 1 << 10;
const T_EndOfSource         = 1 << 11 | T_AccessScopeTerminal;
const T_Identifier          = 1 << 12;
const T_NumericLiteral      = 1 << 13;
const T_StringLiteral       = 1 << 14;
const T_BinaryOperator      = 1 << 15;
const T_UnaryOperator       = 1 << 16;

/** false */      const T_FalseKeyword     = 0;
/** true */       const T_TrueKeyword      = 1;
/** null */       const T_NullKeyword      = 2;
/** undefined */  const T_UndefinedKeyword = 3;
/** '$this' */    const T_ThisScope        = 4;
/** '$parent' */  const T_ParentScope      = 5;

/** '(' */const T_LeftParen    =  6 | T_AccessScopeTerminal;
/** '{' */const T_LeftBrace    =  7;
/** '.' */const T_Period       =  8;
/** '}' */const T_RightBrace   =  9 | T_ClosingToken | T_AccessScopeTerminal;
/** ')' */const T_RightParen   = 10 | T_ClosingToken | T_AccessScopeTerminal;
/** ';' */const T_Semicolon    = 11;
/** ',' */const T_Comma        = 12 | T_AccessScopeTerminal;
/** '[' */const T_LeftBracket  = 13 | T_AccessScopeTerminal;
/** ']' */const T_RightBracket = 14 | T_ClosingToken;
/** ':' */const T_Colon        = 15;
/** '?' */const T_QuestionMark = 16;
/** ''' */const T_SingleQuote  = 17;
/** '"' */const T_DoubleQuote  = 18;

/** '&' */  const T_BindingBehavior    = 19 | T_AccessScopeTerminal;
/** '|' */  const T_ValueConverter     = 20 | T_AccessScopeTerminal;
/** '||' */ const T_LogicalOr          = 21 | T_BinaryOperator  |  1 << T_PrecedenceShift;
/** '&&' */ const T_LogicalAnd         = 22 | T_BinaryOperator  |  2 << T_PrecedenceShift;
/** '^' */  const T_BitwiseXor         = 23 | T_BinaryOperator  |  3 << T_PrecedenceShift;
/** '==' */ const T_LooseEqual         = 24 | T_BinaryOperator  |  4 << T_PrecedenceShift;
/** '!=' */ const T_LooseNotEqual      = 25 | T_BinaryOperator  |  4 << T_PrecedenceShift;
/** '===' */const T_StrictEqual        = 26 | T_BinaryOperator  |  4 << T_PrecedenceShift;
/** '!== '*/const T_StrictNotEqual     = 27 | T_BinaryOperator  |  4 << T_PrecedenceShift;
/** '<' */  const T_LessThan           = 28 | T_BinaryOperator  |  5 << T_PrecedenceShift;
/** '>' */  const T_GreaterThan        = 29 | T_BinaryOperator  |  5 << T_PrecedenceShift;
/** '<=' */ const T_LessThanOrEqual    = 30 | T_BinaryOperator  |  5 << T_PrecedenceShift;
/** '>=' */ const T_GreaterThanOrEqual = 31 | T_BinaryOperator  |  5 << T_PrecedenceShift;
/** '+' */  const T_Add                = 32 | T_UnaryOperator   | T_BinaryOperator | 6 << T_PrecedenceShift;
/** '-' */  const T_Subtract           = 33 | T_UnaryOperator   | T_BinaryOperator | 6 << T_PrecedenceShift;
/** '*' */  const T_Multiply           = 34 | T_BinaryOperator  | 7 << T_PrecedenceShift;
/** '%' */  const T_Modulo             = 35 | T_BinaryOperator  | 7 << T_PrecedenceShift;
/** '/' */  const T_Divide             = 36 | T_BinaryOperator  | 7 << T_PrecedenceShift;
/** '=' */  const T_Assign             = 37;
/** '!' */  const T_LogicalNot         = 38 | T_UnaryOperator;

const KeywordLookup = Object.create(null, {
  true: {value: T_TrueKeyword},
  null: {value: T_NullKeyword},
  false: {value: T_FalseKeyword},
  undefined: {value: T_UndefinedKeyword},
  $this: {value: T_ThisScope},
  $parent: {value: T_ParentScope}
});

/**
 * Array for mapping tokens to token values. The indices of the values
 * correspond to the token bits 0-38.
 * For this to work properly, the values in the array must be kept in
 * the same order as the token bits.
 * Usage: TokenValues[token & T_TokenMask]
 */
const TokenValues = [
  false, true, null, undefined, '$this', '$parent',

  '(', '{', '.', '}', ')', ';', ',', '[', ']', ':', '?', '\'', '"',

  '&', '|', '||', '&&', '^', '==', '!=', '===', '!==', '<', '>',
  '<=', '>=', '+', '-', '*', '%', '/', '=', '!'
];
