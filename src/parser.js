import {
  ValueConverter, Assign, Conditional,
  AccessThis, AccessScope, AccessMember, AccessKeyed,
  CallScope, CallFunction, CallMember,
  Unary, BindingBehavior, Binary,
  LiteralPrimitive, LiteralArray, LiteralObject, LiteralString, LiteralTemplate
} from './ast';

export class Parser {
  constructor() {
    this.cache = Object.create(null);
  }

  parse(src) {
    src = src || '';

    return this.cache[src] || (this.cache[src] = new ParserImplementation(src).parseBindingBehavior());
  }
}


const fromCharCode = String.fromCharCode;

export class ParserImplementation {
  /** Current raw token value based on start and current index */
  get raw() {
    return this.src.slice(this.start, this.idx);
  }

  constructor(src) {
    /** Current char index */
    this.idx = 0;
    /** Start index of the current char scan */
    this.start = 0;
    /** Input source */
    this.src = src;
    this.len = src.length;
    /** Current token */
    this.tkn = T$EOF;
    /** Current token value */
    this.val = undefined;
    /** Current char */
    this.ch = src.charCodeAt(0);
  }

  parseBindingBehavior() {
    this.nextToken();
    if (this.tkn & T$ExpressionTerminal) {
      this.err('Invalid start of expression');
    }
    let result = this.parseValueConverter();
    while (this.opt(T$Ampersand)) {
      result = new BindingBehavior(result, this.val, this.parseVariadicArgs());
    }
    if (this.tkn !== T$EOF) {
      this.err(`Unconsumed token ${this.raw}`);
    }
    return result;
  }

  parseValueConverter() {
    let result = this.parseExpression();
    while (this.opt(T$Bar)) {
      result = new ValueConverter(result, this.val, this.parseVariadicArgs());
    }
    return result;
  }

  parseVariadicArgs() {
    this.nextToken();
    const result = [];
    while (this.opt(T$Colon)) {
      result.push(this.parseExpression());
    }
    return result;
  }

  parseExpression() {
    let exprStart = this.idx;
    let result = this.parseConditional();

    while (this.tkn === T$Eq) {
      if (!result.isAssignable) {
        this.err(`Expression ${this.src.slice(exprStart, this.start)} is not assignable`);
      }
      this.nextToken();
      exprStart = this.idx;
      result = new Assign(result, this.parseConditional());
    }
    return result;
  }

  parseConditional() {
    let result = this.parseBinary(0);

    if (this.opt(T$Question)) {
      let yes = this.parseExpression();
      this.expect(T$Colon);
      result = new Conditional(result, yes, this.parseExpression());
    }
    return result;
  }

  parseBinary(minPrecedence) {
    let left = this.parseLeftHandSide(0);

    while (this.tkn & T$BinaryOp) {
      const opToken = this.tkn;
      if ((opToken & T$Precedence) <= minPrecedence) {
        break;
      }
      this.nextToken();
      left = new Binary(TokenValues[opToken & T$TokenMask], left, this.parseBinary(opToken & T$Precedence));
    }
    return left;
  }

