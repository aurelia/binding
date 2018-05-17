import { Parser, ParserImplementation, parserConfig } from '../src/parser';
import {
  LiteralString,
  LiteralPrimitive,
  LiteralObject,
  ValueConverter,
  BindingBehavior,
  AccessScope,
  AccessMember,
  AccessKeyed,
  CallScope,
  CallMember,
  CallFunction,
  AccessThis,
  Assign,
  Conditional,
  Binary,
  Chain,
  PrefixNot,
  LiteralArray
} from '../src/ast';
import { latin1IdentifierStartChars, latin1IdentifierPartChars, otherBMPIdentifierPartChars } from './unicode';

const operators = [
  '&&', '||',
  '==', '!=', '===', '!==',
  '<', '>', '<=', '>=', 
  '+', '-', 
  '*', '%', '/'
];

describe('Parser', () => {
  let parser;

  beforeAll(() => {
    parser = new Parser();
  });

  describe('parses literal string', () => {
    // http://es5.github.io/x7.html#x7.8.4
    const tests = [
      { expression: '\'foo\'', expected: new LiteralString('foo') },
      { expression: `\'${unicodeEscape('äöüÄÖÜß')}\'`, expected: new LiteralString('äöüÄÖÜß') },
      { expression: `\'${unicodeEscape('ಠ_ಠ')}\'`, expected: new LiteralString('ಠ_ಠ') },
      { expression: '\'\\\\\'', expected: new LiteralString('\\') },
      { expression: '\'\\\'\'', expected: new LiteralString('\'') },
      { expression: '\'"\'', expected: new LiteralString('"') },
      { expression: '\'\\f\'', expected: new LiteralString('\f') },
      { expression: '\'\\n\'', expected: new LiteralString('\n') },
      { expression: '\'\\r\'', expected: new LiteralString('\r') },
      { expression: '\'\\t\'', expected: new LiteralString('\t') },
      { expression: '\'\\v\'', expected: new LiteralString('\v') },
      { expression: '\'\\v\'', expected: new LiteralString('\v') }
    ];

    for (const test of tests) {
      it(test.expression, () => {
        let expression = parser.parse(test.expression);
        verifyEqual(expression, test.expected);
      });
    }
  });

  describe('parses literal primitive', () => {
    // http://es5.github.io/x7.html#x7.8.4
    const tests = [
      { expression: 'true', expected: new LiteralPrimitive(true) },
      { expression: 'false', expected: new LiteralPrimitive(false) },
      { expression: 'null', expected: new LiteralPrimitive(null) },
      { expression: 'undefined', expected: new LiteralPrimitive(undefined) },
      { expression: '0', expected: new LiteralPrimitive(0) },
      { expression: '1', expected: new LiteralPrimitive(1) },
      { expression: '-1', expected: new Binary('-', new LiteralPrimitive(0), new LiteralPrimitive(1)) },
      { expression: '(-1)', expected: new Binary('-', new LiteralPrimitive(0), new LiteralPrimitive(1)) },
      { expression: '-(-1)', expected: new Binary('-', new LiteralPrimitive(0), new Binary('-', new LiteralPrimitive(0), new LiteralPrimitive(1))) },
      { expression: '+(-1)', expected: new Binary('-', new LiteralPrimitive(0), new LiteralPrimitive(1)) },
      { expression: '-(+1)', expected: new Binary('-', new LiteralPrimitive(0), new LiteralPrimitive(1)) },
      { expression: '+(+1)', expected: new LiteralPrimitive(1) },
      { expression: '9007199254740992', expected: new LiteralPrimitive(9007199254740992) }, // Number.MAX_SAFE_INTEGER + 1
      { expression: '1.7976931348623157e+308', expected: new LiteralPrimitive(1.7976931348623157e+308) }, // Number.MAX_VALUE
      { expression: '1.7976931348623157E+308', expected: new LiteralPrimitive(1.7976931348623157e+308) }, // Number.MAX_VALUE
      { expression: '-9007199254740992', expected: new Binary('-', new LiteralPrimitive(0), new LiteralPrimitive(9007199254740992)) }, // Number.MIN_SAFE_INTEGER - 1
      { expression: '5e-324', expected: new LiteralPrimitive(5e-324) }, // Number.MIN_VALUE
      { expression: '5E-324', expected: new LiteralPrimitive(5e-324) }, // Number.MIN_VALUE
      { expression: '2.2', expected: new LiteralPrimitive(2.2) },
      { expression: '2.2e2', expected: new LiteralPrimitive(2.2e2) },
      { expression: '.42', expected: new LiteralPrimitive(.42) },
      { expression: '0.42', expected: new LiteralPrimitive(.42) },
      { expression: '.42E10', expected: new LiteralPrimitive(.42e10) },
    ];

    for (const test of tests) {
      it(test.expression, () => {
        let expression = parser.parse(test.expression);
        verifyEqual(expression, test.expected);
      });
    }
  });

  describe('parses literal array', () => {
    const tests = [
      { expression: '[1 <= 0]', expected: new LiteralArray([new Binary('<=', new LiteralPrimitive(1), new LiteralPrimitive(0))]) },
      { expression: '[0]', expected: new LiteralArray([new LiteralPrimitive(0)])},
      { expression: '[]', expected: new LiteralArray([])},
      { expression: '[[[]]]', expected: new LiteralArray([new LiteralArray([new LiteralArray([])])])},
      { expression: '[[],[[]]]', expected: new LiteralArray([new LiteralArray([]), new LiteralArray([new LiteralArray([])])])},
      { expression: '[x()]', expected: new LiteralArray([new CallScope('x', [], 0)]) },
      { expression: '[1, "z", "a", null]', expected: new LiteralArray([new LiteralPrimitive(1), new LiteralString('z'), new LiteralString('a'), new LiteralPrimitive(null)]) }
    ];

    for (const test of tests) {
      it(test.expression, () => {
        let expression = parser.parse(test.expression);
        verifyEqual(expression, test.expected);
      });
    }
  });

  describe('parses conditional', () => {
    const tests = [
      { expression: '(false ? true : undefined)', paren: true, expected: new Conditional(new LiteralPrimitive(false), new LiteralPrimitive(true), new LiteralPrimitive(undefined)) },
      { expression: '("1" ? "" : "1")', paren: true, expected: new Conditional(new LiteralString('1'), new LiteralString(''), new LiteralString('1')) },
      { expression: '("1" ? foo : "")', paren: true, expected: new Conditional(new LiteralString('1'), new AccessScope('foo', 0), new LiteralString('')) },
      { expression: '(false ? false : true)', paren: true, expected: new Conditional(new LiteralPrimitive(false), new LiteralPrimitive(false), new LiteralPrimitive(true)) },
      { expression: '(foo ? foo : true)', paren: true, expected: new Conditional(new AccessScope('foo', 0), new AccessScope('foo', 0), new LiteralPrimitive(true)) },
      { expression: 'foo() ? 1 : 2', expected: new Conditional(new CallScope('foo', [], 0), new LiteralPrimitive(1), new LiteralPrimitive(2)) },
      { expression: 'true ? foo : false', expected: new Conditional(new LiteralPrimitive(true), new AccessScope('foo', 0), new LiteralPrimitive(false)) },
      { expression: '"1" ? "" : "1"', expected: new Conditional(new LiteralString('1'), new LiteralString(''), new LiteralString('1')) },
      { expression: '"1" ? foo : ""', expected: new Conditional(new LiteralString('1'), new AccessScope('foo', 0), new LiteralString('')) },
      { expression: 'foo ? foo : "1"', expected: new Conditional(new AccessScope('foo', 0), new AccessScope('foo', 0), new LiteralString('1')) },
      { expression: 'true ? foo : bar', expected: new Conditional(new LiteralPrimitive(true), new AccessScope('foo', 0), new AccessScope('bar', 0)) }
    ];

    for (const test of tests) {
      it(test.expression, () => {
        let expression = parser.parse(test.expression);
        verifyEqual(expression, test.expected);
      });

      const nestedTests = [
        { expression: `${test.expression} ? a : b`, expected: test.paren
          ? new Conditional(test.expected, new AccessScope('a', 0), new AccessScope('b', 0))
          : new Conditional(test.expected.condition, test.expected.yes, new Conditional(test.expected.no, new AccessScope('a', 0), new AccessScope('b', 0))) },
        { expression: `a[b] ? ${test.expression} : a=((b))`, expected: new Conditional(new AccessKeyed(new AccessScope('a', 0), new AccessScope('b', 0)), test.expected, new Assign(new AccessScope('a', 0), new AccessScope('b', 0))) },
        { expression: `a ? !b===!a : ${test.expression}`, expected: new Conditional(new AccessScope('a', 0), new Binary('===', new PrefixNot('!', new AccessScope('b', 0)), new PrefixNot('!', new AccessScope('a', 0))), test.expected) }
      ];

      for (const nestedTest of nestedTests) {
        it(nestedTest.expression, () => {
          let expression = parser.parse(nestedTest.expression);
          verifyEqual(expression, nestedTest.expected);
        });
      }
    }
  });

  describe('parses binary', () => {
    for (let op of operators) {
      it(`\"${op}\"`, () => {
        let expression = parser.parse(`foo ${op} bar`);
        verifyEqual(expression,
          new Binary(
            op,
            new AccessScope('foo', 0),
            new AccessScope('bar', 0)
          )
        );
      });
    }
  });

  it('parses binary in the correct order', () => {
    const expression = parser.parse('a || b && c ^ d == e != f === g !== h < i > j <= k >= l + m - n * o % p / !q');
    verifyEqual(
      expression,
      new Binary(
        '||',
        new AccessScope('a', 0),
        new Binary(
          '&&',
          new AccessScope('b', 0),
          new Binary(
            '^',
            new AccessScope('c', 0),
            new Binary(
              '==',
              new AccessScope('d', 0),
              new Binary(
                '!=',
                new AccessScope('e', 0),
                new Binary(
                  '===',
                  new AccessScope('f', 0),
                  new Binary(
                    '!==',
                    new AccessScope('g', 0),
                    new Binary(
                      '<',
                      new AccessScope('h', 0),
                      new Binary(
                        '>',
                        new AccessScope('i', 0),
                        new Binary(
                          '<=',
                          new AccessScope('j', 0),
                          new Binary(
                            '>=',
                            new AccessScope('k', 0),
                            new Binary(
                              '+',
                              new AccessScope('l', 0),
                              new Binary(
                                '-',
                                new AccessScope('m', 0),
                                new Binary(
                                  '*',
                                  new AccessScope('n', 0),
                                  new Binary(
                                    '%',
                                    new AccessScope('o', 0),
                                    new Binary(
                                      '/',
                                      new AccessScope('p', 0),
                                      new PrefixNot(
                                        '!',
                                        new AccessScope('q', 0)
                                      )
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  });

  it('reorders binary expression', () => {
    const expression = parser.parse('a * b || c === d / e + f && g');
    verifyEqual(
      expression,
      new Binary(
        '||',
        new Binary(
          '*',
          new AccessScope('a', 0),
          new AccessScope('b', 0)
        ),
        new Binary(
          '&&',
          new Binary(
            '===',
            new AccessScope('c', 0),
            new Binary(
              '+',
              new Binary(
                '/',
                new AccessScope('d', 0),
                new AccessScope('e', 0)
              ),
              new AccessScope('f', 0)
            ),
          ),
          new AccessScope('g', 0)
        )
      )
    )
  });

  const variadics = [
    { ctor: BindingBehavior, op: '&' },
    { ctor: ValueConverter, op: '|' }
  ];

  for (const variadic of variadics) {
    describe(`parses ${variadic.ctor.name} with scope arguments`, () => {
      const tests = [
        { expression: `foo${variadic.op}bar:$this:$this`, expected: new variadic.ctor(new AccessScope('foo', 0), 'bar', [new AccessThis(0), new AccessThis(0)]) },
        { expression: `foo${variadic.op}bar:$this:$parent`, expected: new variadic.ctor(new AccessScope('foo', 0), 'bar', [new AccessThis(0), new AccessThis(1)]) },
        { expression: `foo${variadic.op}bar:$parent:$this`, expected: new variadic.ctor(new AccessScope('foo', 0), 'bar', [new AccessThis(1), new AccessThis(0)]) },
        { expression: `foo${variadic.op}bar:$parent.$parent:$parent.$parent`, expected: new variadic.ctor(new AccessScope('foo', 0), 'bar', [new AccessThis(2), new AccessThis(2)]) }
      ];
  
      for (const test of tests) {
        it(test.expression, () => {
          let expression = parser.parse(test.expression);
          verifyEqual(expression, test.expected);
        });
      }
    });
  }


  it('parses binding behavior', () => {
    let expression = parser.parse('foo & bar');
    verifyEqual(expression,
      new BindingBehavior(new AccessScope('foo', 0), 'bar', [])
    );
  });

  it('parses chained binding behaviors', () => {
    let expression = parser.parse('foo & bar:x:y:z & baz:a:b:c');
    verifyEqual(expression,
      new BindingBehavior(
        new BindingBehavior(
          new AccessScope('foo', 0),
          'bar',
          [
            new AccessScope('x', 0),
            new AccessScope('y', 0),
            new AccessScope('z', 0)
          ]
        ), 
        'baz', 
        [
          new AccessScope('a', 0),
          new AccessScope('b', 0),
          new AccessScope('c', 0)
        ]
      )
    );
  });

  it('parses value converter', () => {
    let expression = parser.parse('foo | bar');
    verifyEqual(expression,
      new ValueConverter(new AccessScope('foo', 0), 'bar', [])
    );
  });

  it('parses chained value converters', () => {
    let expression = parser.parse('foo | bar:x:y:z | baz:a:b:c');
    verifyEqual(expression,
      new ValueConverter(
        new ValueConverter(
          new AccessScope('foo', 0),
          'bar',
          [
            new AccessScope('x', 0),
            new AccessScope('y', 0),
            new AccessScope('z', 0)
          ]
        ), 
        'baz', 
        [
          new AccessScope('a', 0),
          new AccessScope('b', 0),
          new AccessScope('c', 0)
        ]
      )
    );
  });

  it('parses chained value converters and binding behaviors', () => {
    let expression = parser.parse('foo | bar:x:y:z & baz:a:b:c');
    verifyEqual(expression,
      new BindingBehavior(
        new ValueConverter(
          new AccessScope('foo', 0),
          'bar',
          [
            new AccessScope('x', 0),
            new AccessScope('y', 0),
            new AccessScope('z', 0)
          ]
        ), 
        'baz', 
        [
          new AccessScope('a', 0),
          new AccessScope('b', 0),
          new AccessScope('c', 0)
        ]
      )
    );
  });

  it('parses value converter with Conditional argument', () => {
    let expression = parser.parse('foo | bar : foo ? bar : baz');
    verifyEqual(expression,
      new ValueConverter(
        new AccessScope('foo', 0),
        'bar',
        [
          new Conditional(
            new AccessScope('foo', 0),
            new AccessScope('bar', 0),
            new AccessScope('baz', 0)
          )
        ])
    );
  });

  it('parses value converter with Assign argument', () => {
    let expression = parser.parse('foo | bar : foo = bar');
    verifyEqual(expression,
      new ValueConverter(
        new AccessScope('foo', 0),
        'bar',
        [
          new Assign(
            new AccessScope('foo', 0),
            new AccessScope('bar', 0)
          )
        ])
    );
  });

  describe('parses value converter with Binary argument', () => {
    for (let op of operators) {
      it(`\"${op}\"`, () => {
        let expression = parser.parse(`foo | bar : foo ${op} bar`);
        verifyEqual(expression,
          new ValueConverter(
            new AccessScope('foo', 0),
            'bar',
            [
              new Binary(
                op,
                new AccessScope('foo', 0),
                new AccessScope('bar', 0)
              )
            ])
        );
      });
    }
  });

  it('parses AccessScope', () => {
    let expression = parser.parse('foo');
    verifyEqual(expression, new AccessScope('foo', 0));
  });

  describe('parses AccessKeyed', () => {
    const tests = [
      { expression: 'foo[bar]', expected: new AccessKeyed(new AccessScope('foo', 0), new AccessScope('bar', 0)) },
      { expression: 'foo[\'bar\']', expected: new AccessKeyed(new AccessScope('foo', 0), new LiteralString('bar')) },
      { expression: 'foo[0]', expected: new AccessKeyed(new AccessScope('foo', 0), new LiteralPrimitive(0)) },
      { expression: 'foo[(0)]', expected: new AccessKeyed(new AccessScope('foo', 0), new LiteralPrimitive(0)) },
      { expression: '(foo)[0]', expected: new AccessKeyed(new AccessScope('foo', 0), new LiteralPrimitive(0)) },
      { expression: 'foo[null]', expected: new AccessKeyed(new AccessScope('foo', 0), new LiteralPrimitive(null)) },
      { expression: '\'foo\'[0]', expected: new AccessKeyed(new LiteralString('foo'), new LiteralPrimitive(0)) },
      { expression: 'foo()[bar]', expected: new AccessKeyed(new CallScope('foo', [], 0), new AccessScope('bar', 0)) },
      { expression: 'a[b[c]]', expected: new AccessKeyed(new AccessScope('a', 0), new AccessKeyed(new AccessScope('b', 0), new AccessScope('c', 0))) },
      { expression: 'a[b][c]', expected: new AccessKeyed(new AccessKeyed(new AccessScope('a', 0), new AccessScope('b', 0)), new AccessScope('c', 0)) }
    ];

    for (const test of tests) {
      it(test.expression, () => {
        let expression = parser.parse(test.expression);
        verifyEqual(expression, test.expected);
      });

      it(`(${test.expression})`, () => {
        let expression = parser.parse(`(${test.expression})`);
        verifyEqual(expression, test.expected);
      });
    }
  });

  it('parses AccessMember', () => {
    let expression = parser.parse('foo.bar');
    verifyEqual(expression, 
      new AccessMember(new AccessScope('foo', 0), 'bar')
    );
  });

  it('parses AccessMember with indexed string property', () => {
    let expression = parser.parse('foo["bar"].baz');
    verifyEqual(expression,
      new AccessMember(
        new AccessKeyed(
          new AccessScope('foo', 0),
          new LiteralString('bar')
        ),
        'baz'
      )
    );
  });

  it('parses AccessMember with indexed numeric property', () => {
    let expression = parser.parse('foo[42].baz');
    verifyEqual(expression, 
      new AccessMember(
        new AccessKeyed(
          new AccessScope('foo', 0),
          new LiteralPrimitive(42)
        ),
        'baz'
      )
    );
  });

  it('parses Assign', () => {
    let expression = parser.parse('foo = bar');
    verifyEqual(expression, 
      new Assign(
        new AccessScope('foo', 0),
        new AccessScope('bar', 0)
      )
    );
  });

  it('parses Assign to ignored Unary', () => {
    let expression = parser.parse('+foo = bar');
    verifyEqual(expression, 
      new Assign(
        new AccessScope('foo', 0),
        new AccessScope('bar', 0)
      )
    );
  });

  it('parses chained Assign', () => {
    let expression = parser.parse('foo = bar = baz');
    verifyEqual(expression, 
      new Assign(
        new Assign(
          new AccessScope('foo', 0),
          new AccessScope('bar', 0)
        ),
        new AccessScope('baz', 0)
      )
    );
  });

  describe('parses CallExpression', () => {
    const tests = [//a(b({a:b,c:d})[c({})[d({})]])
      { expression: 'a()()()', expected: new CallFunction(new CallFunction(new CallScope('a', [], 0), []), []) },
      { expression: 'a(b(c()))', expected: new CallScope('a', [new CallScope('b', [new CallScope('c', [], 0)], 0)], 0) },
      { expression: 'a(b(),c())', expected: new CallScope('a', [new CallScope('b', [], 0), new CallScope('c', [], 0)], 0) },
      { expression: 'a()[b]()', expected: new CallFunction(new AccessKeyed(new CallScope('a', [], 0), new AccessScope('b', 0)), []) },
      { expression: '{foo}[\'foo\']()', expected: new CallFunction(new AccessKeyed(new LiteralObject(['foo'], [new AccessScope('foo', 0)]), new LiteralString('foo')), []) },
      { expression: 'a(b({})[c()[d()]])', expected: new CallScope('a', [new AccessKeyed(new CallScope('b', [new LiteralObject([], [])], 0), new AccessKeyed(new CallScope('c', [], 0), new CallScope('d', [], 0)))], 0) }
    ];


    for (const test of tests) {
      it(test.expression, () => {
        let expression = parser.parse(test.expression);
        verifyEqual(expression, test.expected);
      });

      it(`(${test.expression})`, () => {
        let expression = parser.parse(`(${test.expression})`);
        verifyEqual(expression, test.expected);
      });
    }
  });

  it('parses CallScope', () => {
    let expression = parser.parse('foo(x)');
    verifyEqual(expression, 
      new CallScope('foo', [new AccessScope('x', 0)], 0)
    );
  });

  it('parses nested CallScope', () => {
    let expression = parser.parse('foo(bar(x), y)');
    verifyEqual(expression, 
      new CallScope(
        'foo',
        [
          new CallScope(
            'bar',
            [new AccessScope('x', 0)],
            0),
          new AccessScope('y', 0)
        ], 0)
    );
  });

  it('parses CallMember', () => {
    let expression = parser.parse('foo.bar(x)');
    verifyEqual(expression,
      new CallMember(
        new AccessScope('foo', 0),
        'bar',
        [new AccessScope('x', 0)]
      )
    );
  });

  it('parses nested CallMember', () => {
    let expression = parser.parse('foo.bar.baz(x)');
    verifyEqual(expression,
      new CallMember(
        new AccessMember(
          new AccessScope('foo', 0),
          'bar'
        ),
        'baz',
        [new AccessScope('x', 0)]
      )
    );
  });

  it('parses $this', () => {
    let expression = parser.parse('$this');
    verifyEqual(expression, new AccessThis(0));
  });

  it('translates $this.member to AccessScope', () => {
    let expression = parser.parse('$this.foo');
    verifyEqual(expression,
      new AccessScope('foo', 0)
    );
  });

  it('translates $this() to CallFunction', () => {
    let expression = parser.parse('$this()');
    verifyEqual(expression,
      new CallFunction(new AccessThis(0), []));
  });

  it('translates $this.member() to CallScope', () => {
    let expression = parser.parse('$this.foo(x)');
    verifyEqual(expression,
      new CallScope('foo', [new AccessScope('x', 0)], 0)
    );
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
  describe('parses $parent', () => {
    for (const parent of parents) {
      it(parent.name, () => {
        let expression = parser.parse(parent.name);
        verifyEqual(expression, new AccessThis(parent.i));
      });

      it(`${parent.name} before value converter`, () => {
        let expression = parser.parse(`${parent.name} | foo`);
        verifyEqual(expression,
          new ValueConverter(new AccessThis(parent.i), 'foo', [])
        );
      });

      it(`${parent.name}.bar before value converter`, () => {
        let expression = parser.parse(`${parent.name}.bar | foo`);
        verifyEqual(expression,
          new ValueConverter(new AccessScope('bar', parent.i), 'foo', [])
        );
      });

      it(`${parent.name} before binding behavior`, () => {
        let expression = parser.parse(`${parent.name} & foo`);
        verifyEqual(expression,
          new BindingBehavior(new AccessThis(parent.i), 'foo', [])
        );
      });

      it(`${parent.name}.bar before binding behavior`, () => {
        let expression = parser.parse(`${parent.name}.bar & foo`);
        verifyEqual(expression,
          new BindingBehavior(new AccessScope('bar', parent.i), 'foo', [])
        );
      });
    }
  });
  describe('translates $parent', () => {
    for (const parent of parents) {
      it(`${parent.name}.foo to AccessScope`, () => {
        let expression = parser.parse(`${parent.name}.foo`);
        verifyEqual(expression,
          new AccessScope(`foo`, parent.i)
        );
      });
  
      it(`${parent.name}.foo() to CallScope`, () => {
        let expression = parser.parse(`${parent.name}.foo()`);
        verifyEqual(expression,
          new CallScope(`foo`, [], parent.i)
        );
      });
  
      it(`${parent.name}() to CallFunction`, () => {
        let expression = parser.parse(`${parent.name}()`);
        verifyEqual(expression,
          new CallFunction(new AccessThis(parent.i), [])
        );
      });
  
      it(`${parent.name}[0] to AccessKeyed`, () => {
        let expression = parser.parse(`${parent.name}[0]`);
        verifyEqual(expression,
          new AccessKeyed(
            new AccessThis(parent.i),
            new LiteralPrimitive(0)
          )
        );
      });
    }
  });

  it('handles $parent inside CallMember', () => {
    let expression = parser.parse('matcher.bind($parent)');
    verifyEqual(expression,
      new CallMember(
        new AccessScope('matcher', 0),
        'bind',
        [new AccessThis(1)]
      )
    );
  });

  it('parses $parent in LiteralObject', () => {
    let expression = parser.parse('{parent: $parent}');
    verifyEqual(expression,
      new LiteralObject(
        ['parent'],
        [new AccessThis(1)]
      )
    );
  });

  it('parses $parent and foo in LiteralObject', () => {
    let expression = parser.parse('{parent: $parent, foo: bar}');
    verifyEqual(expression,
      new LiteralObject(
        [
          'parent',
          'foo'
        ],
        [
          new AccessThis(1),
          new AccessScope('bar', 0)
        ]
      )
    );
  });

  describe('parses LiteralObject', () => {
    const tests = [
      { expression: '', expected: new LiteralObject([], []) },
      { expression: 'foo', expected: new LiteralObject(['foo'], [new AccessScope('foo', 0)]) },
      { expression: 'foo,bar', expected: new LiteralObject(['foo','bar'], [new AccessScope('foo', 0), new AccessScope('bar', 0)]) },
      { expression: 'foo:bar', expected: new LiteralObject(['foo'], [new AccessScope('bar', 0)]) },
      { expression: 'foo:bar()', expected: new LiteralObject(['foo'], [new CallScope('bar', [], 0)]) },
      { expression: 'foo:a?b:c', expected: new LiteralObject(['foo'], [new Conditional(new AccessScope('a', 0), new AccessScope('b', 0), new AccessScope('c', 0))]) },
      { expression: 'foo:bar=((baz))', expected: new LiteralObject(['foo'], [new Assign(new AccessScope('bar', 0), new AccessScope('baz', 0))]) },
      { expression: 'foo:(bar)===baz', expected: new LiteralObject(['foo'], [new Binary('===', new AccessScope('bar', 0), new AccessScope('baz', 0))]) },
      { expression: 'foo:[bar]', expected: new LiteralObject(['foo'], [new LiteralArray([new AccessScope('bar', 0)])]) },
      { expression: 'foo:bar[baz]', expected: new LiteralObject(['foo'], [new AccessKeyed(new AccessScope('bar', 0), new AccessScope('baz', 0))]) },
      { expression: '\'foo\':1', expected: new LiteralObject(['foo'], [new LiteralPrimitive(1)]) },
      { expression: '1:1', expected: new LiteralObject([1], [new LiteralPrimitive(1)]) },
      { expression: '1:\'foo\'', expected: new LiteralObject([1], [new LiteralString('foo')]) },
      { expression: 'null:1', expected: new LiteralObject(['null'], [new LiteralPrimitive(1)]) },
      { expression: 'foo:{}', expected: new LiteralObject(['foo'], [new LiteralObject([], [])]) },
      { expression: 'foo:{bar}[baz]', expected: new LiteralObject(['foo'], [new AccessKeyed(new LiteralObject(['bar'], [new AccessScope('bar', 0)]), new AccessScope('baz', 0))]) }
    ];

    for (const test of tests) {
      it(`{${test.expression}}`, () => {
        let expression = parser.parse(`{${test.expression}}`);
        verifyEqual(expression, test.expected);
      });

      it(`({${test.expression}})`, () => {
        let expression = parser.parse(`({${test.expression}})`);
        verifyEqual(expression, test.expected);
      });
    }
  });

  describe('does not parse LiteralObject with computed property', () => {
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

  describe('does not parse invalid shorthand properties', () => {
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

  describe('does not parse multiple expressions', () => {
    const expressions = [
      ';',
      'foo;',
      ';foo',
      'foo&bar;baz|qux'
    ];

    for (const expr of expressions) {
      it(expr, () => {
        _verifyError(expr, 'Multiple expressions are not allowed');
      });
    }
  });

  describe('throw on extra closing token', () => {
    const tests = [
      { expr: ')', token: ')' },
      { expr: ']', token: ']' },
      { expr: '}', token: '}' },
      { expr: 'foo())', token: ')' },
      { expr: 'foo[x]]', token: ']' },
      { expr: '{foo}}', token: '}' }
    ];

    for (const test of tests) {
      it(test.expr, () => {
        _verifyError(test.expr, `Unconsumed token ${test.token}`);
      });
    }
  });

  describe('throw on missing expected token', () => {
    const tests = [
      { expr: '(foo', token: ')' },
      { expr: '[foo', token: ']' },
      { expr: '{foo', token: ',' },
      { expr: 'foo(bar', token: ')' },
      { expr: 'foo[bar', token: ']' },
      { expr: 'foo.bar(baz', token: ')' },
      { expr: 'foo.bar[baz', token: ']' }
    ];

    for (const test of tests) {
      it(test.expr, () => {
        _verifyError(test.expr, `Missing expected token ${test.token}`);
      });
    }
  });

  describe('throw on assigning unassignable', () => {
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
    ].concat(operators.map(op => `foo ${op} bar = baz`));

    for (const expr of expressions) {
      it(expr, () => {
        _verifyError(expr, 'is not assignable');
      });
    }
  });

  it('throw on incomplete conditional', () => {
    _verifyError('foo ? bar', 'Missing expected token : at column 9');
  });

  describe('throw on invalid primary expression', () => {
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

  describe('throw on invalid exponent', () => {
    const expressions = [
      '1e',
      '1ee',
      '1e.'
    ];

    for (const expr of expressions) {
      it(expr, () => {
        _verifyError(expr, 'Invalid exponent');
      });
    }
  });

  describe('parses unicode IdentifierStart', () => {
    for (const char of latin1IdentifierStartChars) {
      it(char, () => {
        const expression = parser.parse(char);
        verifyEqual(expression,
          new AccessScope(char, 0)
        );
      });
    }
  });

  describe('parses unicode IdentifierPart', () => {
    for (const char of latin1IdentifierPartChars) {
      it(char, () => {
        const identifier = '$' + char;
        const expression = parser.parse(identifier);
        verifyEqual(expression,
          new AccessScope(identifier, 0)
        );
      });
    }
  });

  describe('throws on unknown unicode IdentifierPart', () => {
    for (const char of otherBMPIdentifierPartChars) {
      it(char, () => {
        const identifier = '$' + char;
        _verifyError(identifier, `Unexpected character [${char}] at column 1`);
      });
    }
  });

  it('throws on double dot (parseAccessOrCallMember)', () => {
    _verifyError('foo..bar', `Unexpected token . at column 4`);
  });

  it('throws on double dot (parseAccessOrCallScope)', () => {
    _verifyError('$parent..bar', `Unexpected token . at column 8`);
  });

  describe('addIdentifierPartStart', () => {
    const asciiChars = ['~', '@', '#', '\\'];
  
    beforeEach(() => {
      parser = new Parser();
    });

    for (const asciiChar of asciiChars.slice(0, 1)) {
      it(`addIdentifierStart works for ASCII character ${asciiChar}`, () => {
        parserConfig.addIdentifierStart(asciiChar);
        verifyEqual(parser.parse(asciiChar), new AccessScope(asciiChar, 0));
      });
    }

    for (const asciiChar of asciiChars.slice(2, 3)) {
      it(`addIdentifierPart works for ASCII character ${asciiChar}`, () => {
        parserConfig.addIdentifierPart(asciiChar);
        verifyEqual(parser.parse(`$${asciiChar}`), new AccessScope(`$${asciiChar}`, 0));
      });
    }

    it('addIdentifierStart works for unicode characters', () => {
      parserConfig.addIdentifierStart('ಠ');
      verifyEqual(parser.parse('ಠ_ಠ'), new AccessScope('ಠ_ಠ', 0));
    });

    it('addIdentifierPart works for unicode characters', () => {
      parserConfig.addIdentifierPart('漢');
      verifyEqual(parser.parse(`$漢`), new AccessScope('$漢', 0));
      verifyError(parser, '漢', `Unexpected character [漢]`);
    });
  });

  function _verifyError(expression, errorMessage = '') {
    verifyError(parser, expression, errorMessage);
  }
});


function verifyError(parser, expression, errorMessage = '') {
  let error = null;
  try {
    parser.parse(expression);
  } catch(e) {
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
