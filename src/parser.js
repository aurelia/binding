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
  get currentChar() {
    return this.input.charCodeAt(this.index);
  }
  get hasNext() {
    return this.index < this.length;
  }
  get tokenRaw() {
    return this.input.slice(this.startIndex, this.index);
  }

  constructor(input) {
    this.index = 0;
    this.startIndex = 0;
    this.input = input;
    this.length = input.length;
    this.currentToken = T_EndOfSource;
    this.tokenValue = undefined;
  }

  parseChain() {
    this.nextToken();

    let isChain = false;
    let expressions = [];

    while (this.currentToken !== T_EndOfSource) {
      while (this.optional(T_Semicolon)) {
        isChain = true;
      }

      if ((this.currentToken & T_ClosingToken) === T_ClosingToken) {
        this.error(`Unconsumed token ${this.tokenRaw}`);
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

    while (this.currentToken === T_Assign) {
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

    if ((this.currentToken & T_BinaryOperator) !== T_BinaryOperator) {
      return left;
    }

    while ((this.currentToken & T_BinaryOperator) === T_BinaryOperator) {
      const opToken = this.currentToken;
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
    const opToken = this.currentToken;
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
    const token = this.currentToken;
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
          this.error(`Unexpected token ${this.tokenRaw}`);
        }
    }
  }

  parseAccessOrCallScope()  {
    let name = this.tokenValue;
    let token = this.currentToken;

    this.nextToken();

    let ancestor = 0;
    while (token === T_ParentScope) {
      ancestor++;
      if (this.optional(T_Period)) {
        name = this.tokenValue;
        token = this.currentToken;
        this.nextToken();
      } else if ((this.currentToken & T_AccessScopeTerminal) === T_AccessScopeTerminal) {
        return new AccessThis(ancestor);
      } else {
        this.error(`Unexpected token ${this.tokenRaw}`);
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

    if (this.currentToken !== T_RightBrace) {
      do {
        // todo(kasperl): Stricter checking. Only allow identifiers
        // and strings as keys. Maybe also keywords?
        const prevIndex = this.index;
        const prevToken = this.currentToken;
        keys.push(this.tokenValue);
        this.nextToken();
        if (prevToken === T_Identifier && (this.currentToken === T_Comma || this.currentToken === T_RightBrace)) {
          this.index = prevIndex;
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

    if (this.currentToken !== terminator) {
      do {
        result.push(this.parseExpression());
      } while (this.optional(T_Comma));
    }

    return result;
  }

  nextToken() {
    return this.currentToken = this.scanToken();
  }

  nextChar() {
    this.index++;
  }

  scanToken() {
    while (this.hasNext) {
      this.startIndex = this.index;
      const char = this.currentChar;
      // skip whitespace.
      if (char <= $SPACE) {
        this.nextChar();
        continue;
      }
  
      // handle identifiers and numbers.
      if (isIdentifierStart(char)) {
        return this.scanIdentifier();
      }
  
      if (isDigit(char)) {
        return this.scanNumber();
  
      }
      switch (char) {
        case $PERIOD:
        {
          const nextChar = this.input.charCodeAt(this.index + 1);
          if (isDigit(nextChar)) {
            return this.scanNumber();
          }
          this.nextChar();
          return T_Period;
        }
        case $LPAREN:
          this.nextChar();
          return T_LeftParen;
        case $RPAREN:
          this.nextChar();
          return T_RightParen;
        case $LBRACE:
          this.nextChar();
          return T_LeftBrace;
        case $RBRACE:
          this.nextChar();
          return T_RightBrace;
        case $LBRACKET:
          this.nextChar();
          return T_LeftBracket;
        case $RBRACKET:
          this.nextChar();
          return T_RightBracket;
        case $COMMA:
          this.nextChar();
          return T_Comma;
        case $COLON:
          this.nextChar();
          return T_Colon;
        case $SEMICOLON:
          this.nextChar();
          return T_Semicolon;
        case $SQ:
        case $DQ:
          return this.scanString();
        case $PLUS:
          this.nextChar();
          return T_Add;
        case $MINUS:
          this.nextChar();
          return T_Subtract;
        case $STAR:
          this.nextChar();
          return T_Multiply;
        case $SLASH:
          this.nextChar();
          return T_Divide;
        case $PERCENT:
          this.nextChar();
          return T_Modulo;
        case $CARET:
          this.nextChar();
          return T_BitwiseXor;
        case $QUESTION:
          this.nextChar();
          return T_QuestionMark;
        case $LT:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            return T_LessThanOrEqual;
          }
          return T_LessThan;
        }
        case $GT:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            return T_GreaterThanOrEqual;
          }
          return T_GreaterThan;
        }
        case $BANG:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            if (this.currentChar === $EQ) {
              this.nextChar();
              return T_StrictNotEqual;
            }
            return T_LooseNotEqual;
          }
          return T_LogicalNot;
        }
        case $EQ:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            if (this.currentChar === $EQ) {
              this.nextChar();
              return T_StrictEqual;
            }
            return T_LooseEqual;
          }
          return T_Assign;
        }
        case $AMPERSAND:
        {
          this.nextChar();
          if (this.currentChar === $AMPERSAND) {
            this.nextChar();
            return T_LogicalAnd;
          }
          return T_BindingBehavior;
        }
        case $BAR:
        {
          this.nextChar();
          if (this.currentChar === $BAR) {
            this.nextChar();
            return T_LogicalOr;
          }
          return T_ValueConverter;
        }
        case $NBSP:
          this.nextChar();
          continue;
        // no default
      }
  
      this.error(`Unexpected character [${String.fromCharCode(this.currentChar)}]`);
      return null;
    }

    return T_EndOfSource;
  }

  scanIdentifier() {
    this.nextChar();

    while (isIdentifierPart(this.currentChar)) {
      this.nextChar();
    }

    this.tokenValue = this.tokenRaw;

    // true/null have length 4, undefined has length 9
    if (4 <= this.tokenValue.length && this.tokenValue.length <= 9) {
      const token = KeywordLookup[this.tokenValue];
      if (token !== undefined) {
        return token;
      }
    }

    return T_Identifier;
  }

  scanNumber() {
    let isFloat = false;
    let value = 0;
    let char = this.currentChar;
    
    while (isDigit(this.currentChar)) {
      value = value * 10 + (this.currentChar - $0);
      this.nextChar();
    }

    const nonDigitStart = this.index;
    if (this.currentChar === $PERIOD) {
      isFloat = true;
      this.nextChar();

      while (isDigit(this.currentChar)) {
        this.nextChar();
      }
    }

    if (this.currentChar === $e || this.currentChar === $E) {
      isFloat = true;
      const exponentStart = this.index; // for error reporting in case the exponent is invalid
      this.nextChar();

      if (this.currentChar === $PLUS || this.currentChar === $MINUS) {
        this.nextChar();
      }

      if (!isDigit(this.currentChar)) {
        this.index = exponentStart;
        this.error('Invalid exponent');
      }

      while (isDigit(this.currentChar)) {
        this.nextChar();
      }
    }

    if (!isFloat) {
      this.tokenValue = value;
      return T_NumericLiteral;
    }

    const text = value + this.input.slice(nonDigitStart, this.index);
    this.tokenValue = parseFloat(text);
    return T_NumericLiteral;
  }

  scanString() {
    let quote = this.currentChar;
    this.nextChar(); // Skip initial quote.

    let buffer;
    let marker = this.index;

    while (this.currentChar !== quote) {
      if (this.currentChar === $BACKSLASH) {
        if (!buffer) {
          buffer = [];
        }

        buffer.push(this.input.slice(marker, this.index));

        this.nextChar();

        let unescaped;

        if (this.currentChar === $u) {
          this.nextChar();

          if (this.index + 4 < this.length) {
            let hex = this.input.slice(this.index, this.index + 4);
  
            if (!/[A-Z0-9]{4}/i.test(hex)) {
              this.error(`Invalid unicode escape [\\u${hex}]`);
            }
  
            unescaped = parseInt(hex, 16);
            this.index += 4;
          } else {
            this.error(`Unexpected token ${this.tokenRaw}`);
          }
        } else {
          unescaped = unescape(this.currentChar);
          this.nextChar();
        }

        buffer.push(String.fromCharCode(unescaped));
        marker = this.index;
      } else if (this.currentChar === $EOF) {
        this.error('Unterminated quote');
      } else {
        this.nextChar();
      }
    }

    let last = this.input.slice(marker, this.index);
    this.nextChar(); // Skip terminating quote.

    // Compute the unescaped string value.
    let unescaped = last;

    if (buffer !== null && buffer !== undefined) {
      buffer.push(last);
      unescaped = buffer.join('');
    }

    this.tokenValue = unescaped;
    return T_StringLiteral;
  }

  error(message) {
    throw new Error(`Lexer Error: ${message} at column ${this.index} in expression [${this.input}]`);
  }

  optional(type) {
    if (this.currentToken === type) {
      this.nextToken();
      return true;
    }

    return false;
  }

  expect(type) {
    if (this.currentToken === type) {
      this.nextToken();
    } else {
      // todo(fkleuver): translate to string value for readable error messages
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

// Operator precedence: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table

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
