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

    return this.cache[src] || (this.cache[src] = parseCore(src));
  }
}


/* eslint-disable */

const $false = new LiteralPrimitive(false);
const $true = new LiteralPrimitive(true);
const $null = new LiteralPrimitive(null);
const $undefined = new LiteralPrimitive(undefined);
const $this = new AccessThis(0);
const $parent = new AccessThis(1);

/*@internal*/
class ParserState {
  get tokenRaw() {
    return this.input.slice(this.startIndex, this.index);
  }
  constructor(input) {
    this.index = 0;
    this.startIndex = 0;
    this.lastIndex = 0;
    this.input = input;
    this.length = input.length;
    this.currentToken = 1572864 /* EOF */;
    this.tokenValue = '';
    this.currentChar = input.charCodeAt(0);
    this.assignable = true;
  }
}
const $state = new ParserState('');
/*@internal*/
export function parseCore(input) {
  $state.input = input;
  $state.length = input.length;
  $state.index = 0;
  $state.currentChar = input.charCodeAt(0);
  return parse($state, 0 /* Reset */, 61 /* Variadic */);
}
/*@internal*/
function parse(state, access, minPrecedence) {
  if (state.index === 0) {
    nextToken(state);
    if (state.currentToken & 1048576 /* ExpressionTerminal */) {
      throw Reporter.error(100 /* InvalidExpressionStart */, { state });
    }
  }
  state.assignable = 448 /* Binary */ > minPrecedence;
  let result = undefined;
  if (state.currentToken & 32768 /* UnaryOp */) {
    /** parseUnaryExpression
     * https://tc39.github.io/ecma262/#sec-unary-operators
     *
     * UnaryExpression :
     *   1. LeftHandSideExpression
     *   2. void UnaryExpression
     *   3. typeof UnaryExpression
     *   4. + UnaryExpression
     *   5. - UnaryExpression
     *   6. ! UnaryExpression
     *
     * IsValidAssignmentTarget
     *   2,3,4,5,6 = false
     *   1 = see parseLeftHandSideExpression
     *
     * Note: technically we should throw on ++ / -- / +++ / ---, but there's nothing to gain from that
     */
    const op = TokenValues[state.currentToken & 63 /* Type */];
    nextToken(state);
    result = new Unary(op, parse(state, access, 449 /* LeftHandSide */));
    state.assignable = false;
  }
  else {
    /** parsePrimaryExpression
     * https://tc39.github.io/ecma262/#sec-primary-expression
     *
     * PrimaryExpression :
     *   1. this
     *   2. IdentifierName
     *   3. Literal
     *   4. ArrayLiteral
     *   5. ObjectLiteral
     *   6. TemplateLiteral
     *   7. ParenthesizedExpression
     *
     * Literal :
     *  NullLiteral
     *  BooleanLiteral
     *  NumericLiteral
     *  StringLiteral
     *
     * ParenthesizedExpression :
     *   ( AssignmentExpression )
     *
     * IsValidAssignmentTarget
     *   1,3,4,5,6,7 = false
     *   2 = true
     */
    primary: switch (state.currentToken) {
      case 3077 /* ParentScope */: // $parent
        state.assignable = false;
        do {
          nextToken(state);
          access++; // ancestor
          if (consumeOpt(state, 16392 /* Dot */)) {
            if (state.currentToken === 16392 /* Dot */) {
              throw Reporter.error(102 /* DoubleDot */, { state });
            }
            else if (state.currentToken === 1572864 /* EOF */) {
              throw Reporter.error(105 /* ExpectedIdentifier */, { state });
            }
            continue;
          }
          else if (state.currentToken & 524288 /* AccessScopeTerminal */) {
            const ancestor = access & 511 /* Ancestor */;
            result = ancestor === 0 ? $this : ancestor === 1 ? $parent : new AccessThis(ancestor);
            access = 512 /* This */;
            break primary;
          }
          else {
            throw Reporter.error(103 /* InvalidMemberExpression */, { state });
          }
        } while (state.currentToken === 3077 /* ParentScope */);
      // falls through
      case 1024 /* Identifier */: // identifier
        result = new AccessScope(state.tokenValue, access & 511 /* Ancestor */);
        access = 1024 /* Scope */;
        state.assignable = true;
        nextToken(state);
        break;
      case 3076 /* ThisScope */: // $this
        state.assignable = false;
        nextToken(state);
        result = $this;
        access = 512 /* This */;
        break;
      case 671750 /* OpenParen */: // parenthesized expression
        nextToken(state);
        result = parse(state, 0 /* Reset */, 62 /* Assign */);
        consume(state, 1835018 /* CloseParen */);
        access = 0 /* Reset */;
        break;
      case 671756 /* OpenBracket */:
        result = parseArrayLiteralExpression(state, access);
        access = 0 /* Reset */;
        break;
      case 131079 /* OpenBrace */:
        result = parseObjectLiteralExpression(state);
        access = 0 /* Reset */;
        break;
      case 540713 /* TemplateTail */:
        result = new LiteralTemplate([state.tokenValue]);
        state.assignable = false;
        nextToken(state);
        access = 0 /* Reset */;
        break;
      case 540714 /* TemplateContinuation */:
        result = parseTemplate(state, access, result, false);
        access = 0 /* Reset */;
        break;
      case 4096 /* StringLiteral */:
        result = new LiteralString(state.tokenValue);
        state.assignable = false;
        nextToken(state);
        access = 0 /* Reset */;
        break;
      case 8192 /* NumericLiteral */:
        result = new LiteralPrimitive(state.tokenValue);
        state.assignable = false;
        nextToken(state);
        access = 0 /* Reset */;
        break;
      case 2050 /* NullKeyword */:
      case 2051 /* UndefinedKeyword */:
      case 2049 /* TrueKeyword */:
      case 2048 /* FalseKeyword */:
        result = TokenValues[state.currentToken & 63 /* Type */];
        state.assignable = false;
        nextToken(state);
        access = 0 /* Reset */;
        break;
      default:
        if (state.index >= state.length) {
          throw Reporter.error(104 /* UnexpectedEndOfExpression */, { state });
        }
        else {
          throw Reporter.error(101 /* UnconsumedToken */, { state });
        }
    }
    // tslint:disable-next-line:no-any
    if (449 /* LeftHandSide */ < minPrecedence)
      return result;
    /** parseMemberExpression (Token.Dot, Token.OpenBracket, Token.TemplateContinuation)
     * MemberExpression :
     *   1. PrimaryExpression
     *   2. MemberExpression [ AssignmentExpression ]
     *   3. MemberExpression . IdentifierName
     *   4. MemberExpression LiteralTemplate
     *
     * IsValidAssignmentTarget
     *   1,4 = false
     *   2,3 = true
     *
     *
     * parseCallExpression (Token.OpenParen)
     * CallExpression :
     *   1. MemberExpression Arguments
     *   2. CallExpression Arguments
     *   3. CallExpression [ AssignmentExpression ]
     *   4. CallExpression . IdentifierName
     *   5. CallExpression TemplateLiteral
     *
     * IsValidAssignmentTarget
     *   1,2,5 = false
     *   3,4 = true
     */
    let name = state.tokenValue;
    while ((state.currentToken & 16384 /* LeftHandSide */) > 0) {
      switch (state.currentToken) {
        case 16392 /* Dot */:
          state.assignable = true;
          nextToken(state);
          if ((state.currentToken & 3072 /* IdentifierName */) === 0) {
            throw Reporter.error(105 /* ExpectedIdentifier */, { state });
          }
          name = state.tokenValue;
          nextToken(state);
          // Change $This to $Scope, change $Scope to $Member, keep $Member as-is, change $Keyed to $Member, disregard other flags
          access = ((access & (512 /* This */ | 1024 /* Scope */)) << 1) | (access & 2048 /* Member */) | ((access & 4096 /* Keyed */) >> 1);
          if (state.currentToken === 671750 /* OpenParen */) {
            if (access === 0 /* Reset */) { // if the left hand side is a literal, make sure we parse a CallMember
              access = 2048 /* Member */;
            }
            continue;
          }
          if (access & 1024 /* Scope */) {
            result = new AccessScope(name, result.ancestor);
          }
          else { // if it's not $Scope, it's $Member
            result = new AccessMember(result, name);
          }
          continue;
        case 671756 /* OpenBracket */:
          state.assignable = true;
          nextToken(state);
          access = 4096 /* Keyed */;
          result = new AccessKeyed(result, parse(state, 0 /* Reset */, 62 /* Assign */));
          consume(state, 1835021 /* CloseBracket */);
          break;
        case 671750 /* OpenParen */:
          state.assignable = false;
          nextToken(state);
          const args = new Array();
          while (state.currentToken !== 1835018 /* CloseParen */) {
            args.push(parse(state, 0 /* Reset */, 62 /* Assign */));
            if (!consumeOpt(state, 1572875 /* Comma */)) {
              break;
            }
          }
          consume(state, 1835018 /* CloseParen */);
          if (access & 1024 /* Scope */) {
            result = new CallScope(name, args, result.ancestor);
          }
          else if (access & 2048 /* Member */) {
            result = new CallMember(result, name, args);
          }
          else {
            result = new CallFunction(result, args);
          }
          access = 0;
          break;
        case 540713 /* TemplateTail */:
          state.assignable = false;
          const strings = [state.tokenValue];
          result = new LiteralTemplate(strings, [], strings, result);
          nextToken(state);
          break;
        case 540714 /* TemplateContinuation */:
          result = parseTemplate(state, access, result, true);
        default:
      }
    }
  }
  // tslint:disable-next-line:no-any
  if (448 /* Binary */ < minPrecedence)
    return result;
  /** parseBinaryExpression
   * https://tc39.github.io/ecma262/#sec-multiplicative-operators
   *
   * MultiplicativeExpression : (local precedence 6)
   *   UnaryExpression
   *   MultiplicativeExpression * / % UnaryExpression
   *
   * AdditiveExpression : (local precedence 5)
   *   MultiplicativeExpression
   *   AdditiveExpression + - MultiplicativeExpression
   *
   * RelationalExpression : (local precedence 4)
   *   AdditiveExpression
   *   RelationalExpression < > <= >= instanceof in AdditiveExpression
   *
   * EqualityExpression : (local precedence 3)
   *   RelationalExpression
   *   EqualityExpression == != === !== RelationalExpression
   *
   * LogicalANDExpression : (local precedence 2)
   *   EqualityExpression
   *   LogicalANDExpression && EqualityExpression
   *
   * LogicalORExpression : (local precedence 1)
   *   LogicalANDExpression
   *   LogicalORExpression || LogicalANDExpression
   */
  while ((state.currentToken & 65536 /* BinaryOp */) > 0) {
    const opToken = state.currentToken;
    if ((opToken & 448 /* Precedence */) <= minPrecedence) {
      break;
    }
    nextToken(state);
    result = new Binary(TokenValues[opToken & 63 /* Type */], result, parse(state, access, opToken & 448 /* Precedence */));
    state.assignable = false;
  }
  // tslint:disable-next-line:no-any
  if (63 /* Conditional */ < minPrecedence)
    return result;
  /**
   * parseConditionalExpression
   * https://tc39.github.io/ecma262/#prod-ConditionalExpression
   *
   * ConditionalExpression :
   *   1. BinaryExpression
   *   2. BinaryExpression ? AssignmentExpression : AssignmentExpression
   *
   * IsValidAssignmentTarget
   *   1,2 = false
   */
  if (consumeOpt(state, 1572879 /* Question */)) {
    const yes = parse(state, access, 62 /* Assign */);
    consume(state, 1572878 /* Colon */);
    result = new Conditional(result, yes, parse(state, access, 62 /* Assign */));
    state.assignable = false;
  }
  // tslint:disable-next-line:no-any
  if (62 /* Assign */ < minPrecedence)
    return result;
  /** parseAssignmentExpression
   * https://tc39.github.io/ecma262/#prod-AssignmentExpression
   * Note: AssignmentExpression here is equivalent to ES Expression because we don't parse the comma operator
   *
   * AssignmentExpression :
   *   1. ConditionalExpression
   *   2. LeftHandSideExpression = AssignmentExpression
   *
   * IsValidAssignmentTarget
   *   1,2 = false
   */
  if (consumeOpt(state, 1048615 /* Equals */)) {
    if (!state.assignable) {
      throw Reporter.error(150 /* NotAssignable */, { state });
    }
    result = new Assign(result, parse(state, access, 62 /* Assign */));
  }
  // tslint:disable-next-line:no-any
  if (61 /* Variadic */ < minPrecedence)
    return result;
  /** parseValueConverter
   */
  while (consumeOpt(state, 1572883 /* Bar */)) {
    if (state.currentToken === 1572864 /* EOF */) {
      throw Reporter.error(112);
    }
    const name = state.tokenValue;
    nextToken(state);
    const args = new Array();
    while (consumeOpt(state, 1572878 /* Colon */)) {
      args.push(parse(state, access, 62 /* Assign */));
    }
    result = new ValueConverter(result, name, args);
  }
  /** parseBindingBehavior
   */
  while (consumeOpt(state, 1572880 /* Ampersand */)) {
    if (state.currentToken === 1572864 /* EOF */) {
      throw Reporter.error(113);
    }
    const name = state.tokenValue;
    nextToken(state);
    const args = new Array();
    while (consumeOpt(state, 1572878 /* Colon */)) {
      args.push(parse(state, access, 62 /* Assign */));
    }
    result = new BindingBehavior(result, name, args);
  }
  if (state.currentToken !== 1572864 /* EOF */) {
    throw Reporter.error(101 /* UnconsumedToken */, { state });
  }
  // tslint:disable-next-line:no-any
  return result;
}
/**
 * parseArrayLiteralExpression
 * https://tc39.github.io/ecma262/#prod-ArrayLiteral
 *
 * ArrayLiteral :
 *   [ Elision(opt) ]
 *   [ ElementList ]
 *   [ ElementList, Elision(opt) ]
 *
 * ElementList :
 *   Elision(opt) AssignmentExpression
 *   ElementList, Elision(opt) AssignmentExpression
 *
 * Elision :
 *  ,
 *  Elision ,
 */