  parseLeftHandSide(context) {
    let result;

    // Unary + Primary expression
    primary: switch (this.tkn) {
    case T$Plus:
      this.nextToken();
      return this.parseLeftHandSide(0);
    case T$Minus:
      this.nextToken();
      return new Binary('-', new LiteralPrimitive(0), this.parseLeftHandSide(0));
    case T$Bang:
    case T$TypeofKeyword:
    case T$VoidKeyword:
      const op = TokenValues[this.tkn & T$TokenMask];
      this.nextToken();
      return new Unary(op, this.parseLeftHandSide(0));
    case T$ParentScope: // $parent
      {
        do {
          this.nextToken();
          context++; // ancestor
          if (this.opt(T$Period)) {
            if (this.tkn === T$Period) {
              this.err();
            }
            continue;
          } else if (this.tkn & T$AccessScopeTerminal) {
            result = new AccessThis(context & C$Ancestor);
            // Keep the ShorthandProp flag, clear all the others, and set context to This
            context = (context & C$ShorthandProp) | C$This;
            break primary;
          } else {
            this.err();
          }
        } while (this.tkn === T$ParentScope);
      }
    // falls through
    case T$Identifier: // identifier
      {
        result = new AccessScope(this.val, context & C$Ancestor);
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
      context = C$Primary;
      break;
    case T$LBracket: // literal array
      {
        this.nextToken();
        const elements = [];
        if (this.tkn !== T$RBracket) {
          do {
            elements.push(this.parseExpression());
          } while (this.opt(T$Comma));
        }
        this.expect(T$RBracket);
        result = new LiteralArray(elements);
        context = C$Primary;
        break;
      }
    case T$LBrace: // object
      {
        const keys = [];
        const values = [];
        this.nextToken();
        while (this.tkn !== T$RBrace) {
          if (this.tkn & T$IdentifierOrKeyword) {
            const { ch, tkn, idx } = this;
            keys.push(this.val);
            this.nextToken();
            if (this.opt(T$Colon)) {
              values.push(this.parseExpression());
            } else {
              this.ch = ch;
              this.tkn = tkn;
              this.idx = idx;
              values.push(this.parseLeftHandSide(C$ShorthandProp));
            }
          } else if (this.tkn & T$Literal) {
            keys.push(this.val);
            this.nextToken();
            this.expect(T$Colon);
            values.push(this.parseExpression());
          } else {
            this.err();
          }
          if (this.tkn !== T$RBrace) {
            this.expect(T$Comma);
          }
        }
        this.expect(T$RBrace);
        result = new LiteralObject(keys, values);
        context = C$Primary;
        break;
      }
    case T$StringLiteral:
      result = new LiteralString(this.val);
      this.nextToken();
      context = C$Primary;
      break;
    case T$TemplateTail:
      result = new LiteralTemplate([this.val]);
      this.nextToken();
      context = C$Primary;
      break;
    case T$TemplateContinuation:
      result = this.parseTemplate(0);
      context = C$Primary;
      break;
    case T$NumericLiteral:
      {
        result = new LiteralPrimitive(this.val);
        this.nextToken();
        // note: spec says 42.foo() is syntactically correct, so we could set context to C$Primary here but we'd have to add
        // state and rewind the parser after float scanning to accomplish that, and doesn't seem worth it for something so convoluted
        break;
      }
    case T$NullKeyword:
    case T$UndefinedKeyword:
    case T$TrueKeyword:
    case T$FalseKeyword:
      result = new LiteralPrimitive(TokenValues[this.tkn & T$TokenMask]);
      this.nextToken();
      context = C$Primary;
      break;
    default:
      if (this.idx >= this.len) {
        this.err('Unexpected end of expression');
      } else {
        this.err();
      }
    }

    // bail out here if it's an ES6 object shorthand property (and let the caller throw on periods etc)
    if (context & C$ShorthandProp) {
      return result;
    }

    let name = this.val;
    while (this.tkn & T$MemberOrCallExpression) {
      switch (this.tkn) {
      case T$Period:
        this.nextToken();
        if (!(this.tkn & T$IdentifierOrKeyword)) {
          this.err();
        }
        name = this.val;
        this.nextToken();
        // Keep $Primary, Change $This to $Scope, change $Scope to $Member, keep $Member as-is, change $Keyed to $Member, change $Call to $Member, disregard other flags
        context = (context & C$Primary) | ((context & (C$This | C$Scope)) << 1) | (context & C$Member) | ((context & C$Keyed) >> 1) | ((context & C$Call) >> 2);
        if (this.tkn === T$LParen) {
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
        while (this.tkn !== T$RParen) {
          args.push(this.parseExpression());
          if (!this.opt(T$Comma)) {
            break;
          }
        }
        this.expect(T$RParen);
        if (context & C$Scope) {
          result = new CallScope(name, args, result.ancestor);
        } else if (context & (C$Member | C$Primary)) {
          result = new CallMember(result, name, args);
        } else {
          result = new CallFunction(result, args);
        }
        context = C$Call;
        break;
      case T$TemplateTail:
        result = new LiteralTemplate([this.val], [], [this.raw], result);
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
    const cooked = [this.val];
    const raw = context & C$Tagged ? [this.raw] : undefined;
    this.expect(T$TemplateContinuation);
    const expressions = [this.parseExpression()];

    while ((this.tkn = this.scanTemplateTail()) !== T$TemplateTail) {
      cooked.push(this.val);
      if (context & C$Tagged) {
        raw.push(this.raw);
      }
      this.expect(T$TemplateContinuation);
      expressions.push(this.parseExpression());
    }

    cooked.push(this.val);
    if (context & C$Tagged) {
      raw.push(this.raw);
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
    while (this.idx < this.len) {
      if (this.ch <= /*whitespace*/0x20) {
        this.next();
        continue;
      }
      this.start = this.idx;
      if (this.ch === /*$*/0x24 || (this.ch >= /*a*/0x61 && this.ch <= /*z*/0x7A)) {
        this.tkn = this.scanIdentifier();
        return;
      }
      /*
       * Note: the lookup below could also handle the characters which are handled above. It's just a performance tweak (direct
       * comparisons are faster than array indexers)
       */
      if ((this.tkn = CharScanners[this.ch](this)) !== null) { // a null token means the character must be skipped
        return;
      }
    }
    this.tkn = T$EOF;
  }

  /** Advance to the next char */
  next() {
    return this.ch = this.src.charCodeAt(++this.idx);
  }

  scanIdentifier() {
    // run to the next non-idPart
    while (AsciiIdParts.has(this.next())
      // Note: "while(IdParts[this.next()])" would be enough to make this work. This is just a performance
      // tweak, similar to the one in nextToken()
      || (this.ch > 0x7F && IdParts[this.ch])) { } // eslint-disable-line no-empty

    return KeywordLookup[this.val = this.raw] || T$Identifier;
  }

  scanNumber(isFloat) {
    if (isFloat) {
      this.val = 0;
    } else {
      this.val = this.ch - /*0*/0x30;
      while (this.next() <= /*9*/0x39 && this.ch >= /*0*/0x30) {
        this.val = this.val * 10 + this.ch  - /*0*/0x30;
      }
    }

    if (isFloat || this.ch === /*.*/0x2E) {
      // isFloat (coming from the period scanner) means the period was already skipped
      if (!isFloat) {
        this.next();
      }
      const start = this.idx;
      let value = this.ch - /*0*/0x30;
      while (this.next() <= /*9*/0x39 && this.ch >= /*0*/0x30) {
        value = value * 10 + this.ch  - /*0*/0x30;
      }
      this.val = this.val + value / 10 ** (this.idx - start);
    }

    if (this.ch === /*e*/0x65 || this.ch === /*E*/0x45) {
      const start = this.idx;

      this.next();
      if (this.ch === /*-*/0x2D || this.ch === /*+*/0x2B) {
        this.next();
      }

      if (!(this.ch >= /*0*/0x30 && this.ch <= /*9*/0x39)) {
        this.idx = start;
        this.err('Invalid exponent');
      }
      while (this.next() <= /*9*/0x39 && this.ch >= /*0*/0x30) { } // eslint-disable-line no-empty
      this.val = parseFloat(this.src.slice(this.start, this.idx));
    }

    return T$NumericLiteral;
  }

  scanString() {
    let quote = this.ch;
    this.next(); // Skip initial quote.

    let buffer;
    let marker = this.idx;

    while (this.ch !== quote) {
      if (this.ch === /*\*/0x5C) {
        if (!buffer) {
          buffer = [];
        }

        buffer.push(this.src.slice(marker, this.idx));

        this.next();

        let unescaped;

        if (this.ch === /*u*/0x75) {
          this.next();

          if (this.idx + 4 < this.len) {
            let hex = this.src.slice(this.idx, this.idx + 4);

            if (!/[A-Z0-9]{4}/i.test(hex)) {
              this.err(`Invalid unicode escape [\\u${hex}]`);
            }

            unescaped = parseInt(hex, 16);
            this.idx += 4;
            this.ch = this.src.charCodeAt(this.idx);
          } else {
            this.err();
          }
        } else {
          unescaped = unescape(this.ch);
          this.next();
        }

        buffer.push(fromCharCode(unescaped));
        marker = this.idx;
      } else if (this.ch === /*EOF*/0 || this.idx >= this.len) {
        this.err('Unterminated quote');
      } else {
        this.next();
      }
    }

    let last = this.src.slice(marker, this.idx);
    this.next(); // Skip terminating quote.

    // Compute the unescaped string value.
    let unescaped = last;

    if (buffer !== null && buffer !== undefined) {
      buffer.push(last);
      unescaped = buffer.join('');
    }

    this.val = unescaped;
    return T$StringLiteral;
  }

  scanTemplate() {
    let tail = true;
    let result = '';

    while (this.next() !== /*`*/0x60) {
      if (this.ch === /*$*/0x24) {
        if ((this.idx + 1) < this.len && this.src.charCodeAt(this.idx + 1) === /*{*/0x7B) {
          this.idx++;
          tail = false;
          break;
        } else {
          result += '$';
        }
      } else if (this.ch === /*\*/0x5C) {
        result += fromCharCode(unescape(this.next()));
      } else if (this.ch === /*EOF*/0 || this.idx >= this.len) {
        this.err('Unterminated template literal');
      } else {
        result += fromCharCode(this.ch);
      }
    }

    this.next();
    this.val = result;
    if (tail) {
      return T$TemplateTail;
    }
    return T$TemplateContinuation;
  }

  scanTemplateTail() {
    if (this.idx >= this.len) {
      this.err('Unterminated template');
    }
    this.idx--;
    return this.scanTemplate();
  }

  /** Throw error (defaults to unexpected token if no message provided) */
  err(message = `Unexpected token ${this.raw}`, column = this.start) {
    throw new Error(`Parser Error: ${message} at column ${column} in expression [${this.src}]`);
  }

  /** Consumes the current token if it matches the provided one and returns true, otherwise returns false */
  opt(token) {
    if (this.tkn === token) {
      this.nextToken();
      return true;
    }

    return false;
  }

  /** Consumes the current token if it matches the provided one, otherwise throws */
  expect(token) {
    if (this.tkn === token) {
      this.nextToken();
    } else {
      this.err(`Missing expected token ${TokenValues[token & T$TokenMask]}`, this.idx);
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
const C$Call          = 1 << 14;
const C$Primary       = 1 << 15;
const C$ShorthandProp = 1 << 16;
const C$Tagged        = 1 << 17;
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
/** ',' */  const T$Comma     = 11 | T$AccessScopeTerminal;
/** '[' */  const T$LBracket  = 12 | T$OpeningToken | T$AccessScopeTerminal | T$MemberExpression | T$MemberOrCallExpression;
/** ']' */  const T$RBracket  = 13 | T$ClosingToken | T$ExpressionTerminal;
/** ':' */  const T$Colon     = 14 | T$AccessScopeTerminal;
/** '?' */  const T$Question  = 15;

// Operator precedence: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
/** '&' */         const T$Ampersand          = 18 | T$AccessScopeTerminal;
/** '|' */         const T$Bar                = 19 | T$AccessScopeTerminal;
/** '||' */        const T$BarBar             = 20/* 5*/ |  1 << T$PrecShift | T$BinaryOp;
/** '&&' */        const T$AmpersandAmpersand = 21/* 6*/ |  2 << T$PrecShift | T$BinaryOp;
/** '^' */         const T$Caret              = 22/* 8*/ |  3 << T$PrecShift | T$BinaryOp;
/** '==' */        const T$EqEq               = 23/*10*/ |  4 << T$PrecShift | T$BinaryOp;
/** '!=' */        const T$BangEq             = 24/*10*/ |  4 << T$PrecShift | T$BinaryOp;
/** '===' */       const T$EqEqEq             = 25/*10*/ |  4 << T$PrecShift | T$BinaryOp;
/** '!== '*/       const T$BangEqEq           = 26/*10*/ |  4 << T$PrecShift | T$BinaryOp;
/** '<' */         const T$Lt                 = 27/*11*/ |  5 << T$PrecShift | T$BinaryOp;
/** '>' */         const T$Gt                 = 28/*11*/ |  5 << T$PrecShift | T$BinaryOp;
/** '<=' */        const T$LtEq               = 29/*11*/ |  5 << T$PrecShift | T$BinaryOp;
/** '>=' */        const T$GtEq               = 30/*11*/ |  5 << T$PrecShift | T$BinaryOp;
/** 'in' */        const T$InKeyword          = 31/*11*/ |  5 << T$PrecShift | T$BinaryOp | T$Keyword;
/** 'instanceof' */const T$InstanceOfKeyword  = 32/*11*/ |  5 << T$PrecShift | T$BinaryOp | T$Keyword;
/** '+' */         const T$Plus               = 33/*13*/ |  6 << T$PrecShift | T$BinaryOp | T$UnaryOp;
/** '-' */         const T$Minus              = 34/*13*/ |  6 << T$PrecShift | T$BinaryOp | T$UnaryOp;
/** 'typeof' */    const T$TypeofKeyword      = 35/*16*/ | T$UnaryOp | T$Keyword;
/** 'void' */      const T$VoidKeyword        = 36/*16*/ | T$UnaryOp | T$Keyword;
/** '*' */         const T$Star               = 37/*14*/ |  7 << T$PrecShift | T$BinaryOp;
/** '%' */         const T$Percent            = 38/*14*/ |  7 << T$PrecShift | T$BinaryOp;
/** '/' */         const T$Slash              = 39/*14*/ |  7 << T$PrecShift | T$BinaryOp;
/** '=' */         const T$Eq                 = 40;
/** '!' */         const T$Bang               = 41 | T$UnaryOp;

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

  '(', '{', '.', '}', ')', ',', '[', ']', ':', '?', '\'', '"',

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
      let j = start;
      while (j < end) {
        lookup[j] = value;
        j++;
      }
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
    p.next();
    return token;
  };
}
function unexpectedCharacter(p) {
  p.err(`Unexpected character [${fromCharCode(p.ch)}]`);
  return null;
}

// ASCII IdentifierPart lookup
const AsciiIdParts = new Set();
decompress(null, AsciiIdParts, codes.AsciiIdPart, true);

// IdentifierPart lookup
const IdParts = new Uint8Array(0xFFFF);
decompress(IdParts, null, codes.IdStart, 1);
decompress(IdParts, null, codes.Digit, 1);

// Character scanning function lookup
const CharScanners = new Array(0xFFFF);
let ci = 0;
while (ci < 0xFFFF) {
  CharScanners[ci] = unexpectedCharacter;
  ci++;
}

decompress(CharScanners, null, codes.Skip, p => {
  p.next();
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
  if (p.next() !== /*=*/0x3D) {
    return T$Bang;
  }
  if (p.next() !== /*=*/0x3D) {
    return T$BangEq;
  }
  p.next();
  return T$BangEqEq;
};

// =, ==, ===
CharScanners[/*= 61*/0x3D] =  p => {
  if (p.next() !== /*=*/0x3D) {
    return T$Eq;
  }
  if (p.next() !== /*=*/0x3D) {
    return T$EqEq;
  }
  p.next();
  return T$EqEqEq;
};

// &, &&
CharScanners[/*& 38*/0x26] = p => {
  if (p.next() !== /*&*/0x26) {
    return T$Ampersand;
  }
  p.next();
  return T$AmpersandAmpersand;
};

// |, ||
CharScanners[/*| 124*/0x7C] = p => {
  if (p.next() !== /*|*/0x7C) {
    return T$Bar;
  }
  p.next();
  return T$BarBar;
};

// .
CharScanners[/*. 46*/0x2E] = p => {
  if (p.next() <= /*9*/0x39 && p.ch >= /*0*/0x30) {
    return p.scanNumber(true);
  }
  return T$Period;
};

// <, <=
CharScanners[/*< 60*/0x3C] =  p => {
  if (p.next() !== /*=*/0x3D) {
    return T$Lt;
  }
  p.next();
  return T$LtEq;
};

// >, >=
CharScanners[/*> 62*/0x3E] =  p => {
  if (p.next() !== /*=*/0x3D) {
    return T$Gt;
  }
  p.next();
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
CharScanners[/*? 63*/0x3F] = returnToken(T$Question);
CharScanners[/*[ 91*/0x5B] = returnToken(T$LBracket);
CharScanners[/*] 93*/0x5D] = returnToken(T$RBracket);
CharScanners[/*^ 94*/0x5E] = returnToken(T$Caret);
CharScanners[/*{ 123*/0x7B] = returnToken(T$LBrace);
CharScanners[/*} 125*/0x7D] = returnToken(T$RBrace);
