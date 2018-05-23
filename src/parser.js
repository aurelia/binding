import {
  Chain, ValueConverter, Assign, Conditional,
  AccessThis, AccessScope, AccessMember, AccessKeyed,
  CallScope, CallFunction, CallMember,
  PrefixNot, BindingBehavior, Binary,
  LiteralPrimitive, LiteralArray, LiteralObject, LiteralString, LiteralTemplate, PrefixUnary
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

    while (!(this.currentToken & T$ExpressionTerminal)) {
      expressions.push(this.parseBindingBehavior());
    }
    if (this.currentToken !== T$EOF) {
      if (this.optional(T$Semicolon)) {
        this.error('Multiple expressions are not allowed.');
      }
      if (this.currentToken & T$ClosingToken) {
        this.error(`Unconsumed token ${this.tokenRaw}`);
      }
    }
    return (expressions.length === 1) ? expressions[0] : new Chain(expressions);
  }

  parseBindingBehavior() {
    let result = this.parseValueConverter();
    while (this.optional(T$Ampersand)) {
      result = new BindingBehavior(result, this.tokenValue, this.parseVariadicArguments());
    }
    return result;
  }

  parseValueConverter() {
    let result = this.parseExpression();
    while (this.optional(T$Bar)) {
      result = new ValueConverter(result, this.tokenValue, this.parseVariadicArguments());
    }
    return result;
  }

  parseVariadicArguments() {
    this.nextToken();
    const result = [];
    while (this.optional(T$Colon)) {
      result.push(this.parseExpression());
    }
    return result;
  }

  parseExpression() {
    let exprStart = this.index;
    let result = this.parseConditional();

    while (this.currentToken === T$Eq) {
      if (!result.isAssignable) {
        this.error(`Expression ${this.input.slice(exprStart, this.startIndex)} is not assignable`);
      }
      this.nextToken();
      exprStart = this.index;
      result = new Assign(result, this.parseConditional());
    }
    return result;
  }

  parseConditional() {
    let result = this.parseBinary(0);

    if (this.optional(T$Question)) {
      let yes = this.parseExpression();
      this.expect(T$Colon);
      result = new Conditional(result, yes, this.parseExpression());
    }
    return result;
  }

  parseBinary(minPrecedence) {
    let left = this.parseLeftHandSideExpression(0);

    while (this.currentToken & T$BinaryOp) {
      const opToken = this.currentToken;
      if ((opToken & T$Precedence) < minPrecedence) {
        break;
      }
      this.nextToken();
      left = new Binary(TokenValues[opToken & T$TokenMask], left, this.parseBinary(opToken & T$Precedence));
    }
    return left;
  }

  parseLeftHandSideExpression(context) {
    let result;

    // Unary + Primary expression
    primary: switch (this.currentToken) {
    case T$Plus:
      this.nextToken();
      return this.parseLeftHandSideExpression(0);
    case T$Minus:
      this.nextToken();
      return new Binary('-', new LiteralPrimitive(0), this.parseLeftHandSideExpression(0));
    case T$Bang:
      this.nextToken();
      return new PrefixNot('!', this.parseLeftHandSideExpression(0));
    case T$TypeofKeyword:
    case T$VoidKeyword:
      const op = TokenValues[this.currentToken & T$TokenMask];
      this.nextToken();
      return new PrefixUnary(op, this.parseLeftHandSideExpression(0));
    case T$ParentScope: // $parent
      {
        do {
          this.nextToken();
          context++; // ancestor
          if (this.optional(T$Period)) {
            if (this.currentToken === T$Period) {
              this.error();
            }
            continue;
          } else if (this.currentToken & T$AccessScopeTerminal) {
            result = new AccessThis(context & C$Ancestor);
            // Keep the ShorthandProp flag, clear all the others, and set context to This
            context = (context & C$ShorthandProp) | C$This;
            break primary;
          } else {
            this.error();
          }
        } while (this.currentToken === T$ParentScope);
      }
    // falls through
    case T$Identifier: // identifier
      {
        result = new AccessScope(this.tokenValue, context & C$Ancestor);
        this.nextToken();
        context = (context & C$ShorthandProp) | C$Scope;
        break;
      }
    case T$ThisScope: // $this
      this.nextToken();
      result = new AccessThis(0);
      context = (context & C$ShorthandProp) | C$This;
      break;
    case T$LParen: // parenthesized expression
      this.nextToken();
      result = this.parseExpression();
      this.expect(T$RParen);
      break;
    case T$LBracket: // literal array
      {
        this.nextToken();
        const elements = [];
        if (this.currentToken !== T$RBracket) {
          do {
            elements.push(this.parseExpression());
          } while (this.optional(T$Comma));
        }
        this.expect(T$RBracket);
        result = new LiteralArray(elements);
        break;
      }
    case T$LBrace: // object
      {
        const keys = [];
        const values = [];
        this.nextToken();
        while (this.currentToken !== T$RBrace) {
          if (this.currentToken & T$IdentifierOrKeyword) {
            const { currentChar, currentToken, index } = this;
            keys.push(this.tokenValue);
            this.nextToken();
            if (this.optional(T$Colon)) {
              values.push(this.parseExpression());
            } else {
              this.currentChar = currentChar;
              this.currentToken = currentToken;
              this.index = index;
              values.push(this.parseLeftHandSideExpression(C$ShorthandProp));
            }
          } else if (this.currentToken & T$Literal) {
            keys.push(this.tokenValue);
            this.nextToken();
            this.expect(T$Colon);
            values.push(this.parseExpression());
          } else {
            this.error();
          }
          if (this.currentToken !== T$RBrace) {
            this.expect(T$Comma);
          }
        }
        this.expect(T$RBrace);
        result = new LiteralObject(keys, values);
        break;
      }
    case T$StringLiteral:
      result = new LiteralString(this.tokenValue);
      this.nextToken();
      break;
    case T$TemplateTail:
      result = new LiteralTemplate([this.tokenValue]);
      this.nextToken();
      break;
    case T$TemplateContinuation:
      result = this.parseTemplate(0);
      break;
    case T$NumericLiteral:
      {
        result = new LiteralPrimitive(this.tokenValue);
        this.nextToken();
        break;
      }
    case T$NullKeyword:
    case T$UndefinedKeyword:
    case T$TrueKeyword:
    case T$FalseKeyword:
      result = new LiteralPrimitive(TokenValues[this.currentToken & T$TokenMask]);
      this.nextToken();
      break;
    default:
      if (this.index >= this.length) {
        this.error('Unexpected end of expression');
      } else {
        this.error();
      }
    }

    // bail out here if it's an ES6 object shorthand property (and let the caller throw on periods etc)
    if (context & C$ShorthandProp) {
      return result;
    }

    let name = this.tokenValue;
    while (this.currentToken & T$MemberOrCallExpression) {
      switch (this.currentToken) {
      case T$Period:
        this.nextToken();
        if (!(this.currentToken & T$IdentifierOrKeyword)) {
          this.error();
        }
        name = this.tokenValue;
        this.nextToken();
        // Change $This to $Scope, change $Scope to $Member, keep $Member as-is, change $Keyed to $Member, disregard other flags
        context = ((context & (C$This | C$Scope)) << 1) | (context & C$Member) | ((context & C$Keyed) >> 1);
        if (this.currentToken === T$LParen) {
          continue;
        }
        if (context & C$Scope) {
          result = new AccessScope(name, result.ancestor);
        } else { // if it's not $Scope, it's $Member
          result = new AccessMember(result, name);
        }
        continue;
      case T$LBracket:
        this.nextToken();
        context = C$Keyed;
        result = new AccessKeyed(result, this.parseExpression());
        this.expect(T$RBracket);
        break;
      case T$LParen:
        this.nextToken();
        const args = [];
        while (this.currentToken !== T$RParen) {
          args.push(this.parseExpression());
          if (!this.optional(T$Comma)) {
            break;
          }
        }
        this.expect(T$RParen);
        if (context & C$Scope) {
          result = new CallScope(name, args, result.ancestor);
        } else if (context & C$Member) {
          result = new CallMember(result, name, args);
        } else {
          result = new CallFunction(result, args);
        }
        context = 0;
        break;
      case T$TemplateTail:
        result = new LiteralTemplate([this.tokenValue], [], [this.tokenRaw], result);
        this.nextToken();
        break;
      case T$TemplateContinuation:
        result = this.parseTemplate(context | C$Tagged, result);
      // no default
      }
    }

    return result;
  }

  parseTemplate(context, func) {
    const cooked = [this.tokenValue];
    const raw = context & C$Tagged ? [this.tokenRaw] : undefined;
    this.expect(T$TemplateContinuation);
    const expressions = [this.parseExpression()];

    while ((this.currentToken = this.scanTemplateTail()) !== T$TemplateTail) {
      cooked.push(this.tokenValue);
      if (context & C$Tagged) {
        raw.push(this.tokenRaw);
      }
      this.expect(T$TemplateContinuation);
      expressions.push(this.parseExpression());
    }

    cooked.push(this.tokenValue);
    if (context & C$Tagged) {
      raw.push(this.tokenRaw);
    }
    this.nextToken();
    return new LiteralTemplate(cooked, expressions, raw, func);
  }

  nextToken() {
    /*
     * Each index in CharScanners (0-65535) contains a scan function for the charCode with that number.
     * The array is "zero-filled" with a throwing function and has functions for all ASCII chars (except ~@#`\)
     * and IdentifierParts from the Latin1 script (1314 in total).
     * Additional characters can be added via addIdentifierStart / addIdentifierPart.
     */
    while (this.index < this.length) {
      if (this.currentChar <= /*whitespace*/0x20) {
        this.nextChar();
        continue;
      }
      this.startIndex = this.index;
      if (this.currentChar === /*$*/0x24 || (this.currentChar >= /*a*/0x61 && this.currentChar <= /*z*/0x7A)) {
        this.currentToken = this.scanIdentifier();
        return;
      }
      /*
       * Note: the lookup below could also handle the characters which are handled above. It's just a performance tweak (direct
       * comparisons are faster than array indexers)
       */
      if ((this.currentToken = CharScanners[this.currentChar](this)) !== null) { // a null token means the character must be skipped
        return;
      }
    }
    this.currentToken = T$EOF;
  }

  nextChar() {
    return this.currentChar = this.input.charCodeAt(++this.index);
  }

  scanIdentifier() {
    // run to the next non-idPart
    while (AsciiIdParts.has(this.nextChar())
      // Note: "while(IdParts[this.nextChar()])" would be enough to make this work. This is just a performance
      // tweak, similar to the one in nextToken()
      || (this.currentChar > 0x7F && IdParts[this.currentChar])) { } // eslint-disable-line no-empty

    return KeywordLookup[this.tokenValue = this.tokenRaw] || T$Identifier;
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

    if (isFloat || this.currentChar === /*.*/0x2E) {
      // isFloat (coming from the period scanner) means the period was already skipped
      if (!isFloat) {
        this.nextChar();
      }
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

        if (this.currentChar === /*u*/0x75) {
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
            this.error();
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

  scanTemplate() {
    let tail = true;
    let result = '';

    while (this.nextChar() !== /*`*/0x60) {
      if (this.currentChar === /*$*/0x24) {
        if ((this.index + 1) < this.length && this.input.charCodeAt(this.index + 1) === /*{*/0x7B) {
          this.index++;
          tail = false;
          break;
        } else {
          result += '$';
        }
      } else if (this.currentChar === /*\*/0x5C) {
        result += String.fromCharCode(unescape(this.nextChar()));
      } else {
        result += String.fromCharCode(this.currentChar);
      }
    }

    this.nextChar();
    this.tokenValue = result;
    if (tail) {
      return T$TemplateTail;
    }
    return T$TemplateContinuation;
  }

  scanTemplateTail() {
    if (this.index >= this.length) {
      this.error('Unterminated template');
    }
    this.index--;
    return this.scanTemplate();
  }

  error(message = `Unexpected token ${this.tokenRaw}`, column = this.startIndex) {
    throw new Error(`Parser Error: ${message} at column ${column} in expression [${this.input}]`);
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
      this.error(`Missing expected token ${TokenValues[token & T$TokenMask]}`, this.index);
    }
  }
}

// todo: we're missing a few here (https://tc39.github.io/ecma262/#table-34)
// find out if the full list can be included without introducing a breaking change
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

// Context flags

// The order of C$This, C$Scope, C$Member and C$Keyed affects their behavior due to the bitwise left shift
// used in parseLeftHandSideExpresion
const C$This          = 1 << 10;
const C$Scope         = 1 << 11;
const C$Member        = 1 << 12;
const C$Keyed         = 1 << 13;
const C$ShorthandProp = 1 << 14;
const C$Tagged        = 1 << 15;
// Performing a bitwise and (&) with this value (511) will return only the ancestor bit (is this limit high enough?)
const C$Ancestor      = (1 << 9) - 1;


// Tokens

/* Performing a bitwise and (&) with this value (63) will return only the
 * token bit, which corresponds to the index of the token's value in the
 * TokenValues array */
const T$TokenMask = (1 << 6) - 1;

/* Shifting 6 bits to the left gives us a step size of 64 in a range of
 * 64 (1 << 6) to 448 (7 << 6) for our precedence bit
 * This is the lowest value which does not overlap with the token bits 0-38. */
const T$PrecShift = 6;

/* Performing a bitwise and (&) with this value will return only the
 * precedence bit, which is used to determine the parsing order of binary
 * expressions */
const T$Precedence = 7 << T$PrecShift;

// The tokens must start at 1 << 11 to avoid conflict with Precedence (1 << 10 === 16 << 6)
// and can go up to 1 << 30 (1 << 31 rolls over to negative)
const T$ExpressionTerminal     = 1 << 11;
/** ')' | '}' | ']' */
const T$ClosingToken           = 1 << 12;
/** '(' | '{' | '[' */
const T$OpeningToken           = 1 << 13;
/** EOF | '(' | '}' | ')' | ',' | '[' | '&' | '|' */
const T$AccessScopeTerminal    = 1 << 14;
const T$Keyword                = 1 << 15;
const T$EOF                    = 1 << 16 | T$AccessScopeTerminal | T$ExpressionTerminal;
const T$Identifier             = 1 << 17;
const T$IdentifierOrKeyword    = T$Identifier | T$Keyword;
const T$Literal                = 1 << 18;
const T$NumericLiteral         = 1 << 19 | T$Literal;
const T$StringLiteral          = 1 << 20 | T$Literal;
const T$BinaryOp               = 1 << 21;
/** '+' | '-' | '!' */
const T$UnaryOp                = 1 << 22;
/** '.' | '[' */
const T$MemberExpression       = 1 << 23;
/** '.' | '[' | '(' */
const T$MemberOrCallExpression = 1 << 24;
const T$TemplateTail           = 1 << 25 | T$MemberOrCallExpression;
const T$TemplateContinuation   = 1 << 26 | T$MemberOrCallExpression;

/** false */      const T$FalseKeyword     = 0 | T$Keyword | T$Literal;
/** true */       const T$TrueKeyword      = 1 | T$Keyword | T$Literal;
/** null */       const T$NullKeyword      = 2 | T$Keyword | T$Literal;
/** undefined */  const T$UndefinedKeyword = 3 | T$Keyword | T$Literal;
/** '$this' */    const T$ThisScope        = 4 | T$IdentifierOrKeyword;
/** '$parent' */  const T$ParentScope      = 5 | T$IdentifierOrKeyword;

/** '(' */  const T$LParen    =  6 | T$OpeningToken | T$AccessScopeTerminal | T$MemberOrCallExpression;
/** '{' */  const T$LBrace    =  7 | T$OpeningToken;
/** '.' */  const T$Period    =  8 | T$MemberExpression | T$MemberOrCallExpression;
/** '}' */  const T$RBrace    =  9 | T$AccessScopeTerminal | T$ClosingToken | T$ExpressionTerminal;
/** ')' */  const T$RParen    = 10 | T$AccessScopeTerminal | T$ClosingToken | T$ExpressionTerminal;
/** ';' */  const T$Semicolon = 11 | T$ExpressionTerminal;
/** ',' */  const T$Comma     = 12 | T$AccessScopeTerminal;
/** '[' */  const T$LBracket  = 13 | T$OpeningToken | T$AccessScopeTerminal | T$MemberExpression | T$MemberOrCallExpression;
/** ']' */  const T$RBracket  = 14 | T$ClosingToken | T$ExpressionTerminal;
/** ':' */  const T$Colon     = 15 | T$AccessScopeTerminal;
/** '?' */  const T$Question  = 16;

// Operator precedence: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
/** '&' */         const T$Ampersand          = 19 | T$AccessScopeTerminal;
/** '|' */         const T$Bar                = 20 | T$AccessScopeTerminal;
/** '||' */        const T$BarBar             = 21/* 5*/ |  1 << T$PrecShift | T$BinaryOp;
/** '&&' */        const T$AmpersandAmpersand = 22/* 6*/ |  2 << T$PrecShift | T$BinaryOp;
/** '^' */         const T$Caret              = 23/* 8*/ |  3 << T$PrecShift | T$BinaryOp;
/** '==' */        const T$EqEq               = 24/*10*/ |  4 << T$PrecShift | T$BinaryOp;
/** '!=' */        const T$BangEq             = 25/*10*/ |  4 << T$PrecShift | T$BinaryOp;
/** '===' */       const T$EqEqEq             = 26/*10*/ |  4 << T$PrecShift | T$BinaryOp;
/** '!== '*/       const T$BangEqEq           = 27/*10*/ |  4 << T$PrecShift | T$BinaryOp;
/** '<' */         const T$Lt                 = 28/*11*/ |  5 << T$PrecShift | T$BinaryOp;
/** '>' */         const T$Gt                 = 29/*11*/ |  5 << T$PrecShift | T$BinaryOp;
/** '<=' */        const T$LtEq               = 30/*11*/ |  5 << T$PrecShift | T$BinaryOp;
/** '>=' */        const T$GtEq               = 31/*11*/ |  5 << T$PrecShift | T$BinaryOp;
/** 'in' */        const T$InKeyword          = 32/*11*/ |  5 << T$PrecShift | T$BinaryOp | T$Keyword;
/** 'instanceof' */const T$InstanceOfKeyword  = 33/*11*/ |  5 << T$PrecShift | T$BinaryOp | T$Keyword;
/** '+' */         const T$Plus               = 34/*13*/ |  6 << T$PrecShift | T$BinaryOp | T$UnaryOp;
/** '-' */         const T$Minus              = 35/*13*/ |  6 << T$PrecShift | T$BinaryOp | T$UnaryOp;
/** 'typeof' */    const T$TypeofKeyword      = 36/*16*/ | T$UnaryOp | T$Keyword;
/** 'void' */      const T$VoidKeyword        = 37/*16*/ | T$UnaryOp | T$Keyword;
/** '*' */         const T$Star               = 38/*14*/ |  7 << T$PrecShift | T$BinaryOp;
/** '%' */         const T$Percent            = 39/*14*/ |  7 << T$PrecShift | T$BinaryOp;
/** '/' */         const T$Slash              = 40/*14*/ |  7 << T$PrecShift | T$BinaryOp;
/** '=' */         const T$Eq                 = 41;
/** '!' */         const T$Bang               = 42 | T$UnaryOp;

const KeywordLookup = Object.create(null);
KeywordLookup.true = T$TrueKeyword;
KeywordLookup.null = T$NullKeyword;
KeywordLookup.false = T$FalseKeyword;
KeywordLookup.undefined = T$UndefinedKeyword;
KeywordLookup.$this = T$ThisScope;
KeywordLookup.$parent = T$ParentScope;
KeywordLookup.in = T$InKeyword;
KeywordLookup.instanceof = T$InstanceOfKeyword;
KeywordLookup.typeof = T$TypeofKeyword;
KeywordLookup.void = T$VoidKeyword;

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
  '<=', '>=', 'in', 'instanceof', '+', '-', 'typeof', 'void', '*', '%', '/', '=', '!'
];

