import './setup';
import { AccessKeyed, AccessMember, AccessScope, AccessThis,
  Assign, Binary, BindingBehavior, CallFunction,
  CallMember, CallScope, Conditional,
  LiteralArray, LiteralObject, LiteralPrimitive, LiteralTemplate, LiteralString,
  Unary, ValueConverter } from '../src/ast';
import { parseCore as parse } from '../src/parser';
import { latin1IdentifierStartChars, latin1IdentifierPartChars, otherBMPIdentifierPartChars } from './unicode';
import { Serializer } from './serializer';

/* eslint-disable no-loop-func, no-floating-decimal, key-spacing, new-cap, quotes, comma-spacing, indent, blocks, dot-notation */

export function verifyASTEqual(actual, expected, errors, path) {
  if (expected === null) {
    if (actual !== null) {
      expect(actual).toBe(null);
    }
  } else if (actual === null) {
    const expectedSerialized = Serializer.serialize(expected);
    if (actual !== expectedSerialized) {
      throw new Error(`expected:\n${expectedSerialized}\nbut got:\nnull`);
    }
    expect(actual).toBe(expectedSerialized);
  } else {
    const expectedSerialized = Serializer.serialize(expected);
    //const expectedUnparsed = Unparser.unparse(expected);
    const actualSerialized = Serializer.serialize(actual);
    //const actualUnparsed = Unparser.unparse(actual);
    if (actualSerialized !== expectedSerialized) {
      throw new Error(`expected:\n${expectedSerialized}\nbut got:\n${actualSerialized}`);
    }
    // if (actualUnparsed !== expectedUnparsed) {
    //   expect(actualUnparsed).to.equal(expectedUnparsed);
    // }
  }
}

const binaryMultiplicative = ['*', '%', '/'];
const binaryAdditive = ['+', '-'];
const binaryRelational = [
  ['<', '<'],
  ['<=', '<='],
  ['>', '>'],
  ['>=', '>='],
  ['in', ' in '],
  ['instanceof', ' instanceof ']
];
const binaryEquality = ['==', '!=', '===', '!=='];


const $false = new LiteralPrimitive(false);
const $true = new LiteralPrimitive(true);
const $null = new LiteralPrimitive(null);
const $undefined = new LiteralPrimitive(undefined);
const $str = new LiteralString('');
const $tpl = new LiteralTemplate([''], []);
const $arr = new LiteralArray([]);
const $obj = new LiteralObject([], []);
const $this = new AccessThis(0);
const $parent = new AccessThis(1);

const $a = new AccessScope('a');
const $b = new AccessScope('b');
const $c = new AccessScope('c');
const $num0 = new LiteralPrimitive(0);
const $num1 = new LiteralPrimitive(1);

const codes = {
  //SyntaxError
  InvalidExpressionStart: 'Code 100',
  UnconsumedToken: 'Code 101',
  DoubleDot: 'Code 102',
  InvalidMemberExpression: 'Code 103',
  UnexpectedEndOfExpression: 'Code 104',
  ExpectedIdentifier: 'Code 105',
  InvalidForDeclaration: 'Code 106',
  LiteralInvalidObjectPropertyDefinition: 'Code 107',
  UnterminatedQuote: 'Code 108',
  UnterminatedTemplate: 'Code 109',
  MissingExpectedToken: 'Code 110',
  UnexpectedCharacter: 'Code 111',

  //SemanticError
  NotAssignable: 'Code 150',
  UnexpectedForOf: 'Code 151'
};

// function parse(expr) {
//   return new Parser().parse(expr);
// }


function verifyResultOrError(expr, expected, expectedMsg) {
  let error = null;
  let actual = null;
  try {
    actual = parse(expr);
  } catch (e) {
    error = e;
  }
  if (expectedMsg === null || expectedMsg === undefined) {
    if (error === null) {
      verifyASTEqual(actual, expected);
    } else {
      throw new Error(`Expected expression "${expr}" to parse successfully, but it threw "${error.message}"`);
    }
  } else {
    if (error === null) {
      throw new Error(`Expected expression "${expr}" to throw "${expectedMsg}", but no error was thrown`);
    } else {
      // if (error.message !== expectedMsg) {
      //   throw new Error(`Expected expression "${expr}" to throw "${expectedMsg}", but got "${error.message}" instead`);
      // }
    }
  }
}


