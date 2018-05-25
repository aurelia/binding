import {LiteralTemplate, LiteralString, AccessScope, AccessMember, AccessKeyed} from '../../src/ast';
import {createScopeForTest} from '../../src/scope';

class Test {
  constructor() {
    this.value = 'foo';
  }

  makeString(cooked, a, b) {
    return cooked[0] + a + cooked[1] + b + cooked[2] + this.value;
  }
}

describe('LiteralTemplate', () => {
  const tests = [
    { expr: new LiteralTemplate(['']), expected: '', ctx: {} },
    { expr: new LiteralTemplate(['foo']), expected: 'foo', ctx: {} },
    { expr: new LiteralTemplate(['foo', 'baz'], [new LiteralString('bar')]), expected: 'foobarbaz', ctx: {} },
    { expr: new LiteralTemplate(['a', 'c', 'e', 'g'], [new LiteralString('b'), new LiteralString('d'), new LiteralString('f')]), expected: 'abcdefg', ctx: {} },
    { expr: new LiteralTemplate(['a', 'c', 'e'], [new AccessScope('b'), new AccessScope('d')]), expected: 'a1c2e', ctx: { b: 1, d: 2 } },
    { expr: new LiteralTemplate([''], [], [], new AccessScope('foo', 0)), expected: 'foo', ctx: {foo: () => 'foo'} },
    { expr: new LiteralTemplate(['foo'], [], ['bar'], new AccessScope('baz', 0)), expected: 'foobar', ctx: {baz: (cooked) => cooked[0] + cooked.raw[0]} },
    { expr: new LiteralTemplate(['1', '2'], [new LiteralString('foo')], [], new AccessScope('makeString', 0)), expected: '1foo2', ctx: {makeString: (cooked, foo) => cooked[0] + foo + cooked[1]} },
    { expr: new LiteralTemplate(['1', '2'], [new AccessScope('foo')], [], new AccessScope('makeString', 0)), expected: '1bar2', ctx: {foo: 'bar', makeString: (cooked, foo) => cooked[0] + foo + cooked[1]} },
    { expr: new LiteralTemplate(['1', '2', '3'], [new AccessScope('foo'), new AccessScope('bar')], [], new AccessScope('makeString', 0)), expected: 'bazqux', ctx: {foo: 'baz', bar: 'qux', makeString: (cooked, foo, bar) => foo + bar} },
    { expr: new LiteralTemplate(['1', '2', '3'], [new AccessScope('foo'), new AccessScope('bar')], [], new AccessMember(new AccessScope('test', 0), 'makeString')), expected: '1baz2qux3foo', ctx: {foo: 'baz', bar: 'qux', test: new Test()} },
    { expr: new LiteralTemplate(['1', '2', '3'], [new AccessScope('foo'), new AccessScope('bar')], [], new AccessKeyed(new AccessScope('test', 0), new LiteralString('makeString'))), expected: '1baz2qux3foo', ctx: {foo: 'baz', bar: 'qux', test: new Test()} }
  ];
  for (const { expr, expected, ctx } of tests) {
    it(`evaluates ${expected}`, () => {
      const scope = createScopeForTest(ctx);
      expect(expr.evaluate(scope, null)).toEqual(expected);
    });
  }
});