/**
 * Ranges of code points in pairs of 2 (eg 0x41-0x5B, 0x61-0x7B, ...) where the second value is not inclusive (5-7 means 5 and 6)
 * Single values are denoted by the second value being a 0
 *
 * Copied from output generated with "node build/generate-unicode.js"
 *
 * See also: https://en.wikibooks.org/wiki/Unicode/Character_reference/0000-0FFF
 */
const codes = {
  /* [$0-9A-Za_a-z] */
  AsciiIdPart: [0x24, 0, 0x30, 0x3A, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B],
  IdStart: /*IdentifierStart*/[0x24, 0, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B, 0xAA, 0, 0xBA, 0, 0xC0, 0xD7, 0xD8, 0xF7, 0xF8, 0x2B9, 0x2E0, 0x2E5, 0x1D00, 0x1D26, 0x1D2C, 0x1D5D, 0x1D62, 0x1D66, 0x1D6B, 0x1D78, 0x1D79, 0x1DBF, 0x1E00, 0x1F00, 0x2071, 0, 0x207F, 0, 0x2090, 0x209D, 0x212A, 0x212C, 0x2132, 0, 0x214E, 0, 0x2160, 0x2189, 0x2C60, 0x2C80, 0xA722, 0xA788, 0xA78B, 0xA7AF, 0xA7B0, 0xA7B8, 0xA7F7, 0xA800, 0xAB30, 0xAB5B, 0xAB5C, 0xAB65, 0xFB00, 0xFB07, 0xFF21, 0xFF3B, 0xFF41, 0xFF5B],
  Digit: /*DecimalNumber*/[0x30, 0x3A],
  Skip: /*Skippable*/[0, 0x21, 0x7F, 0xA1]
};

