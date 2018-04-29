import { Parser } from '../src/parser';
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
  AccessAncestor,
  Assign,
  Conditional,
  Binary,
  Expression,
  PrefixNot
} from '../src/ast';

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

  describe('parses literal primitive', () => {
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
      { expression: '\'\\v\'', expected: new LiteralString('\v') },
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
      { expression: '.42E10', expected: new LiteralPrimitive(.42e10) }
    ];

    for (const test of tests) {
      it(test.expression, () => {
        let expression = parser.parse(test.expression);
        verifyEqual(expression, test.expected);
      });
    }
  });

  it('parses conditional', () => {
    let expression = parser.parse('foo ? bar : baz');
    verifyEqual(expression,
      new Conditional(
        new AccessScope('foo', 0),
        new AccessScope('bar', 0),
        new AccessScope('baz', 0)
      )
    );
  });

  it('parses nested conditional', () => {
    let expression = parser.parse('foo ? bar : foo1 ? bar1 : baz');
    verifyEqual(expression,
      new Conditional(
        new AccessScope('foo', 0),
        new AccessScope('bar', 0),
        new Conditional(
          new AccessScope('foo1', 0),
          new AccessScope('bar1', 0),
          new AccessScope('baz', 0)
        )
      )
    );
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

  it('parses AccessScope', () => {
    let expression = parser.parse('foo');
    verifyEqual(expression, new AccessScope('foo', 0));
  });

  it('parses AccessMember', () => {
    let expression = parser.parse('foo.bar');
    verifyEqual(expression, 
      new AccessMember(new AccessScope('foo', 0), 'bar')
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

  it('parses $parent', () => {
    let s = '$parent';
    for (let i = 1; i < 10; i++) {
      let expression = parser.parse(s);
      verifyEqual(expression, new AccessThis(i));
      s += '.$parent';
    }
  });

  it('parses $parent before value converter', () => {
    let child = '';
    for (let i = 1; i < 10; i++) {
      let s = `$parent${child} | foo`;
      let expression = parser.parse(s);
      verifyEqual(expression,
        new ValueConverter(new AccessThis(i), 'foo', [])
      );
      child += '.$parent';
    }
  });

  it('parses $parent.foo before value converter', () => {
    let child = '';
    for (let i = 1; i < 10; i++) {
      let s = `$parent${child}.bar | foo`;
      let expression = parser.parse(s);
      verifyEqual(expression,
        new ValueConverter(new AccessScope('bar', i), 'foo', [])
      );
      child += '.$parent';
    }
  });

  it('parses $parent before binding behavior', () => {
    let child = '';
    for (let i = 1; i < 10; i++) {
      let s = `$parent${child} & foo`;
      let expression = parser.parse(s);
      verifyEqual(expression,
        new BindingBehavior(new AccessThis(i), 'foo', [])
      );
      child += '.$parent';
    }
  });

  it('parses $parent.foo before binding behavior', () => {
    let child = '';
    for (let i = 1; i < 10; i++) {
      let s = `$parent${child}.bar & foo`;
      let expression = parser.parse(s);
      verifyEqual(expression,
        new BindingBehavior(new AccessScope('bar', i), 'foo', [])
      );
      child += '.$parent';
    }
  });

  it('translates $parent.foo to AccessScope', () => {
    let s = '$parent.foo';
    for (let i = 1; i < 10; i++) {
      let expression = parser.parse(s);
      verifyEqual(expression,
        new AccessScope('foo', i)
      );
      s = '$parent.' + s;
    }
  });

  it('translates $parent.foo() to CallScope', () => {
    let s = '$parent.foo()';
    for (let i = 1; i < 10; i++) {
      let expression = parser.parse(s);
      verifyEqual(expression,
        new CallScope('foo', [], i)
      );
      s = '$parent.' + s;
    }
  });

  it('translates $parent() to CallFunction', () => {
    let s = '$parent()';
    for (let i = 1; i < 10; i++) {
      let expression = parser.parse(s);
      verifyEqual(expression,
        new CallFunction(new AccessThis(i), [])
      );
      s = '$parent.' + s;
    }
  });

  it('translates $parent[0] to AccessKeyed', () => {
    let s = '$parent[0]';
    for (let i = 1; i < 10; i++) {
      let expression = parser.parse(s);
      verifyEqual(expression,
        new AccessKeyed(
          new AccessThis(i),
          new LiteralPrimitive(0)
        )
      );
      s = '$parent.' + s;
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

  it('parses es6 shorthand LiteralObject', () => {
    let expression = parser.parse('{ foo, bar }');
    verifyEqual(expression,
      new LiteralObject(
        [
          'foo',
          'bar'
        ],
        [
          new AccessScope('foo', 0),
          new AccessScope('bar', 0)
        ]
      )
    );
  });

  it('does not parse invalid shorthand properties', () => {
    let pass = false;
    try {
      parser.parse('{ foo.bar, bar.baz }');
      pass = true;
    } catch (e) { pass = false; }
    expect(pass).toBe(false);

    try {
      parser.parse('{ "foo.bar" }');
      pass = true;
    } catch (e) { pass = false; }
    expect(pass).toBe(false);
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
        try {
          parser.parse(expr);
        } catch(e) {
          expect(e.message).toContain('Multiple expressions are not allowed');
        }
      });
    }
  });

  describe('throw on extra closing token', () => {
    const expressions = [
      ')',
      ']',
      '}',
      'foo())',
      'foo[x]]',
      '{foo}}'
    ];

    for (const expr of expressions) {
      it(expr, () => {
        try {
          parser.parse(expr);
        } catch(e) {
          expect(e.message).toContain('Unconsumed token');
        }
      });
    }
  });

  describe('throw on assigning unassignable', () => {
    const expressions = [
      'foo ? bar : baz = qux',
      '$this = foo',
      'foo() = bar',
      'foo.bar() = baz',
      '!foo = bar',
      '-foo = bar',
      '-foo = bar',
      '\'foo\' = bar',
      '42 = foo',
      '[] = foo',
      '{} = foo'
    ].concat(operators.map(op => `foo ${op} bar`));

    for (const expr of expressions) {
      it(expr, () => {
        try {
          parser.parse(expr);
        } catch(e) {
          expect(e.message).toContain('is not assignable');
        }
      });
    }
  });

  it('throw on incomplete conditional', () => {
    try {
      parser.parse('foo ? bar');
    } catch(e) {
      expect(e.message).toContain('requires all 3 expressions');
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
        try {
          parser.parse(expr);
        } catch(e) {
          expect(e.message).toContain('Invalid exponent');
        }
      });
    }
  });
});

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

  expect(actual).toEqual(jasmine.any(expected.constructor));
  for (const prop of Object.keys(expected)) {
    verifyEqual(actual[prop], expected[prop]);
  }
}

function unicodeEscape(str) {
	return str.replace(/[\s\S]/g, c => `\\u${('0000' + c.charCodeAt().toString(16)).slice(-4)}`);
}
