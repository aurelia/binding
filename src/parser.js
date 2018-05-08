import {
  Chain, ValueConverter, Assign, Conditional,
  AccessThis, AccessScope, AccessMember, AccessKeyed,
  CallScope, CallFunction, CallMember,
  PrefixNot, BindingBehavior, Binary,
  LiteralPrimitive, LiteralArray, LiteralObject, LiteralString
} from './ast';

export class Parser {
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
    this.currentToken = T$EOF;
    this.tokenValue = undefined;
    this.currentChar = input.charCodeAt(0);
  }

  parseChain() {
    this.nextToken();

    let expressions = [];

    while (this.currentToken !== T$EOF) {
      if (this.optional(T$Semicolon)) {
        this.error('Multiple expressions are not allowed.');
      }

      if ((this.currentToken & T$ClosingToken) === T$ClosingToken) {
        this.error(`Unconsumed token ${this.tokenRaw}`);
      }

      const expr = this.parseBindingBehavior();
      expressions.push(expr);

      if (this.optional(T$Semicolon)) {
        this.error('Multiple expressions are not allowed.');
      }
    }

    return (expressions.length === 1) ? expressions[0] : new Chain(expressions);
  }

  parseBindingBehavior() {
    let result = this.parseValueConverter();

    while (this.optional(T$Ampersand)) {
      let name = this.tokenValue;
      let args = [];

      this.nextToken();

      while (this.optional(T$Colon)) {
        args.push(this.parseExpression());
      }

      result = new BindingBehavior(result, name, args);
    }

    return result;
  }

  parseValueConverter() {
    let result = this.parseExpression();

    while (this.optional(T$Bar)) {
      let name = this.tokenValue;
      let args = [];

      this.nextToken();

      while (this.optional(T$Colon)) {
        args.push(this.parseExpression());
      }

      result = new ValueConverter(result, name, args);
    }

    return result;
  }

  parseExpression() {
    let result = this.parseConditional();

    while (this.currentToken === T$Eq) {
      if (!result.isAssignable) {
        let expression = this.input.slice(this.lastIndex, this.startIndex);

        this.error(`Expression ${expression} is not assignable`);
      }

      this.expect(T$Eq);
      result = new Assign(result, this.parseConditional());
    }

    return result;
  }

  parseConditional() {
    let start = this.index;
    let result = this.parseBinary(0);

    if (this.optional(T$Question)) {
      let yes = this.parseExpression();

      if (!this.optional(T$Colon)) {
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

    if ((this.currentToken & T$BinaryOperator) !== T$BinaryOperator) {
      return left;
    }

    while ((this.currentToken & T$BinaryOperator) === T$BinaryOperator) {
      const opToken = this.currentToken;
      const precedence = opToken & T$Precedence;
      if (precedence < minPrecedence) {
        break;
      }
      this.nextToken();
      left = new Binary(TokenValues[opToken & T$TokenMask], left, this.parseBinary(precedence));
    }
    return left;
  }

  parseUnary() {
    const opToken = this.currentToken;
    if ((opToken & T$UnaryOperator) === T$UnaryOperator) {
      this.nextToken();
      switch (opToken) {
      case T$Plus:
        return this.parseUnary();
      case T$Minus:
        return new Binary('-', new LiteralPrimitive(0), this.parseUnary());
      case T$Bang:
        return new PrefixNot('!', this.parseUnary());
      default:
      // ignored
      }
    }
    return this.parseAccessOrCallMember();
  }

  parseAccessOrCallMember() {
    let result = this.parsePrimary();

    while (true) { // eslint-disable-line no-constant-condition
      if (this.optional(T$Period)) {
        if ((this.currentToken ^ T$IdentifierOrKeyword) === T$IdentifierOrKeyword) {
          this.error(`Unexpected token ${this.tokenRaw}`);
        }
        let name = this.tokenValue;

        this.nextToken();

        if (this.optional(T$LParen)) {
          let args = this.parseExpressionList(T$RParen);
          this.expect(T$RParen);
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
      } else if (this.optional(T$LBracket)) {
        let key = this.parseExpression();
        this.expect(T$RBracket);
        result = new AccessKeyed(result, key);
      } else if (this.optional(T$LParen)) {
        let args = this.parseExpressionList(T$RParen);
        this.expect(T$RParen);
        result = new CallFunction(result, args);
      } else {
        return result;
      }
    }
  }

  parsePrimary() {
    const token = this.currentToken;
    switch (token) {
    case T$Identifier:
    case T$ParentScope:
      return this.parseAccessOrCallScope();
    case T$ThisScope:
      this.nextToken();
      return new AccessThis(0);
    case T$LParen:
      this.nextToken();
      const result = this.parseExpression();
      this.expect(T$RParen);
      return result;
    case T$LBracket:
      this.nextToken();
      const elements = this.parseExpressionList(T$RBracket);
      this.expect(T$RBracket);
      return new LiteralArray(elements);
    case T$LBrace :
      return this.parseObject();
    case T$StringLiteral:
      {
        const value = this.tokenValue;
        this.nextToken();
        return new LiteralString(value);
      }
    case T$NumericLiteral:
      {
        const value = this.tokenValue;
        this.nextToken();
        return new LiteralPrimitive(value);
      }
    case T$NullKeyword:
    case T$UndefinedKeyword:
    case T$TrueKeyword:
    case T$FalseKeyword:
      this.nextToken();
      return new LiteralPrimitive(TokenValues[token & T$TokenMask]);
    default:
      if (this.index >= this.length) {
        throw new Error(`Unexpected end of expression at column ${this.index} of ${this.input}`);
      } else {
        this.error(`Unexpected token ${this.tokenRaw}`);
      }
    }
  }

  parseAccessOrCallScope(name, token)  {
    if (!(name && token)) {
      name = this.tokenValue;
      token = this.currentToken;
      this.nextToken();
    }

    let ancestor = 0;
    while (token === T$ParentScope) {
      ancestor++;
      if (this.optional(T$Period)) {
        name = this.tokenValue;
        token = this.currentToken;
        this.nextToken();
      } else if ((this.currentToken & T$AccessScopeTerminal) === T$AccessScopeTerminal) {
        return new AccessThis(ancestor);
      } else {
        this.error(`Unexpected token ${this.tokenRaw}`);
      }
    }

    if (this.optional(T$LParen)) {
      let args = this.parseExpressionList(T$RParen);
      this.expect(T$RParen);
      return new CallScope(name, args, ancestor);
    }

    return new AccessScope(name, ancestor);
  }

  parseObject() {
    let keys = [];
    let values = [];

    this.expect(T$LBrace);

    while (this.currentToken !== T$RBrace) {
      const token = this.currentToken;
      const name = this.tokenValue;

      switch (token) {
      case T$Identifier:
      // Treat keywords and predefined strings like identifiers
      case T$FalseKeyword: // eslint-disable-line no-fallthrough
      case T$TrueKeyword:
      case T$NullKeyword:
      case T$UndefinedKeyword:
      case T$ThisScope:
      case T$ParentScope:
        keys.push(name);
        this.nextToken();
        if (this.optional(T$Colon)) {
          values.push(this.parseExpression());
        } else {
          values.push(this.parseAccessOrCallScope(name, token));
        }
        break;
      case T$StringLiteral:
      case T$NumericLiteral:
        keys.push(name);
        this.nextToken();
        this.expect(T$Colon);
        values.push(this.parseExpression());
        break;
      default:
        this.error(`Unexpected token ${this.tokenRaw}`);
      }
      if (this.currentToken !== T$RBrace) {
        this.expect(T$Comma);
      }
    }

    this.expect(T$RBrace);

    return new LiteralObject(keys, values);
  }

  parseExpressionList(terminator) {
    let result = [];

    if (this.currentToken !== terminator) {
      do {
        result.push(this.parseExpression());
      } while (this.optional(T$Comma));
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
          return T$Period;
        }
      case $LPAREN:
        this.nextChar();
        return T$LParen;
      case $RPAREN:
        this.nextChar();
        return T$RParen;
      case $LBRACE:
        this.nextChar();
        return T$LBrace;
      case $RBRACE:
        this.nextChar();
        return T$RBrace;
      case $LBRACKET:
        this.nextChar();
        return T$LBracket;
      case $RBRACKET:
        this.nextChar();
        return T$RBracket;
      case $COMMA:
        this.nextChar();
        return T$Comma;
      case $COLON:
        this.nextChar();
        return T$Colon;
      case $SEMICOLON:
        this.nextChar();
        return T$Semicolon;
      case $SQ:
      case $DQ:
        return this.scanString();
      case $PLUS:
        this.nextChar();
        return T$Plus;
      case $MINUS:
        this.nextChar();
        return T$Minus;
      case $STAR:
        this.nextChar();
        return T$Star;
      case $SLASH:
        this.nextChar();
        return T$Slash;
      case $PERCENT:
        this.nextChar();
        return T$Percent;
      case $CARET:
        this.nextChar();
        return T$Caret;
      case $QUESTION:
        this.nextChar();
        return T$Question;
      case $LT:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            return T$LtEq;
          }
          return T$Lt;
        }
      case $GT:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            return T$GtEq;
          }
          return T$Gt;
        }
      case $BANG:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            if (this.currentChar === $EQ) {
              this.nextChar();
              return T$BangEqEq;
            }
            return T$BangEq;
          }
          return T$Bang;
        }
      case $EQ:
        {
          this.nextChar();
          if (this.currentChar === $EQ) {
            this.nextChar();
            if (this.currentChar === $EQ) {
              this.nextChar();
              return T$EqEqEq;
            }
            return T$EqEq;
          }
          return T$Eq;
        }
      case $AMPERSAND:
        {
          this.nextChar();
          if (this.currentChar === $AMPERSAND) {
            this.nextChar();
            return T$AmpersandAmpersand;
          }
          return T$Ampersand;
        }
      case $BAR:
        {
          this.nextChar();
          if (this.currentChar === $BAR) {
            this.nextChar();
            return T$BarBar;
          }
          return T$Bar;
        }
      case $NBSP:
        this.nextChar();
        continue;
      // no default
      }

      this.error(`Unexpected character [${String.fromCharCode(this.currentChar)}]`);
      return null;
    }

    return T$EOF;
  }

  scanIdentifier() {
    this.nextChar();

    while (isIdentifierPart(this.currentChar)) {
      this.nextChar();
    }

    this.tokenValue = this.tokenRaw;

    // true/null have length 4, undefined has length 9
    if (this.tokenValue.length >= 4 && this.tokenValue.length <= 9) {
      const token = KeywordLookup[this.tokenValue];
      if (token !== undefined) {
        return token;
      }
    }

    return T$Identifier;
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
      return T$NumericLiteral;
    }

    const text = value + this.input.slice(nonDigitStart, this.index);
    this.tokenValue = parseFloat(text);
    return T$NumericLiteral;
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
    return T$StringLiteral;
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
      this.error(`Missing expected token ${TokenValues[token & T$TokenMask]}`);
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
const T$TokenMask = (1 << 6) - 1;

