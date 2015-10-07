import {Parser} from '../src/parser';
import {
  LiteralString,
  LiteralPrimitive
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
});