/**
 * Decompress the ranges into an array of numbers so that the char code
 * can be used as an index to the lookup
 */
function decompress(lookup, set, compressed, value) {
  let rangeCount = compressed.length;
  for (let i = 0; i < rangeCount; i += 2) {
    const start = compressed[i];
    let end = compressed[i + 1];
    end = end > 0 ? end : start + 1;
    if (lookup) {
      lookup.fill(value, start, end);
    }
    if (set) {
      for (let ch = start; ch < end; ch++) {
        set.add(ch);
      }
    }
  }
}

// CharFuncLookup functions
function returnToken(token) {
  return p => {
    p.nextChar();
    return token;
  };
}
function unexpectedCharacter(p) {
  p.error(`Unexpected character [${String.fromCharCode(p.currentChar)}]`);
  return null;
}
unexpectedCharacter.notMapped = true;

// ASCII IdentifierPart lookup
const AsciiIdParts = new Set();
decompress(null, AsciiIdParts, codes.AsciiIdPart, true);

// IdentifierPart lookup
const IdParts = new Uint8Array(0xFFFF);
decompress(IdParts, null, codes.IdStart, 1);
decompress(IdParts, null, codes.Digit, 1);

// Character scanning function lookup
const CharScanners = new Array(0xFFFF);
CharScanners.fill(unexpectedCharacter, 0, 0xFFFF);

