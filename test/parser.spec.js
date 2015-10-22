import {Parser} from '../src/parser';
import {
  LiteralString,
  LiteralPrimitive,
  ValueConverter,
  BindingBehavior,
  AccessScope
} from '../src/ast';

describe('Parser', () => {
  let parser;

  beforeAll(() => {
    parser = new Parser();
  });

  it('parses literal primitives', () => {
    // http://es5.github.io/x7.html#x7.8.4
    let tests = [
      { expression: '\'foo\'', value: 'foo', type: LiteralString },
      { expression: '\'\\\\\'', value: '\\', type: LiteralString },
      { expression: '\'\\\'\'', value: '\'', type: LiteralString },
      { expression: '\'"\'', value: '"', type: LiteralString },
      { expression: '\'\\f\'', value: '\f', type: LiteralString },
      { expression: '\'\\n\'', value: '\n', type: LiteralString },
      { expression: '\'\\r\'', value: '\r', type: LiteralString },
      { expression: '\'\\t\'', value: '\t', type: LiteralString },
      { expression: '\'\\v\'', value: '\v', type: LiteralString },
      { expression: 'true', value: true, type: LiteralPrimitive },
      { expression: 'false', value: false, type: LiteralPrimitive },
      { expression: 'null', value: null, type: LiteralPrimitive },
      { expression: 'undefined', value: undefined, type: LiteralPrimitive },
      { expression: '0', value: 0, type: LiteralPrimitive },
      { expression: '1', value: 1, type: LiteralPrimitive },
      { expression: '2.2', value: 2.2, type: LiteralPrimitive }
    ];

    for (let i = 0; i < tests.length; i++) {
      let test = tests[i];
      let expression = parser.parse(test.expression);
      expect(expression instanceof test.type).toBe(true);
      expect(expression.value).toEqual(test.value);
    }
  });

  it('parses binding behaviors', () => {
    let expression = parser.parse('foo & bar');
    expect(expression instanceof BindingBehavior).toBe(true);
    expect(expression.name).toBe('bar');
    expect(expression.expression instanceof AccessScope).toBe(true);

    expression = parser.parse('foo & bar:x:y:z & baz:a:b:c');
    expect(expression instanceof BindingBehavior).toBe(true);
    expect(expression.name).toBe('baz');
    expect(expression.args).toEqual([new AccessScope('a'), new AccessScope('b'), new AccessScope('c')])
    expect(expression.expression instanceof BindingBehavior).toBe(true);
    expect(expression.expression.name).toBe('bar');
    expect(expression.expression.args).toEqual([new AccessScope('x'), new AccessScope('y'), new AccessScope('z')])
    expect(expression.expression.expression instanceof AccessScope).toBe(true);
  });

  it('parses value converters', () => {
    let expression = parser.parse('foo | bar');
    expect(expression instanceof ValueConverter).toBe(true);
    expect(expression.name).toBe('bar');
    expect(expression.expression instanceof AccessScope).toBe(true);

    expression = parser.parse('foo | bar:x:y:z | baz:a:b:c');
    expect(expression instanceof ValueConverter).toBe(true);
    expect(expression.name).toBe('baz');
    expect(expression.args).toEqual([new AccessScope('a'), new AccessScope('b'), new AccessScope('c')])
    expect(expression.expression instanceof ValueConverter).toBe(true);
    expect(expression.expression.name).toBe('bar');
    expect(expression.expression.args).toEqual([new AccessScope('x'), new AccessScope('y'), new AccessScope('z')])
    expect(expression.expression.expression instanceof AccessScope).toBe(true);
  });

  it('parses value converters and binding behaviors', () => {
    let expression = parser.parse('foo | bar:x:y:z & baz:a:b:c');
    expect(expression instanceof BindingBehavior).toBe(true);
    expect(expression.name).toBe('baz');
    expect(expression.args).toEqual([new AccessScope('a'), new AccessScope('b'), new AccessScope('c')])
    expect(expression.expression instanceof ValueConverter).toBe(true);
    expect(expression.expression.name).toBe('bar');
    expect(expression.expression.args).toEqual([new AccessScope('x'), new AccessScope('y'), new AccessScope('z')])
    expect(expression.expression.expression instanceof AccessScope).toBe(true);
  });
});