function parseArrayLiteralExpression(state, access) {
  nextToken(state);
  const elements = new Array();
  while (state.currentToken !== 1835021 /* CloseBracket */) {
    if (consumeOpt(state, 1572875 /* Comma */)) {
      elements.push($undefined);
      if (state.currentToken === 1835021 /* CloseBracket */) {
        elements.push($undefined);
        break;
      }
    }
    else {
      elements.push(parse(state, access, 62 /* Assign */));
      if (consumeOpt(state, 1572875 /* Comma */)) {
        if (state.currentToken === 1835021 /* CloseBracket */) {
          elements.push($undefined);
          break;
        }
      }
      else {
        break;
      }
    }
  }
  consume(state, 1835021 /* CloseBracket */);
  state.assignable = false;
  return new LiteralArray(elements);
}
/**
 * parseObjectLiteralExpression
 * https://tc39.github.io/ecma262/#prod-Literal
 *
 * ObjectLiteral :
 *   { }
 *   { PropertyDefinitionList }
 *
 * PropertyDefinitionList :
 *   PropertyDefinition
 *   PropertyDefinitionList, PropertyDefinition
 *
 * PropertyDefinition :
 *   IdentifierName
 *   PropertyName : AssignmentExpression
 *
 * PropertyName :
 *   IdentifierName
 *   StringLiteral
 *   NumericLiteral
 */
