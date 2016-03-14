import {Container} from 'aurelia-dependency-injection';
import {Parser} from '../src/parser';
import {rebaseExpression} from '../src/expression-rebaser';

describe('ExpressionRebaser', () => {
  let parser;

  beforeAll(() => {
    let container = new Container();
    parser = container.get(Parser);
  });

  it('should rebase', () => {
    let expressions = [
      { original: 'foo', result: 'test.foo' },
      { original: 'foo.bar.baz', result: 'test.foo.bar.baz' },
      { original: 'foo|converter:bar:baz', result: 'test.foo|converter:test.bar:test.baz' },
      { original: 'foo(a.b.c,d[e][f])', result: 'test.foo(test.a.b.c,test.d[test.e][test.f])' },
      { original: '$this', result: 'test' },
    ];
    let i = expressions.length;
    let base = parser.parse('test');
    while (i--) {
      let original = parser.parse(expressions[i].original);
      let rebased = rebaseExpression(original, base);
      expect(rebased.toString()).toBe(expressions[i].result);
    }
    expect(() => rebaseExpression(parser.parse('$parent.foo'), base)).toThrow();
    expect(() => rebaseExpression(parser.parse('$parent.foo()'), base)).toThrow();
  });
});
