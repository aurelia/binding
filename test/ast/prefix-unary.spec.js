import { PrefixUnary, LiteralString, LiteralPrimitive, LiteralObject, AccessThis, AccessScope, AccessMember, LiteralArray, CallFunction, CallScope } from '../../src/ast';
import { createScopeForTest } from '../../src/scope';

describe('PrefixUnary', () => {
  describe('performs \'typeof\'', () => {
    const tests = [
      { expr: new PrefixUnary('typeof', new LiteralString('foo')), expected: 'string' },
      { expr: new PrefixUnary('typeof', new LiteralPrimitive(1)), expected: 'number' },
      { expr: new PrefixUnary('typeof', new LiteralPrimitive(null)), expected: 'object' },
      { expr: new PrefixUnary('typeof', new LiteralPrimitive(undefined)), expected: 'undefined' },
      { expr: new PrefixUnary('typeof', new LiteralPrimitive(true)), expected: 'boolean' },
      { expr: new PrefixUnary('typeof', new LiteralPrimitive(false)), expected: 'boolean' },
      { expr: new PrefixUnary('typeof', new LiteralArray([])), expected: 'object' },
      { expr: new PrefixUnary('typeof', new LiteralObject([], [])), expected: 'object' },
      { expr: new PrefixUnary('typeof', new AccessThis(0)), expected: 'object' },
      { expr: new PrefixUnary('typeof', new AccessThis(1)), expected: 'undefined' },
      { expr: new PrefixUnary('typeof', new AccessScope('foo', 0)), expected: 'undefined' }
    ];
    let scope = createScopeForTest({});

    for (const { expr, expected } of tests) {
      it(expr.toString(), () => {
        expect(expr.evaluate(scope, null)).toBe(expected);
      });
    }
  });

  describe('performs \'void\'', () => {
    const tests = [
      { expr: new PrefixUnary('void', new LiteralString('foo')) },
      { expr: new PrefixUnary('void', new LiteralPrimitive(1)) },
      { expr: new PrefixUnary('void', new LiteralPrimitive(null)) },
      { expr: new PrefixUnary('void', new LiteralPrimitive(undefined)) },
      { expr: new PrefixUnary('void', new LiteralPrimitive(true)) },
      { expr: new PrefixUnary('void', new LiteralPrimitive(false)) },
      { expr: new PrefixUnary('void', new LiteralArray([])) },
      { expr: new PrefixUnary('void', new LiteralObject([], [])) },
      { expr: new PrefixUnary('void', new AccessThis(0)) },
      { expr: new PrefixUnary('void', new AccessThis(1)) },
      { expr: new PrefixUnary('void', new AccessScope('foo', 0)) }
    ];
    let scope = createScopeForTest({});

    for (const { expr } of tests) {
      it(expr.toString(), () => {
        expect(expr.evaluate(scope, null)).toBe(undefined);
      });
    }

    it('void foo()', () => {
      let fooCalled = false;
      const foo = () => fooCalled = true;
      scope = createScopeForTest({foo});
      const expr = new PrefixUnary('void', new CallScope('foo', [], 0));
      expect(expr.evaluate(scope, null)).toBe(undefined);
      expect(fooCalled).toBe(true);
    });
  });
});