decompress(CharScanners, null, codes.Skip, p => {
  p.nextChar();
  return null;
});
decompress(CharScanners, null, codes.IdStart, p => p.scanIdentifier());
decompress(CharScanners, null, codes.Digit, p => p.scanNumber(false));

CharScanners[/*" 34*/0x22] =
CharScanners[/*' 39*/0x27] = p => {
  return p.scanString();
};
CharScanners[/*` 96*/0x60] = p => {
  return p.scanTemplate();
};

// !, !=, !==
CharScanners[/*! 33*/0x21] = p => {
  if (p.nextChar() !== /*=*/0x3D) {
    return T$Bang;
  }
  if (p.nextChar() !== /*=*/0x3D) {
    return T$BangEq;
  }
  p.nextChar();
  return T$BangEqEq;
};

// =, ==, ===
CharScanners[/*= 61*/0x3D] =  p => {
  if (p.nextChar() !== /*=*/0x3D) {
    return T$Eq;
  }
  if (p.nextChar() !== /*=*/0x3D) {
    return T$EqEq;
  }
  p.nextChar();
  return T$EqEqEq;
};

// &, &&
CharScanners[/*& 38*/0x26] = p => {
  if (p.nextChar() !== /*&*/0x26) {
    return T$Ampersand;
  }
  p.nextChar();
  return T$AmpersandAmpersand;
};