function parseObjectLiteralExpression(state) {
  const keys = new Array();
  const values = new Array();
  nextToken(state);
  while (state.currentToken !== 1835017 /* CloseBrace */) {
    keys.push(state.tokenValue);
    // Literal = mandatory colon
    if (state.currentToken & 12288 /* StringOrNumericLiteral */) {
      nextToken(state);
      consume(state, 1572878 /* Colon */);
      values.push(parse(state, 0 /* Reset */, 62 /* Assign */));
    }
    else if (state.currentToken & 3072 /* IdentifierName */) {
      // IdentifierName = optional colon
      const { currentChar, currentToken, index } = state;
      nextToken(state);
      if (consumeOpt(state, 1572878 /* Colon */)) {
        values.push(parse(state, 0 /* Reset */, 62 /* Assign */));
      }
      else {
        // Shorthand
        state.currentChar = currentChar;
        state.currentToken = currentToken;
        state.index = index;
        values.push(parse(state, 0 /* Reset */, 450 /* Primary */));
      }
    }
    else {
      throw Reporter.error(107 /* InvalidObjectLiteralPropertyDefinition */, { state });
    }
    if (state.currentToken !== 1835017 /* CloseBrace */) {
      consume(state, 1572875 /* Comma */);
    }
  }
  consume(state, 1835017 /* CloseBrace */);
  state.assignable = false;
  return new LiteralObject(keys, values);
}
/**
 * parseTemplateLiteralExpression
 * https://tc39.github.io/ecma262/#prod-Literal
 *
 * LiteralTemplate :
 *   NoSubstitutionTemplate
 *   TemplateHead
 *
 * NoSubstitutionTemplate :
 *   ` TemplateCharacters(opt) `
 *
 * TemplateHead :
 *   ` TemplateCharacters(opt) ${
 *
 * TemplateSubstitutionTail :
 *   TemplateMiddle
 *   TemplateTail
 *
 * TemplateMiddle :
 *   } TemplateCharacters(opt) ${
 *
 * TemplateTail :
 *   } TemplateCharacters(opt) `
 *
 * TemplateCharacters :
 *   TemplateCharacter TemplateCharacters(opt)
 *
 * TemplateCharacter :
 *   $ [lookahead ≠ {]
 *   \ EscapeSequence
 *   SourceCharacter (but not one of ` or \ or $)
 */
