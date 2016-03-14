import {Container} from 'aurelia-dependency-injection';
import {Parser} from '../src/parser';
import {cloneExpression} from '../src/expression-cloner';

describe('ExpressionCloner', () => {
  let parser;

  beforeAll(() => {
    let container = new Container();
    parser = container.get(Parser);
  });

  it('should clone', () => {
    let expressions = [
      'foo|bar:a|baz:b:c&bap:d&bop:e:f',
      'foo&bar:baz',
      'foo|bar:baz',
      'foo()',
      'foo(bar,baz)',
      'foo.bar.baz',
      `{'a':b,'c':d,'e':f}`,
      '[a,b,c]',
      'foo'
    ];
    let i = expressions.length;
    while (i--) {
      let expression = parser.parse(expressions[i]);
      let clone = cloneExpression(expression);
      expect(expression.toString()).toBe(clone.toString());
      expect(expression).not.toBe(clone);
    }
  });
});