/* Shifting 6 bits to the left gives us a step size of 64 in a range of
 * 64 (1 << 6) to 448 (7 << 6) for our precedence bit
 * This is the lowest value which does not overlap with the token bits 0-38. */
const T$PrecedenceShift = 6;

/* Performing a bitwise and (&) with this value will return only the
 * precedence bit, which is used to determine the parsing order of binary
 * expressions */
const T$Precedence = 7 << T$PrecedenceShift;

/** ')' | '}' | ']' */
const T$ClosingToken        = 1 << 9;
/** EndOfSource | '(' | '}' | ')' | ',' | '[' | '&' | '|' */
const T$AccessScopeTerminal = 1 << 10;
const T$EOF                 = 1 << 11 | T$AccessScopeTerminal;
const T$Identifier          = 1 << 12 | T$IdentifierOrKeyword;
const T$NumericLiteral      = 1 << 13;
const T$StringLiteral       = 1 << 14;
const T$BinaryOperator      = 1 << 15;
const T$UnaryOperator       = 1 << 16;
const T$IdentifierOrKeyword = 1 << 17;

/** false */      const T$FalseKeyword     = 0 | T$IdentifierOrKeyword;
/** true */       const T$TrueKeyword      = 1 | T$IdentifierOrKeyword;
/** null */       const T$NullKeyword      = 2 | T$IdentifierOrKeyword;
/** undefined */  const T$UndefinedKeyword = 3 | T$IdentifierOrKeyword;
/** '$this' */    const T$ThisScope        = 4 | T$IdentifierOrKeyword;
/** '$parent' */  const T$ParentScope      = 5 | T$IdentifierOrKeyword;