function parseTemplate(state, access, result, tagged) {
  const cooked = [state.tokenValue];
  //const raw = [state.tokenRaw];
  consume(state, 540714 /* TemplateContinuation */);
  const expressions = [parse(state, access, 62 /* Assign */)];
  while ((state.currentToken = scanTemplateTail(state)) !== 540713 /* TemplateTail */) {
    cooked.push(state.tokenValue);
    // if (tagged) {
    //   raw.push(state.tokenRaw);
    // }
    consume(state, 540714 /* TemplateContinuation */);
    expressions.push(parse(state, access, 62 /* Assign */));
  }
  cooked.push(state.tokenValue);
  state.assignable = false;
  if (tagged) {
    //raw.push(state.tokenRaw);
    nextToken(state);
    return new LiteralTemplate(cooked, expressions, cooked, result);
  }
  else {
    nextToken(state);
    return new LiteralTemplate(cooked, expressions);
  }
}
function nextToken(state) {
  while (state.index < state.length) {
    state.startIndex = state.index;
    if ((state.currentToken = CharScanners[state.currentChar](state)) !== null) { // a null token means the character must be skipped
      return;
    }
  }
  state.currentToken = 1572864 /* EOF */;
}
function nextChar(state) {
  return state.currentChar = state.input.charCodeAt(++state.index);
}
function scanIdentifier(state) {
  // run to the next non-idPart
  while (IdParts[nextChar(state)])
    ;
  return KeywordLookup[state.tokenValue = state.tokenRaw] || 1024 /* Identifier */;
}
function scanNumber(state, isFloat) {
  if (isFloat) {
    state.tokenValue = 0;
  }
  else {
    state.tokenValue = state.currentChar - 48 /* Zero */;
    while (nextChar(state) <= 57 /* Nine */ && state.currentChar >= 48 /* Zero */) {
      state.tokenValue = state.tokenValue * 10 + state.currentChar - 48 /* Zero */;
    }
  }
  if (isFloat || state.currentChar === 46 /* Dot */) {
    // isFloat (coming from the period scanner) means the period was already skipped
    if (!isFloat) {
      isFloat = true;
      nextChar(state);
      if (state.index >= state.length) {
        // a trailing period is valid javascript, so return here to prevent creating a NaN down below
        return 8192 /* NumericLiteral */;
      }
    }
    // note: this essentially make member expressions on numeric literals valid;
    // this makes sense to allow since they're always stored in variables, and they can legally be evaluated
    // this would be consistent with declaring a literal as a normal variable and performing an operation on that
    const current = state.currentChar;
    if (current > 57 /* Nine */ || current < 48 /* Zero */) {
      state.currentChar = state.input.charCodeAt(--state.index);
      return 8192 /* NumericLiteral */;
    }
    const start = state.index;
    let value = state.currentChar - 48 /* Zero */;
    while (nextChar(state) <= 57 /* Nine */ && state.currentChar >= 48 /* Zero */) {
      value = value * 10 + state.currentChar - 48 /* Zero */;
    }
    state.tokenValue = state.tokenValue + value / 10 ** (state.index - start);

    if (state.currentChar === /*e*/0x65 || state.currentChar === /*E*/0x45) {
      const start = state.index;

      nextChar(state);
      if (state.currentChar === /*-*/0x2D || state.currentChar === /*+*/0x2B) {
        nextChar(state);
      }

      if (!(state.currentChar >= /*0*/0x30 && state.currentChar <= /*9*/0x39)) {
        state.index = start;
        this.err('Invalid exponent');
      }
      while (nextChar(state) <= /*9*/0x39 && state.currentChar >= /*0*/0x30) { } // eslint-disable-line no-empty
      state.tokenValue = parseFloat(state.tokenRaw);
    }
  }
  // in the rare case that we go over this number, re-parse the number with the (slower) native number parsing,
  // to ensure consistency with the spec
  if (state.tokenValue > Number.MAX_SAFE_INTEGER) {
    if (isFloat) {
      state.tokenValue = parseFloat(state.tokenRaw);
    }
    else {
      state.tokenValue = parseInt(state.tokenRaw, 10);
    }
  }
  return 8192 /* NumericLiteral */;
}
function scanString(state) {
  const quote = state.currentChar;
  nextChar(state); // Skip initial quote.
  let unescaped = 0;
  const buffer = new Array();
  let marker = state.index;
  while (state.currentChar !== quote) {
    if (state.currentChar === 92 /* Backslash */) {
      buffer.push(state.input.slice(marker, state.index));
      nextChar(state);
      unescaped = unescapeCode(state.currentChar);
      nextChar(state);
      buffer.push(String.fromCharCode(unescaped));
      marker = state.index;
    }
    else if (state.index >= state.length) {
      throw Reporter.error(108 /* UnterminatedQuote */, { state });
    }
    else {
      nextChar(state);
    }
  }
  const last = state.input.slice(marker, state.index);
  nextChar(state); // Skip terminating quote.
  // Compute the unescaped string value.
  buffer.push(last);
  const unescapedStr = buffer.join('');
  state.tokenValue = unescapedStr;
  return 4096 /* StringLiteral */;
}
function scanTemplate(state) {
  let tail = true;
  let result = '';
  while (nextChar(state) !== 96 /* Backtick */) {
    if (state.currentChar === 36 /* Dollar */) {
      if ((state.index + 1) < state.length && state.input.charCodeAt(state.index + 1) === 123 /* OpenBrace */) {
        state.index++;
        tail = false;
        break;
      }
      else {
        result += '$';
      }
    }
    else if (state.currentChar === 92 /* Backslash */) {
      result += String.fromCharCode(unescapeCode(nextChar(state)));
    }
    else {
      if (state.index >= state.length) {
        throw Reporter.error(109 /* UnterminatedTemplate */, { state });
      }
      result += String.fromCharCode(state.currentChar);
    }
  }
  nextChar(state);
  state.tokenValue = result;
  if (tail) {
    return 540713 /* TemplateTail */;
  }
  return 540714 /* TemplateContinuation */;
}
function scanTemplateTail(state) {
  if (state.index >= state.length) {
    throw Reporter.error(109 /* UnterminatedTemplate */, { state });
  }
  state.index--;
  return scanTemplate(state);
}
 /** Throw error (defaults to unexpected token if no message provided) */
