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
    const expressions = [];

    while ((this.currentToken & T$ExpressionTerminal) !== T$ExpressionTerminal) {
      expressions.push(this.parseBindingBehavior());
    }
    if (this.currentToken !== T$EOF) {
      if (this.optional(T$Semicolon)) {
        this.error('Multiple expressions are not allowed.');
      }
      if ((this.currentToken & T$ClosingToken) === T$ClosingToken) {
        this.error(`Unconsumed token ${this.tokenRaw}`);
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
    const start = this.index;
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
        const name = this.tokenValue;

        this.nextToken();

        if (this.optional(T$LParen)) {
          const args = this.parseExpressionList(T$RParen);
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
        const key = this.parseExpression();
        this.expect(T$RBracket);
        result = new AccessKeyed(result, key);
      } else if (this.optional(T$LParen)) {
        const args = this.parseExpressionList(T$RParen);
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
    // https://en.wikibooks.org/wiki/Unicode/Character_reference/0000-0FFF
    while (this.hasNext) {
      const char = this.currentChar;

      // get rid of non-ASCII characters first to speed up subsequent scanning
      if (char > /*ASCII*/0x7F) {
        let mask = CharLookup[char];
        // skip whitespace and controls
        if (mask & C$Skip) {
          this.nextChar();
          continue;
        }

        this.lastIndex = this.startIndex;
        this.startIndex = this.index;

        // handle identifiers
        if (mask & C$IdStart) {
          return this.scanIdentifier();
        }
      } else {
        // skip whitespace
        if (char <= /*[SPACE]*/0x20) {
          this.nextChar();
          continue;
        }

        this.lastIndex = this.startIndex;
        this.startIndex = this.index;

        // we're splitting up the checks roughly in such a way that the minimum amount of evaluations
        // need to take place, and the most common ones come first

        // handle a to z and { to }
        if (char >= /*a*/0x61) {
          if (char <= /*z*/0x7A) {
            return this.scanIdentifier();
          }
          switch (char) {
          case /*{*/0x7B: this.nextChar();
            return T$LBrace;
          case /*|*/0x7C:
            if (this.nextChar() !== /*|*/0x7C) return T$Bar;
            this.nextChar(); return T$BarBar;
          case /*}*/0x7D:
            this.nextChar(); return T$RBrace;
          // no default
          }
          // handle A to Z and [ to _
        } else if (char >= /*A*/0x41) {
          if (char <= /*Z*/0x5A) {
            return this.scanIdentifier();
          }
          switch (char) {
          case /*[*/0x5B:
            this.nextChar(); return T$LBracket;
          case /*]*/0x5D:
            this.nextChar(); return T$RBracket;
          case /*^*/0x5E:
            this.nextChar(); return T$Caret;
          case /*_*/0x5F:
            this.nextChar(); return this.scanIdentifier();
          // no default
          }
          // handle 0 to 9 and : to ?
        } else if (char >= /*0*/0x30) {
          if (char <= /*9*/0x39) {
            return this.scanNumber(false);
          }
          switch (char) {
          case /*:*/0x3A:
            this.nextChar(); return T$Colon;
          case /*;*/0x3B:
            this.nextChar(); return T$Semicolon;
          case /*<*/0x3C:
            if (this.nextChar() !== /*=*/0x3D) return T$Lt;
            this.nextChar(); return T$LtEq;
          case /*=*/0x3D:
            if (this.nextChar() !== /*=*/0x3D) return T$Eq;
            if (this.nextChar() !== /*=*/0x3D) return T$EqEq;
            this.nextChar(); return T$EqEqEq;
          case /*>*/0x3E:
            if (this.nextChar() !== /*=*/0x3D) return T$Gt;
            this.nextChar(); return T$GtEq;
          case /*?*/0x3F:
            this.nextChar(); return T$Question;
          // no default
          }
        }

        // handle the remaining symbols
        switch (char) {
        case /*!*/0x21:
          if (this.nextChar() !== /*=*/0x3D) return T$Bang;
          if (this.nextChar() !== /*=*/0x3D) return T$BangEq;
          this.nextChar(); return T$BangEqEq;
        case /*"*/0x22:
          return this.scanString();
        case /*$*/0x24:
          return this.scanIdentifier();
        case /*%*/0x25:
          this.nextChar(); return T$Percent;
        case /*&*/0x26:
          if (this.nextChar() !== /*&*/0x26) return T$Ampersand;
          this.nextChar(); return T$AmpersandAmpersand;
        case /*'*/0x27:
          return this.scanString();
        case /*(*/0x28:
          this.nextChar(); return T$LParen;
        case /*)*/0x29:
          this.nextChar(); return T$RParen;
        case /***/0x2A:
          this.nextChar(); return T$Star;
        case /*+*/0x2B:
          this.nextChar(); return T$Plus;
        case /*,*/0x2C:
          this.nextChar(); return T$Comma;
        case /*-*/0x2D:
          this.nextChar(); return T$Minus;
        case /*.*/0x2E:
          if (this.input.charCodeAt(this.index + 1) <= /*9*/ 0x39
            && this.input.charCodeAt(this.index + 1) >= /*0*/ 0x30) return this.scanNumber(true);
          this.nextChar(); return T$Period;
        case /*/*/0x2F:
          this.nextChar(); return T$Slash;
        // no default
        }
      }

      this.error(`Unexpected character [${String.fromCharCode(this.currentChar)}]`);
      return null;
    }
    return T$EOF;
  }

  scanIdentifier() {
    // run to the next non-idPart
    let char = this.nextChar();
    while ((char >= /*a*/0x61 && char <= /*z*/0x7A)
      || (char >= /*A*/0x41 && char <= /*Z*/0x5A)
      || (char >= /*0*/0x30 && char <= /*9*/0x39)
      || char === /*$*/0x24
      || char === /*_*/0x5F
      || (char > /*ASCII*/0x7F && CharLookup[char] & C$IdPart)) {
      char = this.nextChar();
    }

    this.tokenValue = this.tokenRaw;
    const len = this.tokenValue.length;
    if (len < 4 || len > 9) {
      return T$Identifier;
    }
    return KeywordLookup[this.tokenValue] || T$Identifier;
  }

  scanNumber(isFloat) {
    if (isFloat) {
      this.tokenValue = 0;
    } else {
      this.tokenValue = this.currentChar - /*0*/0x30;
      while (this.nextChar() <= /*9*/0x39 && this.currentChar >= /*0*/0x30) {
        this.tokenValue = this.tokenValue * 10 + this.currentChar  - /*0*/0x30;
      }
    }

    if (this.currentChar === /*.*/0x2E) {
      this.nextChar();
      const start = this.index;
      let value = this.currentChar - /*0*/0x30;
      while (this.nextChar() <= /*9*/0x39 && this.currentChar >= /*0*/0x30) {
        value = value * 10 + this.currentChar  - /*0*/0x30;
      }
      this.tokenValue = this.tokenValue + value / 10 ** (this.index - start);
    }

    if (this.currentChar === /*e*/0x65 || this.currentChar === /*E*/0x45) {
      const start = this.index;

      this.nextChar();
      if (this.currentChar === /*-*/0x2D || this.currentChar === /*+*/0x2B) {
        this.nextChar();
      }

      if (!(this.currentChar >= /*0*/0x30 && this.currentChar <= /*9*/0x39)) {
        this.index = start;
        this.error('Invalid exponent');
      }
      while (this.nextChar() <= /*9*/0x39 && this.currentChar >= /*0*/0x30) { } // eslint-disable-line no-empty
      this.tokenValue = parseFloat(this.input.slice(this.startIndex, this.index));
    }

    return T$NumericLiteral;
  }

  scanString() {
    let quote = this.currentChar;
    this.nextChar(); // Skip initial quote.

    let buffer;
    let marker = this.index;

    while (this.currentChar !== quote) {
      if (this.currentChar === /*\*/0x5C) {
        if (!buffer) {
          buffer = [];
        }

        buffer.push(this.input.slice(marker, this.index));

        this.nextChar();

        let unescaped;

        if (this.currentChar === 0x75) {
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
      } else if (this.currentChar === /*EOF*/0) {
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

function unescape(code) {
  switch (code) {
  case /*f*/0x66: return /*[FF]*/0xC;
  case /*n*/0x6E: return /*[LF]*/0xA;
  case /*r*/0x72: return /*[CR]*/0xD;
  case /*t*/0x74: return /*[TAB]*/0x9;
  case /*v*/0x76: return /*[VTAB]*/0xB;
  default: return code;
  }
}

// Tokens

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

const T$ExpressionTerminal  = 1 << 9;
/** ')' | '}' | ']' */
const T$ClosingToken        = 1 << 10;
/** EndOfSource | '(' | '}' | ')' | ',' | '[' | '&' | '|' */
const T$AccessScopeTerminal = 1 << 11;
const T$EOF                 = 1 << 12 | T$AccessScopeTerminal | T$ExpressionTerminal;
const T$Identifier          = 1 << 13 | T$IdentifierOrKeyword;
const T$NumericLiteral      = 1 << 14;
const T$StringLiteral       = 1 << 15;
const T$BinaryOperator      = 1 << 16;
const T$UnaryOperator       = 1 << 17;
const T$IdentifierOrKeyword = 1 << 18;

/** false */      const T$FalseKeyword     = 0 | T$IdentifierOrKeyword;
/** true */       const T$TrueKeyword      = 1 | T$IdentifierOrKeyword;
/** null */       const T$NullKeyword      = 2 | T$IdentifierOrKeyword;
/** undefined */  const T$UndefinedKeyword = 3 | T$IdentifierOrKeyword;
/** '$this' */    const T$ThisScope        = 4 | T$IdentifierOrKeyword;
/** '$parent' */  const T$ParentScope      = 5 | T$IdentifierOrKeyword;

/** '(' */const T$LParen    =  6 | T$AccessScopeTerminal;
/** '{' */const T$LBrace    =  7;
/** '.' */const T$Period    =  8;
/** '}' */const T$RBrace    =  9 | T$AccessScopeTerminal | T$ClosingToken | T$ExpressionTerminal;
/** ')' */const T$RParen    = 10 | T$AccessScopeTerminal | T$ClosingToken | T$ExpressionTerminal;
/** ';' */const T$Semicolon = 11 | T$ExpressionTerminal;
/** ',' */const T$Comma     = 12 | T$AccessScopeTerminal;
/** '[' */const T$LBracket  = 13 | T$AccessScopeTerminal;
/** ']' */const T$RBracket  = 14 | T$ClosingToken | T$ExpressionTerminal;
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

/**
 * Ranges of code points in pairs of 2 (eg 0x41-0x5B, 0x61-0x7B, ...) where the second value is not inclusive (5-7 means 5 and 6)
 * Single values are denoted by the second value being a 0
 *
 * Copied from output generated with "node build/generate-unicode.js"
 */
const codes = {
  IdStart: /*IdentifierStart*/[0xAA, 0, 0xBA, 0, 0xC0, 0xD7, 0xD8, 0xF7, 0xF8, 0x2B9, 0x2E0, 0x2E5, 0x1D00, 0x1D26, 0x1D2C, 0x1D5D, 0x1D62, 0x1D66, 0x1D6B, 0x1D78, 0x1D79, 0x1DBF, 0x1E00, 0x1F00, 0x2071, 0, 0x207F, 0, 0x2090, 0x209D, 0x212A, 0x212C, 0x2132, 0, 0x214E, 0, 0x2160, 0x2189, 0x2C60, 0x2C80, 0xA722, 0xA788, 0xA78B, 0xA7AF, 0xA7B0, 0xA7B8, 0xA7F7, 0xA800, 0xAB30, 0xAB5B, 0xAB5C, 0xAB65, 0xFB00, 0xFB07, 0xFF21, 0xFF3B, 0xFF41, 0xFF5B],
  Skip: /*Skippable*/[0x80, 0xA1]
};

// We can go up to 255 ((1 << 8) - 1) for Uint8Array
const C$Skip    = 1 << 0;
const C$IdStart = 1 << 1;
const C$IdPart  = 1 << 2;

const CharLookup = new Uint8Array(0xFFFF);
CharLookup.fill(0, 0, 0xFFFF);
/**
 * Decompress the ranges into an array of numbers so that the char code
 * can be used as an index to the lookup
 */
function fillCharLookup(codeRanges, mask) {
  let rangeCount = codeRanges.length;
  for (let i = 0; i < rangeCount; i += 2) {
    const start = codeRanges[i];
    const end = codeRanges[i + 1];
    CharLookup.fill(mask, start, end > 0 ? end : start + 1);
  }
}
fillCharLookup(codes.Skip, C$Skip);
fillCharLookup(codes.IdStart, C$IdStart | C$IdPart);
