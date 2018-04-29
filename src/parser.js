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
  get hasNext() {
    return this.index < this.length;
  }
  get tokenRaw() {
    return this.input.slice(this.startIndex, this.index);
  }

  constructor(input) {
    this.index = 0;
    this.startIndex = 0;
    this.lastIndex = 0;
    this.input = input;
    this.length = input.length;
    this.currentToken = T_EOF;
    this.tokenValue = undefined;
    this.currentChar = input.charCodeAt(0);
  }

  parseChain() {
    this.nextToken();

    let expressions = [];

    while (this.currentToken !== T_EOF) {
      if (this.optional(T_Semicolon)) {
        this.error('Multiple expressions are not allowed.');
      }

      if ((this.currentToken & T_ClosingToken) === T_ClosingToken) {
        this.error(`Unconsumed token ${this.tokenRaw}`);
      }

      const expr = this.parseBindingBehavior();
      expressions.push(expr);

      if (this.optional(T_Semicolon)) {
        this.error('Multiple expressions are not allowed.');
      }
    }

    return (expressions.length === 1) ? expressions[0] : new Chain(expressions);
  }

  parseBindingBehavior() {
    let result = this.parseValueConverter();

    while (this.optional(T_Ampersand)) {
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

    while (this.optional(T_Bar)) {
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
    let result = this.parseConditional();

    while (this.currentToken === T_Eq) {
      if (!result.isAssignable) {
        let expression = this.input.slice(this.lastIndex, this.startIndex);

        this.error(`Expression ${expression} is not assignable`);
      }

      this.expect(T_Eq);
      result = new Assign(result, this.parseConditional());
    }

    return result;
  }

  parseConditional() {
    let start = this.index;
    let result = this.parseBinary(0);

    if (this.optional(T_Question)) {
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
        case T_Plus:
          return this.parseUnary();
        case T_Minus:
          return new Binary('-', new LiteralPrimitive(0), this.parseUnary());
        case T_Bang:
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

        if (this.optional(T_LParen)) {
          let args = this.parseExpressionList(T_RParen);
          this.expect(T_RParen);
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
      } else if (this.optional(T_LBracket)) {
        let key = this.parseExpression();
        this.expect(T_RBracket);
        result = new AccessKeyed(result, key);
      } else if (this.optional(T_LParen)) {
        let args = this.parseExpressionList(T_RParen);
        this.expect(T_RParen);
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
      case T_LParen:
        this.nextToken();
        const result = this.parseExpression();
        this.expect(T_RParen);
        return result;
      case T_LBracket:
        this.nextToken();
        const elements = this.parseExpressionList(T_RBracket);
        this.expect(T_RBracket);
        return new LiteralArray(elements);
      case T_LBrace :
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

    if (this.optional(T_LParen)) {
      let args = this.parseExpressionList(T_RParen);
      this.expect(T_RParen);
      return new CallScope(name, args, ancestor);
    }

    return new AccessScope(name, ancestor);
  }

  parseObject() {
    let keys = [];
    let values = [];

    this.expect(T_LBrace);

    if (this.currentToken !== T_RBrace) {
      do {
        // todo(kasperl): Stricter checking. Only allow identifiers
        // and strings as keys. Maybe also keywords?
        const prevIndex = this.index;
        const prevToken = this.currentToken;
        keys.push(this.tokenValue);
        this.nextToken();
        if (prevToken === T_Identifier && (this.currentToken === T_Comma || this.currentToken === T_RBrace)) {
          this.index = prevIndex;
          this.currentChar = this.input.charCodeAt(this.index);
          values.push(this.parseAccessOrCallScope());
        } else {
          this.expect(T_Colon);
          values.push(this.parseExpression());
        }
      } while (this.optional(T_Comma));
    }

    this.expect(T_RBrace);

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
    return this.currentChar = this.input.charCodeAt(++this.index);
  }

  scanToken() {
    while (this.hasNext) {
      // skip whitespace.
      if (this.currentChar <= $SPACE) {
        this.nextChar();
        continue;
      }

      this.lastIndex = this.startIndex;
      this.startIndex = this.index;
  
      // handle identifiers and numbers.
      if (isIdentifierStart(this.currentChar)) {
        return this.scanIdentifier();
      }
  
      if (isDigit(this.currentChar)) {
        return this.scanNumber();
  
      }
      switch (this.currentChar) {
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
          return T_LParen;
        case $RPAREN:
          this.nextChar();
          return T_RParen;
        case $LBRACE:
          this.nextChar();
          return T_LBrace;
        case $RBRACE:
          this.nextChar();
          return T_RBrace;
        case $LBRACKET:
          this.nextChar();
          return T_LBracket;
        case $RBRACKET:
          this.nextChar();
          return T_RBracket;
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
          return T_Plus;
        case $MINUS:
          this.nextChar();
          return T_Minus;
        case $STAR:
          this.nextChar();
          return T_Star;
        case $SLASH:
          this.nextChar();
          return T_Slash;
        case $PERCENT:
          this.nextChar();
          return T_Percent;
        case $CARET:
          this.nextChar();
          return T_Caret;
        case $QUESTION:
          this.nextChar();
          return T_Question;
        case $LT:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            return T_LtEq;
          }
          return T_Lt;
        }
        case $GT:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            return T_GtEq;
          }
          return T_Gt;
        }
        case $BANG:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            if (this.currentChar === $EQ) {
              this.nextChar();
              return T_BangEqEq;
            }
            return T_BangEq;
          }
          return T_Bang;
        }
        case $EQ:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            if (this.currentChar === $EQ) {
              this.nextChar();
              return T_EqEqEq;
            }
            return T_EqEq;
          }
          return T_Eq;
        }
        case $AMPERSAND:
        {
          this.nextChar();
          if (this.currentChar === $AMPERSAND) {
            this.nextChar();
            return T_AmpersandAmpersand;
          }
          return T_Ampersand;
        }
        case $BAR:
        {
          this.nextChar();
          if (this.currentChar === $BAR) {
            this.nextChar();
            return T_BarBar;
          }
          return T_Bar;
        }
        case $NBSP:
          this.nextChar();
          continue;
        // no default
      }
  
      this.error(`Unexpected character [${String.fromCharCode(this.currentChar)}]`);
      return null;
    }

    return T_EOF;
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
    
    while (isDigit(this.currentChar)) {
      value = value * 10 + (this.currentChar - $0);
      this.nextChar();
    }

    if (this.currentChar === $PERIOD) {
      this.nextChar();

      let decimalValue = 0;
      let decimalPlaces = 0;

      while (isDigit(this.currentChar)) {
        decimalValue = decimalValue * 10 + (this.currentChar - $0);
        decimalPlaces++;
        this.nextChar();
      }

      value += (decimalValue / Math.pow(10, decimalPlaces));
    }

    const nonDigitStart = this.index;
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
            this.currentChar = this.input.charCodeAt(this.index);
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
    throw new Error(`Parser Error: ${message} at column ${this.startIndex} in expression [${this.input}]`);
  }

  optional(type) {
    if (this.currentToken === type) {
      this.nextToken();
      return true;
    }

    return false;
  }

  expect(token) {
    if (this.currentToken === token) {
      this.nextToken();
    } else {
      this.error(`Missing expected token ${TokenValues[token & T_TokenMask]}`);
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
 * precedence bit, which is used to determine the parsing order of binary
 * expressions */
const T_Precedence = 7 << T_PrecedenceShift;

/** ')' | '}' | ']' */
const T_ClosingToken        = 1 << 9;
/** EndOfSource | '(' | '}' | ')' | ',' | '[' | '&' | '|' */
const T_AccessScopeTerminal = 1 << 10;
const T_EOF                 = 1 << 11 | T_AccessScopeTerminal;
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

/** '(' */const T_LParen    =  6 | T_AccessScopeTerminal;
/** '{' */const T_LBrace    =  7;
/** '.' */const T_Period    =  8;
/** '}' */const T_RBrace    =  9 | T_AccessScopeTerminal | T_ClosingToken;
/** ')' */const T_RParen    = 10 | T_AccessScopeTerminal | T_ClosingToken;
/** ';' */const T_Semicolon = 11;
/** ',' */const T_Comma     = 12 | T_AccessScopeTerminal;
/** '[' */const T_LBracket  = 13 | T_AccessScopeTerminal;
/** ']' */const T_RBracket  = 14 | T_ClosingToken;
/** ':' */const T_Colon     = 15;
/** '?' */const T_Question  = 16;
/** ''' */const T_SQ        = 17;
/** '"' */const T_DQ        = 18;

// Operator precedence: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table

/** '&' */  const T_Ampersand          = 19 | T_AccessScopeTerminal;
/** '|' */  const T_Bar                = 20 | T_AccessScopeTerminal;
/** '||' */ const T_BarBar             = 21 | 1 << T_PrecedenceShift | T_BinaryOperator;
/** '&&' */ const T_AmpersandAmpersand = 22 | 2 << T_PrecedenceShift | T_BinaryOperator;
/** '^' */  const T_Caret              = 23 | 3 << T_PrecedenceShift | T_BinaryOperator;
/** '==' */ const T_EqEq               = 24 | 4 << T_PrecedenceShift | T_BinaryOperator;
/** '!=' */ const T_BangEq             = 25 | 4 << T_PrecedenceShift | T_BinaryOperator;
/** '===' */const T_EqEqEq             = 26 | 4 << T_PrecedenceShift | T_BinaryOperator;
/** '!== '*/const T_BangEqEq           = 27 | 4 << T_PrecedenceShift | T_BinaryOperator;
/** '<' */  const T_Lt                 = 28 | 5 << T_PrecedenceShift | T_BinaryOperator;
/** '>' */  const T_Gt                 = 29 | 5 << T_PrecedenceShift | T_BinaryOperator;
/** '<=' */ const T_LtEq               = 30 | 5 << T_PrecedenceShift | T_BinaryOperator;
/** '>=' */ const T_GtEq               = 31 | 5 << T_PrecedenceShift | T_BinaryOperator;
/** '+' */  const T_Plus               = 32 | 6 << T_PrecedenceShift | T_BinaryOperator | T_UnaryOperator;
/** '-' */  const T_Minus              = 33 | 6 << T_PrecedenceShift | T_BinaryOperator | T_UnaryOperator;
/** '*' */  const T_Star               = 34 | 7 << T_PrecedenceShift | T_BinaryOperator;
/** '%' */  const T_Percent            = 35 | 7 << T_PrecedenceShift | T_BinaryOperator;
/** '/' */  const T_Slash              = 36 | 7 << T_PrecedenceShift | T_BinaryOperator;
/** '=' */  const T_Eq                 = 37;
/** '!' */  const T_Bang               = 38 | T_UnaryOperator;

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