function err(state, message = `Unexpected token ${state.tokenRaw}`, column = state.startIndex) {
  throw new Error(`Parser Error: ${message} at column ${column} in expression [${state.input}]`);
}
function consumeOpt(state, token) {
  // tslint:disable-next-line:possible-timing-attack
  if (state.currentToken === token) {
    nextToken(state);
    return true;
  }
  return false;
}
function consume(state, token) {
  // tslint:disable-next-line:possible-timing-attack
  if (state.currentToken === token) {
    nextToken(state);
  }
  else {
    throw Reporter.error(110 /* MissingExpectedToken */, { state, expected: token });
  }
}
function unescapeCode(code) {
  switch (code) {
    case 98 /* LowerB */: return 8 /* Backspace */;
    case 116 /* LowerT */: return 9 /* Tab */;
    case 110 /* LowerN */: return 10 /* LineFeed */;
    case 118 /* LowerV */: return 11 /* VerticalTab */;
    case 102 /* LowerF */: return 12 /* FormFeed */;
    case 114 /* LowerR */: return 13 /* CarriageReturn */;
    case 34 /* DoubleQuote */: return 34 /* DoubleQuote */;
    case 39 /* SingleQuote */: return 39 /* SingleQuote */;
    case 92 /* Backslash */: return 92 /* Backslash */;
    default: return code;
  }
}
/**
 * Array for mapping tokens to token values. The indices of the values
 * correspond to the token bits 0-38.
 * For this to work properly, the values in the array must be kept in
 * the same order as the token bits.
 * Usage: TokenValues[token & Token.Type]
 */
