import { Unary, LiteralString, LiteralPrimitive, LiteralObject, AccessThis, AccessScope, LiteralArray, CallScope } from '../../src/ast';
import { createScopeForTest } from '../../src/scope';

describe('Unary', () => {
  describe('performs \'typeof\'', () => {
    const tests = [
      { expr: new Unary('typeof', new LiteralString('foo')), expected: 'string' },
      { expr: new Unary('typeof', new LiteralPrimitive(1)), expected: 'number' },
      { expr: new Unary('typeof', new LiteralPrimitive(null)), expected: 'object' },
      { expr: new Unary('typeof', new LiteralPrimitive(undefined)), expected: 'undefined' },
      { expr: new Unary('typeof', new LiteralPrimitive(true)), expected: 'boolean' },
      { expr: new Unary('typeof', new LiteralPrimitive(false)), expected: 'boolean' },
      { expr: new Unary('typeof', new LiteralArray([])), expected: 'object' },
      { expr: new Unary('typeof', new LiteralObject([], [])), expected: 'object' },
      { expr: new Unary('typeof', new AccessThis(0)), expected: 'object' },
      { expr: new Unary('typeof', new AccessThis(1)), expected: 'undefined' },
      { expr: new Unary('typeof', new AccessScope('foo', 0)), expected: 'undefined' }
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
      { expr: new Unary('void', new LiteralString('foo')) },
      { expr: new Unary('void', new LiteralPrimitive(1)) },
      { expr: new Unary('void', new LiteralPrimitive(null)) },
      { expr: new Unary('void', new LiteralPrimitive(undefined)) },
      { expr: new Unary('void', new LiteralPrimitive(true)) },
      { expr: new Unary('void', new LiteralPrimitive(false)) },
      { expr: new Unary('void', new LiteralArray([])) },
      { expr: new Unary('void', new LiteralObject([], [])) },
      { expr: new Unary('void', new AccessThis(0)) },
      { expr: new Unary('void', new AccessThis(1)) },
      { expr: new Unary('void', new AccessScope('foo', 0)) }
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
      const expr = new Unary('void', new CallScope('foo', [], 0));
      expect(expr.evaluate(scope, null)).toBe(undefined);
      expect(fooCalled).toBe(true);
    });
  });
});
