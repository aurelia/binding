import { Parser } from '../src/parser';
import { AccessKeyed, AccessMember, AccessScope, AccessThis,
  Assign, Binary, BindingBehavior, CallFunction,
  CallMember, CallScope, Conditional,
  LiteralArray, LiteralObject, LiteralPrimitive, LiteralString, LiteralTemplate,
  Unary, ValueConverter } from '../src/ast';
import { latin1IdentifierStartChars, latin1IdentifierPartChars, otherBMPIdentifierPartChars } from './unicode';

/* eslint-disable no-loop-func, no-floating-decimal, key-spacing, new-cap, quotes, comma-spacing */

const $a = new AccessScope('a', 0);
const $b = new AccessScope('b', 0);
const $c = new AccessScope('c', 0);
const $x = new AccessScope('x', 0);
const $y = new AccessScope('y', 0);
const $z = new AccessScope('z', 0);
const $foo = new AccessScope('foo', 0);
const $bar = new AccessScope('bar', 0);
const $baz = new AccessScope('baz', 0);
const $true = new LiteralPrimitive(true);
const $false = new LiteralPrimitive(false);
const $null = new LiteralPrimitive(null);
const $undefined = new LiteralPrimitive(undefined);
const $str = new LiteralString('');
const $str1 = new LiteralString('1');
const $num0 = new LiteralPrimitive(0);
const $num1 = new LiteralPrimitive(1);
const $num2 = new LiteralPrimitive(2);
const $arr = new LiteralArray([]);
const $obj = new LiteralObject([], []);

const binaryOps = [
  '&&', '||',
  '==', '!=', '===', '!==',
  '<', '>', '<=', '>=',
  '+', '-',
  '*', '%', '/',
  'in', 'instanceof'
];
const unaryOps = [
  '!',
  'typeof',
  'void'
];