const TokenValues = [
  $false, $true, $null, $undefined, '$this', '$parent',
  '(', '{', '.', '}', ')', ',', '[', ']', ':', '?', '\'', '"',
  '&', '|', '||', '&&', '==', '!=', '===', '!==', '<', '>',
  '<=', '>=', 'in', 'instanceof', '+', '-', 'typeof', 'void', '*', '%', '/', '=', '!',
  540713 /* TemplateTail */, 540714 /* TemplateContinuation */,
  'of'
];
const KeywordLookup = Object.create(null);
KeywordLookup.true = 2049 /* TrueKeyword */;
KeywordLookup.null = 2050 /* NullKeyword */;
KeywordLookup.false = 2048 /* FalseKeyword */;
KeywordLookup.undefined = 2051 /* UndefinedKeyword */;
KeywordLookup.$this = 3076 /* ThisScope */;
KeywordLookup.$parent = 3077 /* ParentScope */;
KeywordLookup.in = 1640798 /* InKeyword */;
KeywordLookup.instanceof = 1640799 /* InstanceOfKeyword */;
KeywordLookup.typeof = 34850 /* TypeofKeyword */;
KeywordLookup.void = 34851 /* VoidKeyword */;
KeywordLookup.of = 1051179 /* OfKeyword */;
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
  IdStart: /*IdentifierStart*/ [0x24, 0, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B, 0xAA, 0, 0xBA, 0, 0xC0, 0xD7, 0xD8, 0xF7, 0xF8, 0x2B9, 0x2E0, 0x2E5, 0x1D00, 0x1D26, 0x1D2C, 0x1D5D, 0x1D62, 0x1D66, 0x1D6B, 0x1D78, 0x1D79, 0x1DBF, 0x1E00, 0x1F00, 0x2071, 0, 0x207F, 0, 0x2090, 0x209D, 0x212A, 0x212C, 0x2132, 0, 0x214E, 0, 0x2160, 0x2189, 0x2C60, 0x2C80, 0xA722, 0xA788, 0xA78B, 0xA7AF, 0xA7B0, 0xA7B8, 0xA7F7, 0xA800, 0xAB30, 0xAB5B, 0xAB5C, 0xAB65, 0xFB00, 0xFB07, 0xFF21, 0xFF3B, 0xFF41, 0xFF5B],
  Digit: /*DecimalNumber*/ [0x30, 0x3A],
  Skip: /*Skippable*/ [0, 0x21, 0x7F, 0xA1]
};
/**
 * Decompress the ranges into an array of numbers so that the char code
 * can be used as an index to the lookup
 */