// |, ||
CharScanners[/*| 124*/0x7C] = p => {
  if (p.nextChar() !== /*|*/0x7C) {
    return T$Bar;
  }
  p.nextChar();
  return T$BarBar;
};

// .
CharScanners[/*. 46*/0x2E] = p => {
  if (p.nextChar() <= /*9*/0x39 && p.currentChar >= /*0*/0x30) {
    return p.scanNumber(true);
  }
  return T$Period;
};

// <, <=
CharScanners[/*< 60*/0x3C] =  p => {
  if (p.nextChar() !== /*=*/0x3D) {
    return T$Lt;
  }
  p.nextChar();
  return T$LtEq;
};

// >, >=
CharScanners[/*> 62*/0x3E] =  p => {
  if (p.nextChar() !== /*=*/0x3D) {
    return T$Gt;
  }
  p.nextChar();
  return T$GtEq;
};

CharScanners[/*% 37*/0x25] = returnToken(T$Percent);
CharScanners[/*( 40*/0x28] = returnToken(T$LParen);
CharScanners[/*) 41*/0x29] = returnToken(T$RParen);
CharScanners[/** 42*/0x2A] = returnToken(T$Star);
CharScanners[/*+ 43*/0x2B] = returnToken(T$Plus);
CharScanners[/*, 44*/0x2C] = returnToken(T$Comma);
CharScanners[/*- 45*/0x2D] = returnToken(T$Minus);
CharScanners[/*/ 47*/0x2F] = returnToken(T$Slash);
CharScanners[/*: 58*/0x3A] = returnToken(T$Colon);
CharScanners[/*; 59*/0x3B] = returnToken(T$Semicolon);
CharScanners[/*? 63*/0x3F] = returnToken(T$Question);
CharScanners[/*[ 91*/0x5B] = returnToken(T$LBracket);
CharScanners[/*] 93*/0x5D] = returnToken(T$RBracket);
CharScanners[/*^ 94*/0x5E] = returnToken(T$Caret);
CharScanners[/*{ 123*/0x7B] = returnToken(T$LBrace);
CharScanners[/*} 125*/0x7D] = returnToken(T$RBrace);