describe('Parser', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe('should parse', () => {
    describe('LiteralString', () => {
      // http://es5.github.io/x7.html#x7.8.4
      const tests = [
        { expr: '\'foo\'', expected: new LiteralString('foo') },
        { expr: `\'${unicodeEscape('äöüÄÖÜß')}\'`, expected: new LiteralString('äöüÄÖÜß') },
        { expr: `\'${unicodeEscape('ಠ_ಠ')}\'`, expected: new LiteralString('ಠ_ಠ') },
        { expr: '\'\\\\\'', expected: new LiteralString('\\') },
        { expr: '\'\\\'\'', expected: new LiteralString('\'') },
        { expr: '\'"\'', expected: new LiteralString('"') },
        { expr: '\'\\f\'', expected: new LiteralString('\f') },
        { expr: '\'\\n\'', expected: new LiteralString('\n') },
        { expr: '\'\\r\'', expected: new LiteralString('\r') },
        { expr: '\'\\t\'', expected: new LiteralString('\t') },
        { expr: '\'\\v\'', expected: new LiteralString('\v') },
        { expr: '\'\\v\'', expected: new LiteralString('\v') }
      ];

      for (const { expr, expected } of tests) {
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });
      }
    });

    describe('template literal', () => {
      const tests = [
        { expr: '`\r\n\t\n`', expected: new LiteralTemplate(['\r\n\t\n']) },
        { expr: '`\n\r\n\r`', expected: new LiteralTemplate(['\n\r\n\r']) },
        { expr: '`x\\r\\nx`', expected: new LiteralTemplate(['x\r\nx']) },
        { expr: '`x\r\nx`', expected: new LiteralTemplate(['x\r\nx']) },
        { expr: '``', expected: new LiteralTemplate(['']) },
        { expr: '`foo`', expected: new LiteralTemplate(['foo']) },
        { expr: '`$`', expected: new LiteralTemplate(['$']) },
        { expr: '`a${foo}`', expected: new LiteralTemplate(['a', ''], [$foo]) },
        { expr: '`${ {foo: 1} }`', expected: new LiteralTemplate(['', ''], [new LiteralObject(['foo'], [$num1])]) },
        { expr: '`a${"foo"}b`', expected: new LiteralTemplate(['a', 'b'], [new LiteralString('foo')]) },
        { expr: '`a${"foo"}b${"foo"}c`', expected: new LiteralTemplate(['a', 'b', 'c'], [new LiteralString('foo'), new LiteralString('foo')]) },
        { expr: 'foo`a${"foo"}b`', expected: new LiteralTemplate(['a', 'b'], [new LiteralString('foo')], ['a', 'b'], $foo) },
        { expr: 'foo`bar`', expected: new LiteralTemplate(['bar'], [], ['bar'], $foo) },
        { expr: 'foo`\r\n`', expected: new LiteralTemplate(['\r\n'], [], ['\\r\\n'], $foo) }
      ];

      for (const { expr, expected } of tests) {
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });
      }
    });

    describe('LiteralPrimitive', () => {
      // http://es5.github.io/x7.html#x7.8.4
      const tests = [
        { expr: 'true', expected: $true },
        { expr: 'false', expected: $false },
        { expr: 'null', expected: $null },
        { expr: 'undefined', expected: $undefined },
        { expr: '0', expected: $num0 },
        { expr: '1', expected: $num1 },
        { expr: '-1', expected: new Binary('-', $num0, $num1) },
        { expr: '(-1)', expected: new Binary('-', $num0, $num1) },
        { expr: '-(-1)', expected: new Binary('-', $num0, new Binary('-', $num0, $num1)) },
        { expr: '+(-1)', expected: new Binary('-', $num0, $num1) },
        { expr: '-(+1)', expected: new Binary('-', $num0, $num1) },
        { expr: '+(+1)', expected: $num1 },
        { expr: '9007199254740992', expected: new LiteralPrimitive(9007199254740992) }, // Number.MAX_SAFE_INTEGER + 1
        { expr: '1.7976931348623157e+308', expected: new LiteralPrimitive(1.7976931348623157e+308) }, // Number.MAX_VALUE
        { expr: '1.7976931348623157E+308', expected: new LiteralPrimitive(1.7976931348623157e+308) }, // Number.MAX_VALUE
        { expr: '-9007199254740992', expected: new Binary('-', $num0, new LiteralPrimitive(9007199254740992)) }, // Number.MIN_SAFE_INTEGER - 1
        { expr: '5e-324', expected: new LiteralPrimitive(5e-324) }, // Number.MIN_VALUE
        { expr: '5E-324', expected: new LiteralPrimitive(5e-324) }, // Number.MIN_VALUE
        { expr: '2.2', expected: new LiteralPrimitive(2.2) },
        { expr: '2.2e2', expected: new LiteralPrimitive(2.2e2) },
        { expr: '.42', expected: new LiteralPrimitive(.42) },
        { expr: '0.42', expected: new LiteralPrimitive(.42) },
        { expr: '.42E10', expected: new LiteralPrimitive(.42e10) }
      ];

      for (const { expr, expected } of tests) {
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });
      }
    });

    describe('LiteralArray', () => {
      const tests = [
        { expr: '[1 <= 0]', expected: new LiteralArray([new Binary('<=', $num1, $num0)]) },
        { expr: '[0]', expected: new LiteralArray([$num0])},
        { expr: '[]', expected: $arr},
        { expr: '[[[]]]', expected: new LiteralArray([new LiteralArray([$arr])])},
        { expr: '[[],[[]]]', expected: new LiteralArray([$arr, new LiteralArray([$arr])])},
        { expr: '[x()]', expected: new LiteralArray([new CallScope('x', [], 0)]) },
        { expr: '[1, "z", "a", null]', expected: new LiteralArray([$num1, new LiteralString('z'), new LiteralString('a'), $null]) }
      ];

      for (const { expr, expected } of tests) {
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });
      }
    });

    describe('Conditional', () => {
      const tests = [
        { expr: '(false ? true : undefined)', paren: true, expected: new Conditional($false, $true, $undefined) },
        { expr: '("1" ? "" : "1")', paren: true, expected: new Conditional($str1, $str, $str1) },
        { expr: '("1" ? foo : "")', paren: true, expected: new Conditional($str1, $foo, $str) },
        { expr: '(false ? false : true)', paren: true, expected: new Conditional($false, $false, $true) },
        { expr: '(foo ? foo : true)', paren: true, expected: new Conditional($foo, $foo, $true) },
        { expr: 'foo() ? 1 : 2', expected: new Conditional(new CallScope('foo', [], 0), $num1, $num2) },
        { expr: 'true ? foo : false', expected: new Conditional($true, $foo, $false) },
        { expr: '"1" ? "" : "1"', expected: new Conditional($str1, $str, $str1) },
        { expr: '"1" ? foo : ""', expected: new Conditional($str1, $foo, $str) },
        { expr: 'foo ? foo : "1"', expected: new Conditional($foo, $foo, $str1) },
        { expr: 'true ? foo : bar', expected: new Conditional($true, $foo, $bar) }
      ];

      for (const { expr, expected, paren } of tests) {
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });

        const nestedTests = [
          { expr: `${expr} ? a : b`, expected: paren ? new Conditional(expected, $a, $b) : new Conditional(expected.condition, expected.yes, new Conditional(expected.no, $a, $b)) },
          { expr: `a[b] ? ${expr} : a=((b))`, expected: new Conditional(new AccessKeyed($a, $b), expected, new Assign($a, $b)) },
          { expr: `a ? !b===!a : ${expr}`, expected: new Conditional($a, new Binary('===', new Unary('!', $b), new Unary('!', $a)), expected) }
        ];

        for (const { expr: nExpr, expected: nExpected } of nestedTests) {
          it(nExpr, () => {
            verifyEqual(parser.parse(nExpr), nExpected);
          });
        }
      }
    });

    describe('Binary', () => {
      for (const op of binaryOps) {
        it(`\"${op}\"`, () => {
          verifyEqual(parser.parse(`x ${op} y`), new Binary(op, $x, $y));
        });
      }
    });

    describe('Binary left-to-right associativity', () => {
      const tests = [
        { expr: '4/2*10', expected: 4/2*10 },
        { expr: '4/2*10+1', expected: 4/2*10+1 },
        { expr: '1+4/2+1', expected: 1+4/2+1 },
        { expr: '1+4/2+1+1', expected: 1+4/2+1+1 },
        { expr: '4/2*10', expected: 4/2*10 },
        { expr: '4/2*10/2', expected: 4/2*10/2 },
        { expr: '4/2*10*2', expected: 4/2*10*2 },
        { expr: '4/2*10+2', expected: 4/2*10+2 },
        { expr: '2/4/2*10', expected: 2/4/2*10 },
        { expr: '2*4/2*10', expected: 2*4/2*10 },
        { expr: '2+4/2*10', expected: 2+4/2*10 },
        { expr: '2/4/2*10/2', expected: 2/4/2*10/2 },
        { expr: '2*4/2*10*2', expected: 2*4/2*10*2 },
        { expr: '2+4/2*10+2', expected: 2+4/2*10+2 }
      ];

      for (const { expr, expected } of tests) {
        it(`${expr} evaluates to ${expected}`, () => {
          const parsed = parser.parse(expr);
          const actual = parsed.evaluate({}, {});
          expect(actual).toBe(expected);
        });
      }
    });

    describe('Binary operator precedence', () => {
      const x = [0, 1, 2, 3, 4, 5, 6, 7].map(i => new AccessScope(`x${i}`, 0));
      const b = (l, op, r) => new Binary(op, l, r);
      const prec1 = ['||'];
      const prec2 = ['&&'];
      const prec3 = ['^'];
      const prec4 = ['==', '!=', '===', '!=='];
      const prec5 = ['<', '>', '<=', '>=', 'in', 'instanceof'];
      const prec6 = ['+', '-'];
      const prec7 = ['*', '%', '/'];
      for (const _1 of prec1) {
        for (const _2 of prec2) {
          for (const _3 of prec3) {
            for (const _4 of prec4) {
              for (const _5 of prec5) {
                for (const _6 of prec6) {
                  for (const _7 of prec7) {
                    const tests = [
                      {
                        // natural ascending precedence
                        expr:       `x0 ${_1}    x1 ${_2}    x2 ${_3}    x3 ${_4}    x4 ${_5}    x5 ${_6}    x6 ${_7}  x7`,
                        expected: b(x[0], _1, b(x[1], _2, b(x[2], _3, b(x[3], _4, b(x[4], _5, b(x[5], _6, b(x[6], _7, x[7])))))))
                      },
                      {
                        // forced descending precedence
                        expr:             `((((((x0 ${_1}  x1) ${_2}  x2) ${_3}  x3) ${_4}  x4) ${_5}  x5) ${_6}  x6) ${_7}  x7`,
                        expected: b(b(b(b(b(b(b(x[0], _1, x[1]), _2, x[2]), _3, x[3]), _4, x[4]), _5, x[5]), _6, x[6]), _7, x[7])
                      },
                      {
                        // natural descending precedence
                        expr:                   `x7 ${_7}  x6  ${_6}  x5  ${_5}  x4  ${_4}  x3  ${_3}  x2  ${_2}  x1  ${_1}  x0`,
                        expected: b(b(b(b(b(b(b(x[7], _7, x[6]), _6, x[5]), _5, x[4]), _4, x[3]), _3, x[2]), _2, x[1]), _1, x[0])
                      },
                      {
                        // forced ascending precedence
                        expr:       `x7 ${_7}   (x6 ${_6}   (x5 ${_5}   (x4 ${_4}   (x3 ${_3}   (x2 ${_2}   (x1 ${_1}  x0))))))`,
                        expected: b(x[7], _7, b(x[6], _6, b(x[5], _5, b(x[4], _4, b(x[3], _3, b(x[2], _2, b(x[1], _1, x[0])))))))
                      }
                    ];

                    for (const { expr, expected } of tests) {
                      it(expr, () => {
                        const actual = parser.parse(expr);
                        expect(actual.toString()).toEqual(expected.toString());
                        verifyEqual(actual, expected);
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    describe('Binary + Unary operator precedence', () => {
      const x = $x;
      const y = $y;
      const u = (op, r) => op === '!' ? new Unary(op, r) : new Unary(op, r);
      const b = (l, op, r) => new Binary(op, l, r);

      for (const _b of binaryOps) {
        for (const _u of unaryOps) {
          const tests = [
            {
              // natural right unary-first
              expr:     `x ${_b} ${_u} y`,
              expected: b(x, _b, u(_u, y))
            },
            {
              // natural left unary-first
              expr:      `${_u} x ${_b} y`,
              expected: b(u(_u, x), _b, y)
            },
            {
              // forced binary-first
              expr:    `${_u} (x ${_b} y)`,
              expected: u(_u, b(x, _b, y))
            }
          ];

          for (const { expr, expected } of tests) {
            it(expr, () => {
              const actual = parser.parse(expr);
              expect(actual.toString()).toEqual(expected.toString());
              verifyEqual(actual, expected);
            });
          }
        }
      }
    });

    const variadics = [
      { ctor: BindingBehavior, op: '&' },
      { ctor: ValueConverter, op: '|' }
    ];

    for (const { ctor: Variadic, op } of variadics) {
      const $this0 = new AccessThis(0);
      const $this1 = new AccessThis(1);
      const $this2 = new AccessThis(2);

      describe(Variadic.name, () => {
        const tests = [
          { expr: `foo${op}bar:$this:$this`, expected: new Variadic($foo, 'bar', [$this0, $this0]) },
          { expr: `foo${op}bar:$this:$parent`, expected: new Variadic($foo, 'bar', [$this0, $this1]) },
          { expr: `foo${op}bar:$parent:$this`, expected: new Variadic($foo, 'bar', [$this1, $this0]) },
          { expr: `foo${op}bar:$parent.$parent:$parent.$parent`, expected: new Variadic($foo, 'bar', [$this2, $this2]) },
          { expr: `foo${op}bar:"1"?"":"1":true?foo:bar`, expected: new Variadic($foo, 'bar', [new Conditional($str1, $str, $str1), new Conditional($true, $foo, $bar)]) },
          { expr: `foo${op}bar:[1<=0]:[[],[[]]]`, expected: new Variadic($foo, 'bar', [new LiteralArray([new Binary('<=', $num1, $num0)]), new LiteralArray([$arr, new LiteralArray([$arr])])]) },
          { expr: `foo${op}bar:{foo:a?b:c}:{1:1}`, expected: new Variadic($foo, 'bar', [new LiteralObject(['foo'], [new Conditional($a, $b, $c)]), new LiteralObject([1], [$num1])]) },
          { expr: `foo${op}bar:a(b({})[c()[d()]])`, expected: new Variadic($foo, 'bar', [new CallScope('a', [new AccessKeyed(new CallScope('b', [$obj], 0), new AccessKeyed(new CallScope('c', [], 0), new CallScope('d', [], 0)))], 0)]) },
          { expr: `a(b({})[c()[d()]])${op}bar`, expected: new Variadic(new CallScope('a', [new AccessKeyed(new CallScope('b', [$obj], 0), new AccessKeyed(new CallScope('c', [], 0), new CallScope('d', [], 0)))], 0), 'bar', []) },
          { expr: `true?foo:bar${op}bar`, expected: new Variadic(new Conditional($true, $foo, $bar), 'bar', []) },
          { expr: `$parent.$parent${op}bar`, expected: new Variadic($this2, 'bar', []) }
        ];

        for (const { expr, expected } of tests) {
          it(expr, () => {
            verifyEqual(parser.parse(expr), expected);
          });
        }
      });
    }

    it('chained BindingBehaviors', () => {
      let expr = parser.parse('foo & bar:x:y:z & baz:a:b:c');
      verifyEqual(expr, new BindingBehavior(new BindingBehavior($foo, 'bar', [$x, $y, $z]), 'baz', [$a, $b, $c]));
    });

    it('chained ValueConverters', () => {
      let expr = parser.parse('foo | bar:x:y:z | baz:a:b:c');
      verifyEqual(expr, new ValueConverter(new ValueConverter($foo, 'bar', [$x, $y, $z]), 'baz', [$a, $b, $c]));
    });

    it('chained ValueConverters and BindingBehaviors', () => {
      let expr = parser.parse('foo | bar:x:y:z & baz:a:b:c');
      verifyEqual(expr, new BindingBehavior(new ValueConverter($foo, 'bar', [$x, $y, $z]), 'baz', [$a, $b, $c]));
    });

    it('AccessScope', () => {
      let expr = parser.parse('foo');
      verifyEqual(expr, $foo);
    });

    describe('AccessKeyed', () => {
      const tests = [
        { expr: 'foo[bar]', expected: new AccessKeyed($foo, $bar) },
        { expr: 'foo[\'bar\']', expected: new AccessKeyed($foo, new LiteralString('bar')) },
        { expr: 'foo[0]', expected: new AccessKeyed($foo, $num0) },
        { expr: 'foo[(0)]', expected: new AccessKeyed($foo, $num0) },
        { expr: '(foo)[0]', expected: new AccessKeyed($foo, $num0) },
        { expr: 'foo[null]', expected: new AccessKeyed($foo, $null) },
        { expr: '\'foo\'[0]', expected: new AccessKeyed(new LiteralString('foo'), $num0) },
        { expr: 'foo()[bar]', expected: new AccessKeyed(new CallScope('foo', [], 0), $bar) },
        { expr: 'a[b[c]]', expected: new AccessKeyed($a, new AccessKeyed($b, $c)) },
        { expr: 'a[b][c]', expected: new AccessKeyed(new AccessKeyed($a, $b), $c) }
      ];

      for (const { expr, expected } of tests) {
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });

        it(`(${expr})`, () => {
          verifyEqual(parser.parse(`(${expr})`), expected);
        });
      }
    });

    describe('AccessMember', () => {
      const tests = [
        { expr: 'foo.bar', expected: new AccessMember($foo, 'bar') },
        { expr: 'foo.bar.baz.qux', expected: new AccessMember(new AccessMember(new AccessMember($foo, 'bar'), 'baz'), 'qux') },
        { expr: 'foo["bar"].baz', expected: new AccessMember(new AccessKeyed($foo, new LiteralString('bar')), 'baz') },
        { expr: 'foo[""].baz', expected: new AccessMember(new AccessKeyed($foo, $str), 'baz') },
        { expr: 'foo[null].baz', expected: new AccessMember(new AccessKeyed($foo, $null), 'baz') },
        { expr: 'foo[42].baz', expected: new AccessMember(new AccessKeyed($foo, new LiteralPrimitive(42)), 'baz') },
        { expr: '{}.foo', expected: new AccessMember($obj, 'foo') },
        { expr: '[].foo', expected: new AccessMember($arr, 'foo') },
        { expr: 'null.foo', expected: new AccessMember($null, 'foo') },
        { expr: 'undefined.foo', expected: new AccessMember($undefined, 'foo') },
        { expr: 'true.foo', expected: new AccessMember($true, 'foo') },
        { expr: 'false.foo', expected: new AccessMember($false, 'foo') }
      ];

      for (const { expr, expected } of tests) {
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });
      }
    });

    it('Assign', () => {
      let expr = parser.parse('foo = bar');
      verifyEqual(expr, new Assign($foo, $bar));
    });

    it('Assign to ignored Unary', () => {
      let expr = parser.parse('+foo = bar');
      verifyEqual(expr, new Assign($foo, $bar));
    });

    it('chained Assign', () => {
      let expr = parser.parse('foo = bar = baz');
      verifyEqual(expr, new Assign(new Assign($foo, $bar), $baz));
    });

    describe('CallExpression', () => {
      const tests = [
        { expr: 'a()()()', expected: new CallFunction(new CallFunction(new CallScope('a', [], 0), []), []) },
        { expr: 'a(b(c()))', expected: new CallScope('a', [new CallScope('b', [new CallScope('c', [], 0)], 0)], 0) },
        { expr: 'a(b(),c())', expected: new CallScope('a', [new CallScope('b', [], 0), new CallScope('c', [], 0)], 0) },
        { expr: 'a()[b]()', expected: new CallFunction(new AccessKeyed(new CallScope('a', [], 0), $b), []) },
        { expr: '{foo}[\'foo\']()', expected: new CallFunction(new AccessKeyed(new LiteralObject(['foo'], [$foo]), new LiteralString('foo')), []) },
        { expr: 'a(b({})[c()[d()]])', expected: new CallScope('a', [new AccessKeyed(new CallScope('b', [$obj], 0), new AccessKeyed(new CallScope('c', [], 0), new CallScope('d', [], 0)))], 0) }
      ];

      for (const { expr, expected } of tests) {
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });

        it(`(${expr})`, () => {
          verifyEqual(parser.parse(`(${expr})`), expected);
        });
      }
    });

    it('CallScope', () => {
      let expr = parser.parse('foo(x)');
      verifyEqual(expr, new CallScope('foo', [$x], 0));
    });

    it('nested CallScope', () => {
      let expr = parser.parse('foo(bar(x), y)');
      verifyEqual(expr, new CallScope('foo', [new CallScope('bar', [$x], 0), $y], 0));
    });

    describe('CallMember', () => {
      const memberExpressions = [
        { memberExpr: 'foo', ast: new AccessScope('foo', 0)},
        { memberExpr: 'foo()', ast: new CallScope('foo', [], 0)},
        { memberExpr: 'null', ast: new LiteralPrimitive(null)},
        { memberExpr: 'true', ast: new LiteralPrimitive(true)},
        { memberExpr: 'false', ast: new LiteralPrimitive(false)},
        { memberExpr: '\'foo\'', ast: new LiteralString('foo')},
        { memberExpr: '"foo"', ast: new LiteralString('foo')},
        { memberExpr: '[]', ast: new LiteralArray([])},
        { memberExpr: '[1,2]', ast: new LiteralArray([new LiteralPrimitive(1), new LiteralPrimitive(2)])},
        { memberExpr: '{}', ast: new LiteralObject([], [])},
        { memberExpr: '{foo}', ast: new LiteralObject(['foo'], [new AccessScope('foo', 0)])},
        { memberExpr: '`foo`', ast: new LiteralTemplate(['foo'], [], ['foo'])},
        { memberExpr: 'foo`bar`', ast: new LiteralTemplate(['bar'], [], ['bar'], new AccessScope('foo', 0))},
        { memberExpr: '(42)', ast: new LiteralPrimitive(42)},
        { memberExpr: '(.3)', ast: new LiteralPrimitive(.3)},
        { memberExpr: '(10e2)', ast: new LiteralPrimitive(10e2)},
        { memberExpr: '(void 0)', ast: new Unary('void', new LiteralPrimitive(0))},
        { memberExpr: '(typeof null)', ast: new Unary('typeof', new LiteralPrimitive(null))},
        { memberExpr: '(1+1)', ast: new Binary('+', new LiteralPrimitive(1), new LiteralPrimitive(1))},
        { memberExpr: '(true===true?{}:{})', ast: new Conditional(new Binary('===', new LiteralPrimitive(true), new LiteralPrimitive(true)), new LiteralObject([], []), new LiteralObject([], []))},
      ];

      for (const { memberExpr, ast } of memberExpressions) {
        const expr = memberExpr + '.foo()';
        const expected = new CallMember(ast, 'foo', []);
        it(expr, () => {
          verifyEqual(parser.parse(expr), expected);
        });

        it(`(${expr})`, () => {
          verifyEqual(parser.parse(`(${expr})`), expected);
        });
      }
    });

    it('CallMember', () => {
      let expr = parser.parse('foo.bar(x)');
      verifyEqual(expr, new CallMember($foo, 'bar', [$x]));
    });

    it('nested CallMember', () => {
      let expr = parser.parse('foo.bar.baz(x)');
      verifyEqual(expr, new CallMember(new AccessMember($foo, 'bar'), 'baz', [$x]));
    });

    it('$this', () => {
      let expr = parser.parse('$this');
      verifyEqual(expr, new AccessThis(0));
    });

    it('$this.member to AccessScope', () => {
      let expr = parser.parse('$this.foo');
      verifyEqual(expr, $foo);
    });

    it('$this() to CallFunction', () => {
      let expr = parser.parse('$this()');
      verifyEqual(expr, new CallFunction(new AccessThis(0), []));
    });

    it('$this.member() to CallScope', () => {
      let expr = parser.parse('$this.foo(x)');
      verifyEqual(expr, new CallScope('foo', [$x], 0));
    });

    const parents = [
      { i: 1, name: '$parent' },
      { i: 2, name: '$parent.$parent' },
      { i: 3, name: '$parent.$parent.$parent' },
      { i: 4, name: '$parent.$parent.$parent.$parent' },
      { i: 5, name: '$parent.$parent.$parent.$parent.$parent' },
      { i: 6, name: '$parent.$parent.$parent.$parent.$parent.$parent' },
      { i: 7, name: '$parent.$parent.$parent.$parent.$parent.$parent.$parent' },
      { i: 8, name: '$parent.$parent.$parent.$parent.$parent.$parent.$parent.$parent' },
      { i: 9, name: '$parent.$parent.$parent.$parent.$parent.$parent.$parent.$parent.$parent' },
      { i: 10, name: '$parent.$parent.$parent.$parent.$parent.$parent.$parent.$parent.$parent.$parent'  }
    ];
    describe('$parent', () => {
      for (const { i, name } of parents) {
        it(name, () => {
          let expr = parser.parse(name);
          verifyEqual(expr, new AccessThis(i));
        });

        it(`${name} before ValueConverter`, () => {
          let expr = parser.parse(`${name} | foo`);
          verifyEqual(expr, new ValueConverter(new AccessThis(i), 'foo', []));
        });

        it(`${name}.bar before ValueConverter`, () => {
          let expr = parser.parse(`${name}.bar | foo`);
          verifyEqual(expr, new ValueConverter(new AccessScope('bar', i), 'foo', []));
        });

        it(`${name} before binding behavior`, () => {
          let expr = parser.parse(`${name} & foo`);
          verifyEqual(expr, new BindingBehavior(new AccessThis(i), 'foo', []));
        });

        it(`${name}.bar before binding behavior`, () => {
          let expr = parser.parse(`${name}.bar & foo`);
          verifyEqual(expr, new BindingBehavior(new AccessScope('bar', i), 'foo', []));
        });

        it(`${name}.foo to AccessScope`, () => {
          let expr = parser.parse(`${name}.foo`);
          verifyEqual(expr, new AccessScope(`foo`, i));
        });

        it(`${name}.foo() to CallScope`, () => {
          let expr = parser.parse(`${name}.foo()`);
          verifyEqual(expr, new CallScope(`foo`, [], i));
        });

        it(`${name}() to CallFunction`, () => {
          let expr = parser.parse(`${name}()`);
          verifyEqual(expr, new CallFunction(new AccessThis(i), []));
        });

        it(`${name}[0] to AccessKeyed`, () => {
          let expr = parser.parse(`${name}[0]`);
          verifyEqual(expr, new AccessKeyed(new AccessThis(i), $num0));
        });
      }
    });

    it('$parent inside CallMember', () => {
      let expr = parser.parse('matcher.bind($parent)');
      verifyEqual(expr, new CallMember(new AccessScope('matcher', 0), 'bind', [new AccessThis(1)]));
    });

    it('$parent in LiteralObject', () => {
      let expr = parser.parse('{parent: $parent}');
      verifyEqual(expr, new LiteralObject(['parent'], [new AccessThis(1)]));
    });

    it('$parent and foo in LiteralObject', () => {
      let expr = parser.parse('{parent: $parent, foo: bar}');
      verifyEqual(expr, new LiteralObject(['parent', 'foo'], [new AccessThis(1), $bar]));
    });

    describe('LiteralObject', () => {
      const tests = [
        { expr: '', expected: $obj },
        { expr: 'foo', expected: new LiteralObject(['foo'], [$foo]) },
        { expr: 'foo,bar', expected: new LiteralObject(['foo', 'bar'], [$foo, $bar]) },
        { expr: 'foo:bar', expected: new LiteralObject(['foo'], [$bar]) },
        { expr: 'foo:bar()', expected: new LiteralObject(['foo'], [new CallScope('bar', [], 0)]) },
        { expr: 'foo:a?b:c', expected: new LiteralObject(['foo'], [new Conditional($a, $b, $c)]) },
        { expr: 'foo:bar=((baz))', expected: new LiteralObject(['foo'], [new Assign($bar, $baz)]) },
        { expr: 'foo:(bar)===baz', expected: new LiteralObject(['foo'], [new Binary('===', $bar, $baz)]) },
        { expr: 'foo:[bar]', expected: new LiteralObject(['foo'], [new LiteralArray([$bar])]) },
        { expr: 'foo:bar[baz]', expected: new LiteralObject(['foo'], [new AccessKeyed($bar, $baz)]) },
        { expr: '\'foo\':1', expected: new LiteralObject(['foo'], [$num1]) },
        { expr: '1:1', expected: new LiteralObject([1], [$num1]) },
        { expr: '1:\'foo\'', expected: new LiteralObject([1], [new LiteralString('foo')]) },
        { expr: 'null:1', expected: new LiteralObject(['null'], [$num1]) },
        { expr: 'foo:{}', expected: new LiteralObject(['foo'], [$obj]) },
        { expr: 'foo:{bar}[baz]', expected: new LiteralObject(['foo'], [new AccessKeyed(new LiteralObject(['bar'], [$bar]), $baz)]) }
      ];

      for (const { expr, expected } of tests) {
        it(`{${expr}}`, () => {
          verifyEqual(parser.parse(`{${expr}}`), expected);
        });

        it(`({${expr}})`, () => {
          verifyEqual(parser.parse(`({${expr}})`), expected);
        });
      }
    });

    describe('unicode IdentifierStart', () => {
      for (const char of latin1IdentifierStartChars) {
        it(char, () => {
          const expr = parser.parse(char);
          verifyEqual(expr,
            new AccessScope(char, 0)
         );
        });
      }
    });

    describe('unicode IdentifierPart', () => {
      for (const char of latin1IdentifierPartChars) {
        it(char, () => {
          const identifier = '$' + char;
          const expr = parser.parse(identifier);
          verifyEqual(expr,
            new AccessScope(identifier, 0)
         );
        });
      }
    });
  });

  describe('should not parse', () => {
    describe('LiteralString with unterminated quote', () => {
      const expressions = [
        '\'a',
        '\'',
        'a\'',
        '"a',
        '"',
        'a"'
      ];

      for (const expr of expressions) {
        it(expr, () => {
          _verifyError(expr, 'Unterminated quote');
        });
      }
    });

    describe('LiteralObject with computed property', () => {
      const expressions = [
        '{ []: "foo" }',
        '{ [42]: "foo" }',
        '{ ["foo"]: "bar" }',
        '{ [foo]: "bar" }'
      ];

      for (const expr of expressions) {
        it(expr, () => {
          _verifyError(expr, 'Unexpected token [');
        });
      }
    });

    describe('invalid shorthand properties', () => {
      const expressions = [
        '{ foo.bar }',
        '{ foo.bar, bar.baz }',
        '{ "foo" }',
        '{ "foo.bar" }',
        '{ 42 }',
        '{ 42, 42 }',
        '{ [foo] }',
        '{ ["foo"] }',
        '{ [42] }'
      ];

      for (const expr of expressions) {
        it(expr, () => {
          _verifyError(expr, 'expected');
        });
      }
    });

    describe('multiple expressions', () => {
      const expressions = [
        ';',
        'foo;',
        ';foo',
        'foo&bar;baz|qux'
      ];

      for (const expr of expressions) {
        it(expr, () => {
          _verifyError(expr, 'Unexpected character [;]');
        });
      }
    });

    describe('extra closing token', () => {
      const tests = [
        { expr: 'foo())', token: ')' },
        { expr: 'foo[x]]', token: ']' },
        { expr: '{foo}}', token: '}' }
      ];

      for (const { expr, token } of tests) {
        it(expr, () => {
          _verifyError(expr, `Unconsumed token ${token}`);
        });
      }
    });

    describe('invalid expression start', () => {
      const tests = [')', ']', '}', ''];

      for (const expr of tests) {
        it(expr, () => {
          _verifyError(expr, `Invalid start of expression`);
        });
      }
    });

    describe('missing expected token', () => {
      const tests = [
        { expr: '(foo', token: ')' },
        { expr: '[foo', token: ']' },
        { expr: '{foo', token: ',' },
        { expr: 'foo(bar', token: ')' },
        { expr: 'foo[bar', token: ']' },
        { expr: 'foo.bar(baz', token: ')' },
        { expr: 'foo.bar[baz', token: ']' }
      ];

      for (const { expr, token } of tests) {
        it(expr, () => {
          _verifyError(expr, `Missing expected token ${token}`);
        });
      }
    });

    describe('assigning unassignable', () => {
      const expressions = [
        '(foo ? bar : baz) = qux',
        '$this = foo',
        'foo() = bar',
        'foo.bar() = baz',
        '!foo = bar',
        '-foo = bar',
        '\'foo\' = bar',
        '42 = foo',
        '[] = foo',
        '{} = foo'
      ].concat(binaryOps.map(op => `foo ${op} bar = baz`));

      for (const expr of expressions) {
        it(expr, () => {
          _verifyError(expr, 'is not assignable');
        });
      }
    });

    it('incomplete conditional', () => {
      _verifyError('foo ? bar', 'Missing expected token : at column 9');
    });

    describe('invalid primary expression', () => {
      const expressions = ['.', ',', '&', '|', '=', '<', '>', '*', '%', '/'];
      expressions.push(...expressions.map(e => e + ' '));
      for (const expr of expressions) {
        it(expr, () => {
          if (expr.length === 1) {
            _verifyError(expr, `Unexpected end of expression`);
          } else {
            _verifyError(expr, `Unexpected token ${expr.slice(0, 0)}`);
          }
        });
      }
    });

    describe('invalid exponent', () => {
      const expressions = ['1e', '1ee', '1e.'];

      for (const expr of expressions) {
        it(expr, () => {
          _verifyError(expr, 'Invalid exponent');
        });
      }
    });

    describe('unknown unicode IdentifierPart', () => {
      for (const char of otherBMPIdentifierPartChars) {
        it(char, () => {
          const identifier = '$' + char;
          _verifyError(identifier, `Unexpected character [${char}] at column 1`);
        });
      }
    });

    it('double dot (AccessScope)', () => {
      _verifyError('foo..bar', `Unexpected token . at column 4`);
    });

    it('double dot (AccessMember)', () => {
      _verifyError('foo.bar..baz', `Unexpected token . at column 8`);
    });

    it('double dot (AccessThis)', () => {
      _verifyError('$parent..bar', `Unexpected token . at column 8`);
    });
  });

  function _verifyError(expr, errorMessage = '') {
    verifyError(parser, expr, errorMessage);
  }
});

function verifyError(parser, expr, errorMessage = '') {
  let error = null;
  try {
    parser.parse(expr);
  } catch (e) {
    error = e;
  }

  expect(error).not.toBeNull();
  expect(error.message).toContain(errorMessage);
}

function verifyEqual(actual, expected) {
  if (typeof expected !== 'object' || expected === null || expected === undefined) {
    expect(actual).toEqual(expected);
    return;
  }
  if (expected instanceof Array) {
    for (let i = 0; i < expected.length; i++) {
      verifyEqual(actual[i], expected[i]);
    }
    return;
  }

  if (actual) {
    expect(actual.constructor.name).toEqual(expected.constructor.name);
    expect(actual.toString()).toEqual(expected.toString());
    for (const prop of Object.keys(expected)) {
      verifyEqual(actual[prop], expected[prop]);
    }
  }
}

function unicodeEscape(str) {
  return str.replace(/[\s\S]/g, c => `\\u${('0000' + c.charCodeAt().toString(16)).slice(-4)}`);
}