function decompress(lookup, $set, compressed, value) {
  const rangeCount = compressed.length;
  for (let i = 0; i < rangeCount; i += 2) {
    const start = compressed[i];
    let end = compressed[i + 1];
    end = end > 0 ? end : start + 1;
    if (lookup) {
      lookup.fill(value, start, end);
    }
    if ($set) {
      for (let ch = start; ch < end; ch++) {
        $set.add(ch);
      }
    }
  }
}
// CharFuncLookup functions
function returnToken(token) {
  return s => {
    nextChar(s);
    return token;
  };
}
const unexpectedCharacter = s => {
  throw Reporter.error(111 /* UnexpectedCharacter */, { state: s });
};
unexpectedCharacter.notMapped = true;
// ASCII IdentifierPart lookup
const AsciiIdParts = new Set();
decompress(null, AsciiIdParts, codes.AsciiIdPart, true);
// IdentifierPart lookup
const IdParts = new Uint8Array(0xFFFF);
// tslint:disable-next-line:no-any
decompress(IdParts, null, codes.IdStart, 1);
// tslint:disable-next-line:no-any
decompress(IdParts, null, codes.Digit, 1);
// Character scanning function lookup
const CharScanners = new Array(0xFFFF);
CharScanners.fill(unexpectedCharacter, 0, 0xFFFF);
decompress(CharScanners, null, codes.Skip, s => {
  nextChar(s);
  return null;
});
decompress(CharScanners, null, codes.IdStart, scanIdentifier);
decompress(CharScanners, null, codes.Digit, s => scanNumber(s, false));
CharScanners[34 /* DoubleQuote */] =
  CharScanners[39 /* SingleQuote */] = s => {
    return scanString(s);
  };