const $idStart = 'IdentifierStart';
const $idPart = 'IdentifierPart';

function addIdPartOrStart(kind, value) {
  switch (typeof value) {
  case 'number':
    if (kind === $idStart) {
      // only set the function if it is an IdentifierStart and does not already have a function
      if (CharScanners[value].notMapped) {
        CharScanners[value] = p => p.scanIdentifier();
      } else {
        throw new Error(`${$idPart} [${String.fromCharCode(value)}] conflicts with an existing character mapping.`);
      }
    }
    // an IdentifierStart is always also an IdentifierPart, so we'll set this value regardless
    IdParts[value] = true;
    AsciiIdParts.add(value);
    break;
  case 'string': {
    let len = value.length;
    while (len--) addIdPartOrStart(kind, value[len].charCodeAt());
    break;
  }
  case 'object': {
    let len = value.length;
    if (Array.isArray) {
      while (len--) {
        addIdPartOrStart(kind, value[len]);
      }
      break;
    }
  }
  // falls through
  default:
    throw new Error(`${kind} must be a string, number, or an array of either (actual: ${typeof value})`);
  }
}

export const parserConfig = {
  addIdentifierPart: function(value) {
    addIdPartOrStart($idPart, value);
  },
  addIdentifierStart: function(value) {
    addIdPartOrStart($idStart, value);
  }
};