/** '(' */const T$LParen    =  6 | T$AccessScopeTerminal;
/** '{' */const T$LBrace    =  7;
/** '.' */const T$Period    =  8;
/** '}' */const T$RBrace    =  9 | T$AccessScopeTerminal | T$ClosingToken;
/** ')' */const T$RParen    = 10 | T$AccessScopeTerminal | T$ClosingToken;
/** ';' */const T$Semicolon = 11;
/** ',' */const T$Comma     = 12 | T$AccessScopeTerminal;
/** '[' */const T$LBracket  = 13 | T$AccessScopeTerminal;
/** ']' */const T$RBracket  = 14 | T$ClosingToken;
/** ':' */const T$Colon     = 15;
/** '?' */const T$Question  = 16;

// Operator precedence: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table

/** '&' */  const T$Ampersand          = 19 | T$AccessScopeTerminal;
/** '|' */  const T$Bar                = 20 | T$AccessScopeTerminal;
/** '||' */ const T$BarBar             = 21 | 1 << T$PrecedenceShift | T$BinaryOperator;
/** '&&' */ const T$AmpersandAmpersand = 22 | 2 << T$PrecedenceShift | T$BinaryOperator;
/** '^' */  const T$Caret              = 23 | 3 << T$PrecedenceShift | T$BinaryOperator;
/** '==' */ const T$EqEq               = 24 | 4 << T$PrecedenceShift | T$BinaryOperator;
/** '!=' */ const T$BangEq             = 25 | 4 << T$PrecedenceShift | T$BinaryOperator;
/** '===' */const T$EqEqEq             = 26 | 4 << T$PrecedenceShift | T$BinaryOperator;
/** '!== '*/const T$BangEqEq           = 27 | 4 << T$PrecedenceShift | T$BinaryOperator;
/** '<' */  const T$Lt                 = 28 | 5 << T$PrecedenceShift | T$BinaryOperator;
/** '>' */  const T$Gt                 = 29 | 5 << T$PrecedenceShift | T$BinaryOperator;
/** '<=' */ const T$LtEq               = 30 | 5 << T$PrecedenceShift | T$BinaryOperator;
/** '>=' */ const T$GtEq               = 31 | 5 << T$PrecedenceShift | T$BinaryOperator;
/** '+' */  const T$Plus               = 32 | 6 << T$PrecedenceShift | T$BinaryOperator | T$UnaryOperator;
/** '-' */  const T$Minus              = 33 | 6 << T$PrecedenceShift | T$BinaryOperator | T$UnaryOperator;
/** '*' */  const T$Star               = 34 | 7 << T$PrecedenceShift | T$BinaryOperator;
/** '%' */  const T$Percent            = 35 | 7 << T$PrecedenceShift | T$BinaryOperator;
/** '/' */  const T$Slash              = 36 | 7 << T$PrecedenceShift | T$BinaryOperator;
/** '=' */  const T$Eq                 = 37;
/** '!' */  const T$Bang               = 38 | T$UnaryOperator;

const KeywordLookup = Object.create(null, {
  true: {value: T$TrueKeyword},
  null: {value: T$NullKeyword},
  false: {value: T$FalseKeyword},
  undefined: {value: T$UndefinedKeyword},
  $this: {value: T$ThisScope},
  $parent: {value: T$ParentScope}
});

/**
 * Array for mapping tokens to token values. The indices of the values
 * correspond to the token bits 0-38.
 * For this to work properly, the values in the array must be kept in
 * the same order as the token bits.
 * Usage: TokenValues[token & T$TokenMask]
 */
const TokenValues = [
  false, true, null, undefined, '$this', '$parent',

  '(', '{', '.', '}', ')', ';', ',', '[', ']', ':', '?', '\'', '"',

  '&', '|', '||', '&&', '^', '==', '!=', '===', '!==', '<', '>',
  '<=', '>=', '+', '-', '*', '%', '/', '=', '!'
];