CharScanners[96 /* Backtick */] = s => {
  return scanTemplate(s);
};
// !, !=, !==
CharScanners[33 /* Exclamation */] = s => {
  if (nextChar(s) !== 61 /* Equals */) {
    return 32808 /* Exclamation */;
  }
  if (nextChar(s) !== 61 /* Equals */) {
    return 1638679 /* ExclamationEquals */;
  }
  nextChar(s);
  return 1638681 /* ExclamationEqualsEquals */;
};
// =, ==, ===
CharScanners[61 /* Equals */] = s => {
  if (nextChar(s) !== 61 /* Equals */) {
    return 1048615 /* Equals */;
  }
  if (nextChar(s) !== 61 /* Equals */) {
    return 1638678 /* EqualsEquals */;
  }
  nextChar(s);
  return 1638680 /* EqualsEqualsEquals */;
};
// &, &&
CharScanners[38 /* Ampersand */] = s => {
  if (nextChar(s) !== 38 /* Ampersand */) {
    return 1572880 /* Ampersand */;
  }
  nextChar(s);
  return 1638613 /* AmpersandAmpersand */;
};
// |, ||
CharScanners[124 /* Bar */] = s => {
  if (nextChar(s) !== 124 /* Bar */) {
    return 1572883 /* Bar */;
  }
  nextChar(s);
  return 1638548 /* BarBar */;
};
// .
CharScanners[46 /* Dot */] = s => {
  if (nextChar(s) <= 57 /* Nine */ && s.currentChar >= 48 /* Zero */) {
    return scanNumber(s, true);
  }
  return 16392 /* Dot */;
};
// <, <=
CharScanners[60 /* LessThan */] = s => {
  if (nextChar(s) !== 61 /* Equals */) {
    return 1638746 /* LessThan */;
  }
  nextChar(s);
  return 1638748 /* LessThanEquals */;
};
// >, >=
CharScanners[62 /* GreaterThan */] = s => {
  if (nextChar(s) !== 61 /* Equals */) {
    return 1638747 /* GreaterThan */;
  }
  nextChar(s);
  return 1638749 /* GreaterThanEquals */;
};
CharScanners[37 /* Percent */] = returnToken(1638885 /* Percent */);
CharScanners[40 /* OpenParen */] = returnToken(671750 /* OpenParen */);
CharScanners[41 /* CloseParen */] = returnToken(1835018 /* CloseParen */);
CharScanners[42 /* Asterisk */] = returnToken(1638884 /* Asterisk */);
CharScanners[43 /* Plus */] = returnToken(623008 /* Plus */);
CharScanners[44 /* Comma */] = returnToken(1572875 /* Comma */);
CharScanners[45 /* Minus */] = returnToken(623009 /* Minus */);
CharScanners[47 /* Slash */] = returnToken(1638886 /* Slash */);
CharScanners[58 /* Colon */] = returnToken(1572878 /* Colon */);
CharScanners[63 /* Question */] = returnToken(1572879 /* Question */);
CharScanners[91 /* OpenBracket */] = returnToken(671756 /* OpenBracket */);
CharScanners[93 /* CloseBracket */] = returnToken(1835021 /* CloseBracket */);
CharScanners[123 /* OpenBrace */] = returnToken(131079 /* OpenBrace */);
CharScanners[125 /* CloseBrace */] = returnToken(1835017 /* CloseBrace */);