// Note: we could loop through all generated tests by picking SimpleIsBindingBehaviorList and ComplexIsBindingBehaviorList,
// but we're separating them out to make the test suites more granular for debugging and reporting purposes
describe('ExpressionParser', () => {
  // #region Simple lists

  // The goal here is to pre-create arrays of string+ast expression pairs that each represent a unique
  // path taken in the expression parser. We're creating them here at the module level simply to speed up
  // the tests. They're never modified, so it's safe to reuse the same expression for multiple tests.

  // They're called Simple..Lists because we're not creating any combinations / nested expressions yet.
  // Instead, these lists will be the inputs for combinations further down below.

  // Note: we're more or less following the same ordering here as the tc39 spec description comments;
  // those comments (https://tc39.github.io/... in expression-parser.ts) are partial extracts from the spec
  // with mostly just omissions; the only modification is the special parsing rules related to AccessThis


  // 1. parsePrimaryExpression.this
  const AccessThisList = [
    [`$this`,             $this],
    [`$parent`,           $parent],
    [`$parent.$parent`,   new AccessThis(2)]
  ];
  // 2. parsePrimaryExpression.IdentifierName
  const AccessScopeList = [
    ...AccessThisList.map(([input, expr]) => [`${input}.a`, new AccessScope('a', expr.ancestor)]),
    [`$this.$parent`,     new AccessScope('$parent')],
    [`$parent.$this`,     new AccessScope('$this', 1)],
    [`a`,                 $a]
  ];
  // 3. parsePrimaryExpression.Literal
  const LiteralSimpleStringList = [
    [`''`,                $str],
    [`""`,                $str]
  ];
  const LiteralSimpleNumberList = [
    [`1`,                 $num1],
    [`1.1`,               new LiteralPrimitive(1.1)],
    [`.1`,                new LiteralPrimitive(.1)],
    [`0.1`,               new LiteralPrimitive(.1)]
  ];
  const LiteralKeywordPrimitiveList = [
    [`undefined`,         $undefined],
    [`null`,              $null],
    [`true`,              $true],
    [`false`,             $false]
  ];
  // concatenation of 3.
  const LiteralSimplePrimitiveList = [
    ...LiteralSimpleStringList,
    ...LiteralSimpleNumberList,
    ...LiteralKeywordPrimitiveList
  ];

  // 4. parsePrimaryExpression.LiteralArray
  const LiteralSimpleArrayList = [
    [`[]`,                $arr]
  ];
  // 5. parsePrimaryExpression.LiteralObject
  const LiteralSimpleObjectList = [
    [`{}`,                $obj]
  ];
  // 6. parsePrimaryExpression.LiteralTemplate
  const LiteralSimpleTemplateList = [
    [`\`\``,              $tpl],
    [`\`\${a}\``,         new LiteralTemplate(['', ''], [$a])]
  ];
  // concatenation of 3., 4., 5., 6.
  const LiteralSimpleList = [
    ...LiteralSimplePrimitiveList,
    ...LiteralSimpleTemplateList,
    ...LiteralSimpleArrayList,
    ...LiteralSimpleObjectList
  ];
  // 7. parsePrimaryExpression.ParenthesizedExpression
  // Note: this is simply one of each precedence group, except for Primary because
  // parenthesized and primary are already from the same precedence group
  const SimpleParenthesizedList = [
    [`(a[b])`,            new AccessKeyed($a, $b)],
    [`(a.b)`,             new AccessMember($a, 'b')],
    [`(a\`\`)`,           new LiteralTemplate([''], [], [''], $a)],
    [`($this())`,         new CallFunction($this, [])],
    [`(a())`,             new CallScope('a', [])],
    [`(!a)`,              new Unary('!', $a)],
    [`(a+b)`,             new Binary('+', $a, $b)],
    [`(a?b:c)`,           new Conditional($a, $b, new AccessScope('c'))],
    [`(a=b)`,             new Assign($a, $b)]
  ];
  // concatenation of 1 through 7 (all Primary expressions)
  // This forms the group Precedence.Primary
  const SimplePrimaryList = [
    ...AccessThisList,
    ...AccessScopeList,
    ...LiteralSimpleList,
    ...SimpleParenthesizedList
  ];
  // 2. parseMemberExpression.MemberExpression [ AssignmentExpression ]
  const SimpleAccessKeyedList = [
    ...SimplePrimaryList
      .map(([input, expr]) => [`${input}[b]`, new AccessKeyed(expr, $b)])
  ];
  // 3. parseMemberExpression.MemberExpression . IdentifierName
  const SimpleAccessMemberList = [
    ...[...AccessScopeList, ...LiteralSimpleList]
      .map(([input, expr]) => [`${input}.b`, new AccessMember(expr, 'b')])
  ];
  // 4. parseMemberExpression.MemberExpression LiteralTemplate
  const SimpleTaggedTemplateList = [
    ...AccessScopeList
      .map(([input, expr]) => [`${input}\`\``, new LiteralTemplate([''], [], [''], expr)]),

    ...AccessScopeList
      .map(([input, expr]) => [`${input}\`\${a}\``, new LiteralTemplate(['', ''], [$a], ['', ''], expr)])
  ];
  // 1. parseCallExpression.MemberExpression Arguments (this one doesn't technically fit the spec here)
  const SimpleCallFunctionList = [
    ...[...AccessThisList, ...LiteralSimpleList]
      .map(([input, expr]) => [`${input}()`, new CallFunction(expr, [])])
  ];
  // 2. parseCallExpression.MemberExpression Arguments
  const SimpleCallScopeList = [
    ...[...AccessScopeList]
      .map(([input, expr]) => [`${input}()`, new CallScope(expr.name, [], expr.ancestor)])
  ];
  // 3. parseCallExpression.MemberExpression Arguments
  const SimpleCallMemberList = [
    ...[...AccessScopeList, ...LiteralSimpleList]
      .map(([input, expr]) => [`${input}.b()`, new CallMember(expr, 'b', [])])
  ];
  // concatenation of 1-3 of MemberExpression and 1-3 of CallExpression
  const SimpleLeftHandSideList = [
    ...SimpleAccessKeyedList,
    ...SimpleAccessMemberList,
    ...SimpleTaggedTemplateList,
    ...SimpleCallFunctionList,
    ...SimpleCallScopeList,
    ...SimpleCallMemberList
  ];

  // concatenation of Primary and Member+CallExpression
  // This forms the group Precedence.LeftHandSide
  // used only for testing complex Unary expressions
  const SimpleIsLeftHandSideList = [
    ...SimplePrimaryList,
    ...SimpleLeftHandSideList
  ];

  // parseUnaryExpression (this is actually at the top in the parser due to the order in which expressions must be parsed)
  const SimpleUnaryList = [
    [`!$1`, new Unary('!', new AccessScope('$1'))],
    [`-$2`, new Unary('-', new AccessScope('$2'))],
    [`+$3`, new Unary('+', new AccessScope('$3'))],
    [`void $4`, new Unary('void', new AccessScope('$4'))],
    [`typeof $5`, new Unary('typeof', new AccessScope('$5'))]
  ];
  // concatenation of Unary + LeftHandSide
  // This forms the group Precedence.LeftHandSide and includes Precedence.Unary
  const SimpleIsUnaryList = [
    ...SimpleIsLeftHandSideList,
    ...SimpleUnaryList
  ];

  // This forms the group Precedence.Multiplicative
  const SimpleMultiplicativeList = [
    [`$6*$7`, new Binary('*', new AccessScope('$6'), new AccessScope('$7'))],
    [`$8%$9`, new Binary('%', new AccessScope('$8'), new AccessScope('$9'))],
    [`$10/$11`, new Binary('/', new AccessScope('$10'), new AccessScope('$11'))]
  ];
  const SimpleIsMultiplicativeList = [
    ...SimpleIsUnaryList,
    ...SimpleMultiplicativeList
  ];

  // This forms the group Precedence.Additive
  const SimpleAdditiveList = [
    [`$12+$13`, new Binary('+', new AccessScope('$12'), new AccessScope('$13'))],
    [`$14-$15`, new Binary('-', new AccessScope('$14'), new AccessScope('$15'))]
  ];
  const SimpleIsAdditiveList = [
    ...SimpleIsMultiplicativeList,
    ...SimpleAdditiveList
  ];

  // This forms the group Precedence.Relational
  const SimpleRelationalList = [
    [`$16<$17`, new Binary('<', new AccessScope('$16'), new AccessScope('$17'))],
    [`$18>$19`, new Binary('>', new AccessScope('$18'), new AccessScope('$19'))],
    [`$20<=$21`, new Binary('<=', new AccessScope('$20'), new AccessScope('$21'))],
    [`$22>=$23`, new Binary('>=', new AccessScope('$22'), new AccessScope('$23'))],
    [`$24 in $25`, new Binary('in', new AccessScope('$24'), new AccessScope('$25'))],
    [`$26 instanceof $27`, new Binary('instanceof', new AccessScope('$26'), new AccessScope('$27'))]
  ];
  const SimpleIsRelationalList = [
    ...SimpleIsAdditiveList,
    ...SimpleRelationalList
  ];

  // This forms the group Precedence.Equality
  const SimpleEqualityList = [
    [`$28==$29`, new Binary('==', new AccessScope('$28'), new AccessScope('$29'))],
    [`$30!=$31`, new Binary('!=', new AccessScope('$30'), new AccessScope('$31'))],
    [`$32===$33`, new Binary('===', new AccessScope('$32'), new AccessScope('$33'))],
    [`$34!==$35`, new Binary('!==', new AccessScope('$34'), new AccessScope('$35'))]
  ];
  const SimpleIsEqualityList = [
    ...SimpleIsRelationalList,
    ...SimpleEqualityList
  ];

  // This forms the group Precedence.LogicalAND
  const SimpleLogicalANDList = [
    [`$36&&$37`, new Binary('&&', new AccessScope('$36'), new AccessScope('$37'))]
  ];
  const SimpleIsLogicalANDList = [
    ...SimpleIsEqualityList,
    ...SimpleLogicalANDList
  ];

  // This forms the group Precedence.LogicalOR
  const SimpleLogicalORList = [
    [`$38||$39`, new Binary('||', new AccessScope('$38'), new AccessScope('$39'))]
  ];
  const SimpleIsLogicalORList = [
    ...SimpleIsLogicalANDList,
    ...SimpleLogicalORList
  ];

  // This forms the group Precedence.Conditional
  const SimpleConditionalList = [
    [`a?b:c`, new Conditional($a, $b, new AccessScope('c'))]
  ];
  const SimpleIsConditionalList = [
    ...SimpleIsLogicalORList,
    ...SimpleConditionalList
  ];

  // This forms the group Precedence.Assign
  const SimpleAssignList = [
    [`a=b`, new Assign($a, $b)]
  ];
  const SimpleIsAssignList = [
    ...SimpleIsConditionalList,
    ...SimpleAssignList
  ];

  // This forms the group Precedence.Variadic
  const SimpleValueConverterList = [
    [`a|b`, new ValueConverter($a, 'b', [])],
    [`a|b:c`, new ValueConverter($a, 'b', [new AccessScope('c')])],
    [`a|b:c:d`, new ValueConverter($a, 'b', [new AccessScope('c'), new AccessScope('d')])]
  ];
  const SimpleIsValueConverterList = [
    ...SimpleIsAssignList,
    ...SimpleValueConverterList
  ];

  const SimpleBindingBehaviorList = [
    [`a&b`, new BindingBehavior($a, 'b', [])],
    [`a&b:c`, new BindingBehavior($a, 'b', [new AccessScope('c')])],
    [`a&b:c:d`, new BindingBehavior($a, 'b', [new AccessScope('c'), new AccessScope('d')])]
  ];

  const SimpleIsBindingBehaviorList = [
    ...SimpleIsValueConverterList,
    ...SimpleBindingBehaviorList
  ];

  describe('parse simple expression', () => {
    describe('parse AccessThisList', () => {
      for (const [input, expected] of AccessThisList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse AccessScopeList', () => {
      for (const [input, expected] of AccessScopeList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse LiteralSimpleStringList', () => {
      for (const [input, expected] of LiteralSimpleStringList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse LiteralSimpleNumberList', () => {
      for (const [input, expected] of LiteralSimpleNumberList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse LiteralKeywordPrimitiveList', () => {
      for (const [input, expected] of LiteralKeywordPrimitiveList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse LiteralSimpleArrayList', () => {
      for (const [input, expected] of LiteralSimpleArrayList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse LiteralSimpleObjectList', () => {
      for (const [input, expected] of LiteralSimpleObjectList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse LiteralSimpleTemplateList', () => {
      for (const [input, expected] of LiteralSimpleTemplateList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleParenthesizedList', () => {
      for (const [input, expected] of SimpleParenthesizedList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleAccessKeyedList', () => {
      for (const [input, expected] of SimpleAccessKeyedList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleAccessMemberList', () => {
      for (const [input, expected] of SimpleAccessMemberList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleTaggedTemplateList', () => {
      for (const [input, expected] of SimpleTaggedTemplateList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleCallFunctionList', () => {
      for (const [input, expected] of SimpleCallFunctionList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleCallScopeList', () => {
      for (const [input, expected] of SimpleCallScopeList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleCallMemberList', () => {
      for (const [input, expected] of SimpleCallMemberList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleUnaryList', () => {
      for (const [input, expected] of SimpleUnaryList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleMultiplicativeList', () => {
      for (const [input, expected] of SimpleMultiplicativeList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleAdditiveList', () => {
      for (const [input, expected] of SimpleAdditiveList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleRelationalList', () => {
      for (const [input, expected] of SimpleRelationalList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleEqualityList', () => {
      for (const [input, expected] of SimpleEqualityList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleLogicalANDList', () => {
      for (const [input, expected] of SimpleLogicalANDList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleLogicalORList', () => {
      for (const [input, expected] of SimpleLogicalORList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleConditionalList', () => {
      for (const [input, expected] of SimpleConditionalList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleAssignList', () => {
      for (const [input, expected] of SimpleAssignList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleValueConverterList', () => {
      for (const [input, expected] of SimpleValueConverterList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });

    describe('parse SimpleBindingBehaviorList', () => {
      for (const [input, expected] of SimpleBindingBehaviorList) {
        it(input, () => {
          verifyResultOrError(input, expected, null);
        });
      }
    });
  });

  // #endregion

  // #region Complex lists
  // This is where the fun begins :) We're now going to create large lists of combinations in order
  // to hit every possible (non-error) edge case. The fundamental edge cases are written by hand, which
  // we then supplement by mixing in the simple lists created above. This generates a fair amount of redundancy
  // in the tests, but that's a perfectly acceptable tradeoff as it will cause issues to surface that you would
  // otherwise never think of.


  // We're validating all (meaningful) strings that can be escaped and combining them
  // with normal leading and trailing strings to verify escaping works correctly in different situations
  // This array is used to verify parsing of string LiteralPrimitive, and the strings in LiteralTemplate and LiteralTemplate
  const stringEscapables = [
    [`\\\\`, `\\`],
    [`\\\``, `\``],
    [`\\'`,  `'`],
    [`\\"`,  `"`],
    [`\\f`,  `\f`],
    [`\\n`,  `\n`],
    [`\\r`,  `\r`],
    [`\\t`,  `\t`],
    [`\\b`,  `\b`],
    [`\\v`,  `\v`]
  ]
  .map(([raw, cooked]) => [
    [raw,         cooked],
    [`${raw}`,   `${cooked}`],
    [`x${raw}`,  `x${cooked}`],
    [`${raw}x`,  `${cooked}x`],
    [`x${raw}x`, `x${cooked}x`]
  ])
  .reduce((acc, cur) => acc.concat(cur));

  // Verify all string escapes, unicode characters, double and single quotes
  const LiteralComplexStringList = [
    ...[
      ['foo',                new LiteralString('foo')],
      ['äöüÄÖÜß',            new LiteralString('äöüÄÖÜß')],
      ['ಠ_ಠ',               new LiteralString('ಠ_ಠ')],
      ...stringEscapables.map(([raw, cooked]) => [raw, new LiteralString(cooked)])]
    .map(([input, expr]) => [
      [`'${input}'`, expr],
      [`"${input}"`, expr]
    ])
    .reduce((acc, cur) => acc.concat(cur))
  ];
  describe('parse LiteralComplexStringList', () => {
    for (const [input, expected] of LiteralComplexStringList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  // Verify different floating point notations and parsing numbers that are outside the "safe" integer range
  const ComplexNumberList = [
    ['9007199254740992',                                                  new LiteralPrimitive(9007199254740992)],
    ['0.9007199254740992',                                                new LiteralPrimitive(.9007199254740992)],
    ['.9007199254740992',                                                 new LiteralPrimitive(.9007199254740992)],
    ['.90071992547409929007199254740992',                                 new LiteralPrimitive(.90071992547409929007199254740992)],
    ['9007199254740992.9007199254740992',                                 new LiteralPrimitive(9007199254740992.9007199254740992)],
    ['9007199254740992.90071992547409929007199254740992',                 new LiteralPrimitive(9007199254740992.90071992547409929007199254740992)],
    ['90071992547409929007199254740992',                                  new LiteralPrimitive(90071992547409929007199254740992)],
    ['90071992547409929007199254740992.9007199254740992',                 new LiteralPrimitive(90071992547409929007199254740992.9007199254740992)],
    ['90071992547409929007199254740992.90071992547409929007199254740992', new LiteralPrimitive(90071992547409929007199254740992.90071992547409929007199254740992)]
  ];
  describe('parse ComplexNumberList', () => {
    for (const [input, expected] of ComplexNumberList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  // Verify various combinations of nested and chained parts/expressions, with/without escaped strings
  // Also combine this with the full list of SimpleIsAssign (once and twice) to validate parsing precedence of arguments
  const LiteralComplexTemplateList = [
    [`\`a\``,                       new LiteralTemplate(['a'], [])],
    [`\`\\\${a}\``,                 new LiteralTemplate(['${a}'], [])],
    [`\`$a\``,                      new LiteralTemplate(['$a'], [])],
    [`\`\${a}\${b}\``,              new LiteralTemplate(['', '', ''],                       [$a, $b])],
    [`\`a\${a}\${b}\``,             new LiteralTemplate(['a', '', ''],                      [$a, $b])],
    [`\`\${a}a\${b}\``,             new LiteralTemplate(['', 'a', ''],                      [$a, $b])],
    [`\`a\${a}a\${b}\``,            new LiteralTemplate(['a', 'a', ''],                     [$a, $b])],
    [`\`\${a}\${b}a\``,             new LiteralTemplate(['', '', 'a'],                      [$a, $b])],
    [`\`\${a}a\${b}a\``,            new LiteralTemplate(['', 'a', 'a'],                     [$a, $b])],
    [`\`a\${a}a\${b}a\``,           new LiteralTemplate(['a', 'a', 'a'],                    [$a, $b])],
    [`\`\${\`\${a}\`}\``,           new LiteralTemplate(['', ''], [new LiteralTemplate(['', ''],   [$a])])],
    [`\`\${\`a\${a}\`}\``,          new LiteralTemplate(['', ''], [new LiteralTemplate(['a', ''],  [$a])])],
    [`\`\${\`\${a}a\`}\``,          new LiteralTemplate(['', ''], [new LiteralTemplate(['', 'a'],  [$a])])],
    [`\`\${\`a\${a}a\`}\``,         new LiteralTemplate(['', ''], [new LiteralTemplate(['a', 'a'], [$a])])],
    [`\`\${\`\${\`\${a}\`}\`}\``,   new LiteralTemplate(['', ''], [new LiteralTemplate(['', ''], [new LiteralTemplate(['', ''],   [$a])])])],
    ...stringEscapables.map(([raw, cooked]) => [
      [`\`${raw}\``,                new LiteralTemplate([cooked],              [])],
      [`\`\${a}${raw}\``,           new LiteralTemplate(['', cooked],        [$a])],
      [`\`${raw}\${a}\``,           new LiteralTemplate([cooked, ''],        [$a])],
      [`\`${raw}\${a}${raw}\``,     new LiteralTemplate([cooked, cooked],    [$a])],
      [`\`\${a}${raw}\${a}\``,      new LiteralTemplate(['', cooked, ''],    [$a, $a])]
    ])
    .reduce((acc, cur) => acc.concat(cur)),
    ...SimpleIsAssignList
      .map(([input, expr]) => [`\`\${${input}}\``, new LiteralTemplate(['', ''], [expr])]),
    ...SimpleIsAssignList
      .map(([input, expr]) => [`\`\${${input}}\${${input}}\``, new LiteralTemplate(['', '', ''], [expr, expr])])
  ];
  describe('parse LiteralComplexTemplateList', () => {
    for (const [input, expected] of LiteralComplexTemplateList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  // Verify various combinations of specified and unspecified (elision) array items
  // Also combine this with the full list of SimpleIsAssign (once and twice) to validate parsing precedence of element expressions
  const LiteralComplexArrayList = [
    [`[,]`,                 new LiteralArray([$undefined, $undefined])],
    [`[,,]`,                new LiteralArray([$undefined, $undefined, $undefined])],
    [`[,,,]`,               new LiteralArray([$undefined, $undefined, $undefined, $undefined])],
    [`[a,]`,                new LiteralArray([$a, $undefined])],
    [`[a,,]`,               new LiteralArray([$a, $undefined, $undefined])],
    [`[a,a,]`,              new LiteralArray([$a, $a, $undefined])],
    [`[a,,,]`,              new LiteralArray([$a, $undefined, $undefined, $undefined])],
    [`[a,a,,]`,             new LiteralArray([$a, $a, $undefined, $undefined])],
    [`[,a]`,                new LiteralArray([$undefined, $a])],
    [`[,a,]`,               new LiteralArray([$undefined, $a, $undefined])],
    [`[,a,,]`,              new LiteralArray([$undefined, $a, $undefined, $undefined])],
    [`[,a,a,]`,             new LiteralArray([$undefined, $a, $a, $undefined])],
    [`[,,a]`,               new LiteralArray([$undefined, $undefined, $a])],
    [`[,a,a]`,              new LiteralArray([$undefined, $a, $a])],
    [`[,,a,]`,              new LiteralArray([$undefined, $undefined, $a, $undefined])],
    [`[,,,a]`,              new LiteralArray([$undefined, $undefined, $undefined, $a])],
    [`[,,a,a]`,             new LiteralArray([$undefined, $undefined, $a, $a])],
    ...SimpleIsAssignList.map(([input, expr]) => [
      [`[${input}]`,           new LiteralArray([expr])],
      [`[${input},${input}]`,  new LiteralArray([expr, expr])]
    ])
    .reduce((acc, cur) => acc.concat(cur))
  ];
  describe('parse LiteralComplexArrayList', () => {
    for (const [input, expected] of LiteralComplexArrayList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  // Verify various combinations of shorthand, full, string and number property definitions
  // Also combine this with the full list of SimpleIsAssign (once and twice) to validate parsing precedence of value expressions
  const LiteralComplexObjectList = [
    [`{a}`,                 new LiteralObject(['a'], [$a])],
    [`{a:a}`,               new LiteralObject(['a'], [$a])],
    [`{'a':a}`,             new LiteralObject(['a'], [$a])],
    [`{"a":a}`,             new LiteralObject(['a'], [$a])],
    [`{1:a}`,               new LiteralObject([1], [$a])],
    [`{'1':a}`,             new LiteralObject(['1'], [$a])],
    [`{"1":a}`,             new LiteralObject(['1'], [$a])],
    [`{'a':a,b}`,           new LiteralObject(['a', 'b'], [$a, $b])],
    [`{"a":a,b}`,           new LiteralObject(['a', 'b'], [$a, $b])],
    [`{1:a,b}`,             new LiteralObject([1, 'b'], [$a, $b])],
    [`{'1':a,b}`,           new LiteralObject(['1', 'b'], [$a, $b])],
    [`{"1":a,b}`,           new LiteralObject(['1', 'b'], [$a, $b])],
    [`{a,'b':b}`,           new LiteralObject(['a', 'b'], [$a, $b])],
    [`{a,"b":b}`,           new LiteralObject(['a', 'b'], [$a, $b])],
    [`{a,1:b}`,             new LiteralObject(['a', 1], [$a, $b])],
    [`{a,'1':b}`,           new LiteralObject(['a', '1'], [$a, $b])],
    [`{a,"1":b}`,           new LiteralObject(['a', '1'], [$a, $b])],
    [`{a,b}`,               new LiteralObject(['a', 'b'], [$a, $b])],
    [`{a:a,b}`,             new LiteralObject(['a', 'b'], [$a, $b])],
    [`{a,b:b}`,             new LiteralObject(['a', 'b'], [$a, $b])],
    [`{a:a,b,c}`,           new LiteralObject(['a', 'b', 'c'], [$a, $b, $c])],
    [`{a,b:b,c}`,           new LiteralObject(['a', 'b', 'c'], [$a, $b, $c])],
    [`{a,b,c:c}`,           new LiteralObject(['a', 'b', 'c'], [$a, $b, $c])],
    [`{a:a,b:b,c}`,         new LiteralObject(['a', 'b', 'c'], [$a, $b, $c])],
    [`{a:a,b,c:c}`,         new LiteralObject(['a', 'b', 'c'], [$a, $b, $c])],
    [`{a,b:b,c:c}`,         new LiteralObject(['a', 'b', 'c'], [$a, $b, $c])],
    ...SimpleIsAssignList.map(([input, expr]) => [
      [`{a:${input}}`,            new LiteralObject(['a'], [expr])],
      [`{a:${input},b:${input}}`, new LiteralObject(['a', 'b'], [expr, expr])]
    ])
    .reduce((acc, cur) => acc.concat(cur))
  ];
  describe('parse LiteralComplexObjectList', () => {
    for (const [input, expected] of LiteralComplexObjectList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexAccessKeyedList = [
    ...SimpleIsAssignList
      .map(([input, expr]) => [`a[${input}]`, new AccessKeyed($a, expr)])
  ];
  describe('parse ComplexAccessKeyedList', () => {
    for (const [input, expected] of ComplexAccessKeyedList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexAccessMemberList = [
    ...[
      ...LiteralKeywordPrimitiveList,
      [`typeof`],
      [`void`],
      [`$this`],
      [`$parent`],
      [`in`],
      [`instanceof`],
      [`of`]]
      .map(([input]) => [`a.${input}`, new AccessMember($a, input)])
  ];
  describe('parse ComplexAccessMemberList', () => {
    for (const [input, expected] of ComplexAccessMemberList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexTaggedTemplateList = [
    [`a\`a\``,                       new LiteralTemplate(['a'],           [],                                                                       ['a'],             $a)],
    [`a\`\\\${a}\``,                 new LiteralTemplate(['${a}'],        [],                                                                       ['${a}'],          $a)],
    [`a\`$a\``,                      new LiteralTemplate(['$a'],          [],                                                                       ['$a'],            $a)],
    [`a\`\${b}\${c}\``,              new LiteralTemplate(['', '', ''],    [$b, $c],                                                                 ['', '', ''],      $a)],
    [`a\`a\${b}\${c}\``,             new LiteralTemplate(['a', '', ''],   [$b, $c],                                                                 ['a', '', ''],     $a)],
    [`a\`\${b}a\${c}\``,             new LiteralTemplate(['', 'a', ''],   [$b, $c],                                                                 ['', 'a', ''],     $a)],
    [`a\`a\${b}a\${c}\``,            new LiteralTemplate(['a', 'a', ''],  [$b, $c],                                                                 ['a', 'a', ''],    $a)],
    [`a\`\${b}\${c}a\``,             new LiteralTemplate(['', '', 'a'],   [$b, $c],                                                                 ['', '', 'a'],     $a)],
    [`a\`\${b}a\${c}a\``,            new LiteralTemplate(['', 'a', 'a'],  [$b, $c],                                                                 ['', 'a', 'a'],    $a)],
    [`a\`a\${b}a\${c}a\``,           new LiteralTemplate(['a', 'a', 'a'], [$b, $c],                                                                 ['a', 'a', 'a'],   $a)],
    [`a\`\${\`\${a}\`}\``,           new LiteralTemplate(['', ''],        [new LiteralTemplate(['', ''],   [$a])],                                  ['', ''],          $a)],
    [`a\`\${\`a\${a}\`}\``,          new LiteralTemplate(['', ''],        [new LiteralTemplate(['a', ''],  [$a])],                                  ['', ''],          $a)],
    [`a\`\${\`\${a}a\`}\``,          new LiteralTemplate(['', ''],        [new LiteralTemplate(['', 'a'],  [$a])],                                  ['', ''],          $a)],
    [`a\`\${\`a\${a}a\`}\``,         new LiteralTemplate(['', ''],        [new LiteralTemplate(['a', 'a'], [$a])],                                  ['', ''],          $a)],
    [`a\`\${\`\${\`\${a}\`}\`}\``,   new LiteralTemplate(['', ''],        [new LiteralTemplate(['', ''], [new LiteralTemplate(['', ''],   [$a])])], ['', ''],          $a)],
    ...stringEscapables.map(([raw, cooked]) => [
      [`a\`${raw}\``,                new LiteralTemplate([cooked],         [],       [cooked],         $a)],
      [`a\`\${a}${raw}\``,           new LiteralTemplate(['', cooked],     [$a],     ['', cooked],     $a)],
      [`a\`${raw}\${a}\``,           new LiteralTemplate([cooked, ''],     [$a],     [cooked, ''],     $a)],
      [`a\`${raw}\${a}${raw}\``,     new LiteralTemplate([cooked, cooked], [$a],     [cooked, cooked], $a)],
      [`a\`\${a}${raw}\${a}\``,      new LiteralTemplate(['', cooked, ''], [$a, $a], ['', cooked, ''], $a)]
    ])
    .reduce((acc, cur) => acc.concat(cur)),
    ...SimpleIsAssignList
      .map(([input, expr]) => [`a\`\${${input}}\``,             new LiteralTemplate(['', ''],     [expr],       ['', ''],     $a)]),
    ...SimpleIsAssignList
      .map(([input, expr]) => [`a\`\${${input}}\${${input}}\``, new LiteralTemplate(['', '', ''], [expr, expr], ['', '', ''], $a)])
  ];
  describe('parse ComplexTaggedTemplateList', () => {
    for (const [input, expected] of ComplexTaggedTemplateList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexCallFunctionList = [
    ...SimpleIsAssignList
      .map(([input, expr]) => [`$this(${input})`, new CallFunction($this, [expr])]),
    ...SimpleIsAssignList
      .map(([input, expr]) => [`$this(${input},${input})`, new CallFunction($this, [expr, expr])])
  ];
  describe('parse ComplexCallFunctionList', () => {
    for (const [input, expected] of ComplexCallFunctionList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexCallScopeList = [
    ...SimpleIsAssignList
      .map(([input, expr]) => [`a(${input})`, new CallScope('a', [expr])]),
    ...SimpleIsAssignList
      .map(([input, expr]) => [`a(${input},${input})`, new CallScope('a', [expr, expr])])
  ];
  describe('parse ComplexCallScopeList', () => {
    for (const [input, expected] of ComplexCallScopeList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexCallMemberList = [
    ...SimpleIsAssignList
      .map(([input, expr]) => [`a.b(${input})`, new CallMember($a, 'b', [expr])]),
    ...SimpleIsAssignList
      .map(([input, expr]) => [`a.b(${input},${input})`, new CallMember($a, 'b', [expr, expr])])
  ];
  describe('parse ComplexCallMemberList', () => {
    for (const [input, expected] of ComplexCallMemberList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexUnaryList = [
    ...SimpleIsLeftHandSideList
      .map(([input, expr]) => [`!${input}`, new Unary('!', expr)]),
    ...SimpleIsLeftHandSideList
      .map(([input, expr]) => [`+${input}`, new Unary('+', expr)]),
    ...SimpleIsLeftHandSideList
      .map(([input, expr]) => [`-${input}`, new Unary('-', expr)]),
    ...SimpleIsLeftHandSideList
      .map(([input, expr]) => [`void ${input}`, new Unary('void', expr)]),
    ...SimpleIsLeftHandSideList
      .map(([input, expr]) => [`typeof ${input}`, new Unary('typeof', expr)])
  ];
  describe('parse ComplexUnaryList', () => {
    for (const [input, expected] of ComplexUnaryList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  // Combine a precedence group with all precedence groups below it, the precedence group on the same
  // level, and a precedence group above it, and verify that the precedence/associativity is correctly enforced
  const ComplexMultiplicativeList = [
    ...binaryMultiplicative.map(op => [
      ...SimpleIsMultiplicativeList.map(([i1, e1]) => [`${i1}${op}a`, new Binary(op, e1, $a)]),
      ...SimpleUnaryList
        .map(([i1, e1]) => SimpleMultiplicativeList.map(([i2, e2]) => [`${i2}${op}${i1}`, new Binary(op, e2, e1)]))
        .reduce((a, b) => a.concat(b)),
      ...SimpleMultiplicativeList
        .map(([i1, e1]) => SimpleMultiplicativeList.map(([i2, e2]) => [`${i1}${op}${i2}`, new Binary(e2.operation, new Binary(op, new Binary(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
        .reduce((a, b) => a.concat(b)),
      ...SimpleAdditiveList
        .map(([i1, e1]) => SimpleMultiplicativeList.map(([i2, e2]) => [`${i1}${op}${i2}`, new Binary(e1.operation, e1.left, new Binary(e2.operation, new Binary(op, e1.right, e2.left), e2.right))]))
        .reduce((a, b) => a.concat(b))
    ]).reduce((a, b) => a.concat(b))
  ];
  describe('parse ComplexMultiplicativeList', () => {
    for (const [input, expected] of ComplexMultiplicativeList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexAdditiveList = [
    ...binaryAdditive.map(op => [
      ...SimpleIsAdditiveList.map(([i1, e1]) => [`${i1}${op}a`, new Binary(op, e1, $a)]),
      ...SimpleMultiplicativeList
        .map(([i1, e1]) => SimpleAdditiveList.map(([i2, e2]) => [`${i2}${op}${i1}`, new Binary(op, e2, e1)]))
        .reduce((a, b) => a.concat(b)),
      ...SimpleAdditiveList
        .map(([i1, e1]) => SimpleAdditiveList.map(([i2, e2]) => [`${i1}${op}${i2}`, new Binary(e2.operation, new Binary(op, new Binary(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
        .reduce((a, b) => a.concat(b)),
      ...SimpleRelationalList
        .map(([i1, e1]) => SimpleAdditiveList.map(([i2, e2]) => [`${i1}${op}${i2}`, new Binary(e1.operation, e1.left, new Binary(e2.operation, new Binary(op, e1.right, e2.left), e2.right))]))
        .reduce((a, b) => a.concat(b))
    ]).reduce((a, b) => a.concat(b))
  ];
  describe('parse ComplexAdditiveList', () => {
    for (const [input, expected] of ComplexAdditiveList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexRelationalList = [
    ...binaryRelational.map(([op, txt]) => [
      ...SimpleIsRelationalList.map(([i1, e1]) => [`${i1}${txt}a`, new Binary(op, e1, $a)]),
      ...SimpleAdditiveList
        .map(([i1, e1]) => SimpleRelationalList.map(([i2, e2]) => [`${i2}${txt}${i1}`, new Binary(op, e2, e1)]))
        .reduce((a, b) => a.concat(b)),
      ...SimpleRelationalList
        .map(([i1, e1]) => SimpleRelationalList.map(([i2, e2]) => [`${i1}${txt}${i2}`, new Binary(e2.operation, new Binary(op, new Binary(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
        .reduce((a, b) => a.concat(b)),
      ...SimpleEqualityList
        .map(([i1, e1]) => SimpleRelationalList.map(([i2, e2]) => [`${i1}${txt}${i2}`, new Binary(e1.operation, e1.left, new Binary(e2.operation, new Binary(op, e1.right, e2.left), e2.right))]))
        .reduce((a, b) => a.concat(b))
    ]).reduce((a, b) => a.concat(b))
  ];
  describe('parse ComplexRelationalList', () => {
    for (const [input, expected] of ComplexRelationalList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexEqualityList = [
    ...binaryEquality.map(op => [
      ...SimpleIsEqualityList.map(([i1, e1]) => [`${i1}${op}a`, new Binary(op, e1, $a)]),
      ...SimpleRelationalList
        .map(([i1, e1]) => SimpleEqualityList.map(([i2, e2]) => [`${i2}${op}${i1}`, new Binary(op, e2, e1)]))
        .reduce((a, b) => a.concat(b)),
      ...SimpleEqualityList
        .map(([i1, e1]) => SimpleEqualityList.map(([i2, e2]) => [`${i1}${op}${i2}`, new Binary(e2.operation, new Binary(op, new Binary(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
        .reduce((a, b) => a.concat(b)),
      ...SimpleLogicalANDList
        .map(([i1, e1]) => SimpleEqualityList.map(([i2, e2]) => [`${i1}${op}${i2}`, new Binary(e1.operation, e1.left, new Binary(e2.operation, new Binary(op, e1.right, e2.left), e2.right))]))
        .reduce((a, b) => a.concat(b))
    ]).reduce((a, b) => a.concat(b))
  ];
  describe('parse ComplexEqualityList', () => {
    for (const [input, expected] of ComplexEqualityList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexLogicalANDList = [
    ...SimpleIsLogicalANDList.map(([i1, e1]) => [`${i1}&&a`, new Binary('&&', e1, $a)]),
    ...SimpleEqualityList
      .map(([i1, e1]) => SimpleLogicalANDList.map(([i2, e2]) => [`${i2}&&${i1}`, new Binary('&&', e2, e1)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleLogicalANDList
      .map(([i1, e1]) => SimpleLogicalANDList.map(([i2, e2]) => [`${i1}&&${i2}`, new Binary(e2.operation, new Binary('&&', new Binary(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleLogicalORList
      .map(([i1, e1]) => SimpleLogicalANDList.map(([i2, e2]) => [`${i1}&&${i2}`, new Binary(e1.operation, e1.left, new Binary(e2.operation, new Binary('&&', e1.right, e2.left), e2.right))]))
      .reduce((a, b) => a.concat(b))
  ];
  describe('parse ComplexLogicalANDList', () => {
    for (const [input, expected] of ComplexLogicalANDList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexLogicalORList = [
    ...SimpleIsLogicalORList.map(([i1, e1]) => [`${i1}||a`, new Binary('||', e1, $a)]),
    ...SimpleLogicalANDList
      .map(([i1, e1]) => SimpleLogicalORList.map(([i2, e2]) => [`${i2}||${i1}`, new Binary('||', e2, e1)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleLogicalORList
      .map(([i1, e1]) => SimpleLogicalORList.map(([i2, e2]) => [`${i1}||${i2}`, new Binary(e2.operation, new Binary('||', new Binary(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleConditionalList
      .map(([i1, e1]) => SimpleLogicalORList.map(([i2, e2]) => [`${i1}||${i2}`, new Conditional(e1.condition, e1.yes, new Binary(e2.operation, new Binary('||', e1.no, e2.left), e2.right))]))
      .reduce((a, b) => a.concat(b))
  ];
  describe('parse ComplexLogicalORList', () => {
    for (const [input, expected] of ComplexLogicalORList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexConditionalList = [
    ...SimpleIsLogicalORList.map(([i1, e1]) => [`${i1}?0:1`, new Conditional(e1, $num0, $num1)]),
    ...SimpleIsAssignList.map(([i1, e1]) => [`0?1:${i1}`, new Conditional($num0, $num1, e1)]),
    ...SimpleIsAssignList.map(([i1, e1]) => [`0?${i1}:1`, new Conditional($num0, e1, $num1)]),
    ...SimpleConditionalList.map(([i1, e1]) => [`${i1}?0:1`, new Conditional(e1.condition, e1.yes, new Conditional(e1.no, $num0, $num1))])
  ];
  describe('parse ComplexConditionalList', () => {
    for (const [input, expected] of ComplexConditionalList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });


  const ComplexAssignList = [
    ...SimpleIsAssignList.map(([i1, e1]) => [`a=${i1}`, new Assign($a, e1)]),
    ...SimpleIsAssignList.map(([i1, e1]) => [`a=b=${i1}`, new Assign($a, new Assign($b, e1))]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}=a`, new Assign(e1, $a)]),
    ...SimpleAccessMemberList.map(([i1, e1]) => [`${i1}=a`, new Assign(e1, $a)]),
    ...SimpleAccessKeyedList.map(([i1, e1]) => [`${i1}=a`, new Assign(e1, $a)]),
    ...SimpleAssignList.map(([i1, e1]) => [`${i1}=c`, new Assign(e1.target, new Assign(e1.value, $c))])
  ];
  describe('parse ComplexAssignList', () => {
    for (const [input, expected] of ComplexAssignList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });


  const ComplexValueConverterList = [
    ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}|a`, new ValueConverter(e1, 'a', [])]),
    ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}|a:${i1}`, new ValueConverter(e1, 'a', [e1])]),
    ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}`, new ValueConverter(e1, 'a', [e1, e1])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}|a|b`, new ValueConverter(new ValueConverter(e1, 'a', []), 'b', [])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}|a|b|c`, new ValueConverter(new ValueConverter(new ValueConverter(e1, 'a', []), 'b', []), 'c', [])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}`, new ValueConverter(e1, 'a', [e1, e1])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}:${i1}`, new ValueConverter(e1, 'a', [e1, e1, e1])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}:${i1}|b|c:${i1}:${i1}:${i1}`, new ValueConverter(new ValueConverter(new ValueConverter(e1, 'a', [e1, e1, e1]), 'b', []), 'c', [e1, e1, e1])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}:${i1}|b:${i1}:${i1}:${i1}|c`, new ValueConverter(new ValueConverter(new ValueConverter(e1, 'a', [e1, e1, e1]), 'b', [e1, e1, e1]), 'c', [])])
  ];
  describe('parse ComplexValueConverterList', () => {
    for (const [input, expected] of ComplexValueConverterList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  const ComplexBindingBehaviorList = [
    ...SimpleIsValueConverterList.map(([i1, e1]) => [`${i1}&a`, new BindingBehavior(e1, 'a', [])]),
    ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}&a:${i1}`, new BindingBehavior(e1, 'a', [e1])]),
    ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}`, new BindingBehavior(e1, 'a', [e1, e1])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}&a&b`, new BindingBehavior(new BindingBehavior(e1, 'a', []), 'b', [])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}&a&b&c`, new BindingBehavior(new BindingBehavior(new BindingBehavior(e1, 'a', []), 'b', []), 'c', [])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}`, new BindingBehavior(e1, 'a', [e1, e1])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}:${i1}`, new BindingBehavior(e1, 'a', [e1, e1, e1])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}:${i1}&b&c:${i1}:${i1}:${i1}`, new BindingBehavior(new BindingBehavior(new BindingBehavior(e1, 'a', [e1, e1, e1]), 'b', []), 'c', [e1, e1, e1])]),
    ...AccessScopeList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}:${i1}&b:${i1}:${i1}:${i1}&c`, new BindingBehavior(new BindingBehavior(new BindingBehavior(e1, 'a', [e1, e1, e1]), 'b', [e1, e1, e1]), 'c', [])])
  ];
  describe('parse ComplexBindingBehaviorList', () => {
    for (const [input, expected] of ComplexBindingBehaviorList) {
      it(input, () => {
        verifyASTEqual(parse(input), expected);
      });
    }
  });

  describe('parse unicode IdentifierStart', () => {
    for (const char of latin1IdentifierStartChars) {
      it(char, () => {
        verifyASTEqual(parse(char), new AccessScope(char, 0));
      });
    }
  });

  describe('parse unicode IdentifierPart', () => {
    for (const char of latin1IdentifierPartChars) {
      it(char, () => {
        const identifier = `$${char}`;
        verifyASTEqual(parse(identifier), new AccessScope(identifier, 0));
      });
    }
  });

  describe('Errors', () => {
    for (const input of [
      ')', '}', ']', '%', '*',
      ',', '/', ':', '>', '<',
      '=', '?', 'of','instanceof', 'in', ' '
    ]) {
      it(`throw Code 100 (InvalidExpressionStart) on "${input}"`, () => {
        verifyResultOrError(input, null, 'Code 100');
      });
    }

    for (const input of ['..', '...']) {
      it(`throw Code 101 (UnconsumedToken) on "${input}"`, () => {
        verifyResultOrError(input, null, 'Code 101');
      });
    }
    it(`throw Code 101 (UnconsumedToken) on "$this!"`, () => {
      verifyResultOrError(`$this!`, null, 'Code 101');
    });
    for (const [input] of SimpleIsAssignList) {
      for (const op of [')', ']', '}']) {
        it(`throw Code 110 (MissingExpectedToken) on "${input}${op}"`, () => {
          verifyResultOrError(`${input}${op}`, null, 'Code 101');
        });
      }
    }


    it(`throw Code 102 (DoubleDot) on "$parent..bar"`, () => {
      verifyResultOrError(`$parent..bar`, null, 'Code 102');
    });

    for (const nonTerminal of ['!', ' of', ' typeof', '=']) {
      it(`throw Code 103 (InvalidMemberExpression) on "$parent${nonTerminal}"`, () => {
        verifyResultOrError(`$parent${nonTerminal}`, null, 'Code 103');
      });
    }


    for (const op of ['!', '(', '+', '-', '.', '[', 'typeof']) {
      it(`throw Code 104 (UnexpectedEndOfExpression) on "${op}"`, () => {
        verifyResultOrError(op, null, 'Code 104');
      });
    }

    for (const [input, expr] of SimpleIsLeftHandSideList) {
      it(`throw Code 105 (ExpectedIdentifier) on "${input}."`, () => {
        if (typeof expr['value'] !== 'number' || input.includes('.')) { // only non-float numbers are allowed to end on a dot
          verifyResultOrError(`${input}.`, null, 'Code 105');
        } else {
          verifyResultOrError(`${input}.`, expr, null);
        }
      });
    }

    for (const input of ['{', '{[]}', '{[}', '{[a]}', '{[a}', '{{', '{(']) {
      it(`throw Code 107 (LiteralInvalidObjectPropertyDefinition) on "${input}"`, () => {
        verifyResultOrError(input, null, 'Code 107');
      });
    }

    for (const input of ['"', '\'']) {
      it(`throw Code 108 (UnterminatedQuote) on "${input}"`, () => {
        verifyResultOrError(input, null, 'Code 108');
      });
    }

    for (const input of ['`', '` ', '`${a}']) {
      it(`throw Code 109 (UnterminatedTemplate) on "${input}"`, () => {
        verifyResultOrError(input, null, 'Code 109');
      });
    }

    for (const [input] of SimpleIsAssignList) {
      for (const op of ['(', '[']) {
        it(`throw Code 110 (MissingExpectedToken) on "${op}${input}"`, () => {
          verifyResultOrError(`${op}${input}`, null, 'Code 110');
        });
      }
    }
    for (const [input] of SimpleIsConditionalList) {
      it(`throw Code 110 (MissingExpectedToken) on "${input}?${input}"`, () => {
        verifyResultOrError(`${input}?${input}`, null, 'Code 110');
      });
    }
    for (const [input] of AccessScopeList) {
      it(`throw Code 110 (MissingExpectedToken) on "{${input}"`, () => {
        verifyResultOrError(`{${input}`, null, 'Code 110');
      });
    }
    for (const [input] of LiteralSimpleStringList) {
      it(`throw Code 110 (MissingExpectedToken) on "{${input}}"`, () => {
        verifyResultOrError(`{${input}}`, null, 'Code 110');
      });
    }
    for (const input of ['{24}', '{24, 24}', '{\'\'}', '{a.b}', '{a[b]}', '{a()}']) {
      it(`throw Code 110 (MissingExpectedToken) on "${input}"`, () => {
        verifyResultOrError(input, null, 'Code 110');
      });
    }

    for (const input of ['#', ';', '@', '^', '~', '\\', 'foo;']) {
      it(`throw Code 111 (UnexpectedCharacter) on "${input}"`, () => {
        verifyResultOrError(input, null, 'Code 111');
      });
    }

    for (const [input] of SimpleIsAssignList) {
      it(`throw Code 112 (MissingValueConverter) on "${input}|"`, () => {
        verifyResultOrError(`${input}|`, null, 'Code 112');
      });
    }

    for (const [input] of SimpleIsAssignList) {
      it(`throw Code 113 (MissingBindingBehavior) on "${input}&"`, () => {
        verifyResultOrError(`${input}&`, null, 'Code 113');
      });
    }

    for (const [input] of [
      [`$this`, $this],
      ...LiteralSimpleList,
      ...SimpleUnaryList
    ]) {
      it(`throw Code 150 (NotAssignable) on "${input}=a"`, () => {
        verifyResultOrError(`${input}=a`, null, 'Code 150');
      });
    }

    for (const [input] of SimpleIsBindingBehaviorList.filter(([i, e]) => !e.ancestor)) {
      it(`throw Code 151 (UnexpectedForOf) on "${input} of"`, () => {
        verifyResultOrError(`${input} of`, null, 'Code 151');
      });
    }
  });

  describe('unknown unicode IdentifierPart', () => {
    for (const char of otherBMPIdentifierPartChars) {
      it(char, () => {
        const identifier = `$${char}`;
        verifyResultOrError(identifier, null, codes.UnexpectedCharacter);
      });
    }
  });
});

