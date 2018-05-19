import {Binary, LiteralString, LiteralPrimitive, LiteralObject, AccessThis, AccessScope, AccessMember } from '../../src/ast';
import {createScopeForTest} from '../../src/scope';

describe('Binary', () => {
  it('concats strings', () => {
    let expression = new Binary('+', new LiteralString('a'), new LiteralString('b'));
    let scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe('ab');

    expression = new Binary('+', new LiteralString('a'), new LiteralPrimitive(null));
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe('a');

    expression = new Binary('+', new LiteralPrimitive(null), new LiteralString('b'));
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe('b');

    expression = new Binary('+', new LiteralString('a'), new LiteralPrimitive(undefined));
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe('a');

    expression = new Binary('+', new LiteralPrimitive(undefined), new LiteralString('b'));
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe('b');
  });

  it('adds numbers', () => {
    let expression = new Binary('+', new LiteralPrimitive(1), new LiteralPrimitive(2));
    let scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe(3);

    expression = new Binary('+', new LiteralPrimitive(1), new LiteralPrimitive(null));
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe(1);

    expression = new Binary('+', new LiteralPrimitive(null), new LiteralPrimitive(2));
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe(2);

    expression = new Binary('+', new LiteralPrimitive(1), new LiteralPrimitive(undefined));
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe(1);

    expression = new Binary('+', new LiteralPrimitive(undefined), new LiteralPrimitive(2));
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe(2);
  });

  describe('performs \'in\'', () => {
    const tests = [
      { expr: new Binary('in', new LiteralString('foo'), new LiteralObject(['foo'], [new LiteralPrimitive(null)])), expected: true },
      { expr: new Binary('in', new LiteralString('foo'), new LiteralObject(['bar'], [new LiteralPrimitive(null)])), expected: false },
      { expr: new Binary('in', new LiteralPrimitive(1), new LiteralObject(['1'], [new LiteralPrimitive(null)])), expected: true },
      { expr: new Binary('in', new LiteralString('1'), new LiteralObject(['1'], [new LiteralPrimitive(null)])), expected: true },
      { expr: new Binary('in', new LiteralString('foo'), new LiteralPrimitive(null)), expected: false },
      { expr: new Binary('in', new LiteralString('foo'), new LiteralPrimitive(undefined)), expected: false },
      { expr: new Binary('in', new LiteralString('foo'), new LiteralPrimitive(true)), expected: false },
      { expr: new Binary('in', new LiteralString('foo'), new AccessThis(0)), expected: true },
      { expr: new Binary('in', new LiteralString('bar'), new AccessThis(0)), expected: true },
      { expr: new Binary('in', new LiteralString('foo'), new AccessThis(1)), expected: false },
      { expr: new Binary('in', new LiteralString('bar'), new AccessThis(1)), expected: false },
      { expr: new Binary('in', new LiteralString('foo'), new AccessScope('foo', 0)), expected: false },
      { expr: new Binary('in', new LiteralString('bar'), new AccessScope('bar', 0)), expected: false },
      { expr: new Binary('in', new LiteralString('bar'), new AccessScope('foo', 0)), expected: true }
    ];
    let scope = createScopeForTest({foo: {bar: null}, bar: null});

    for (const { expr, expected } of tests) {
      it(expr.toString(), () => {
        expect(expr.evaluate(scope, null)).toBe(expected);
      });
    }
  });

  describe('performs \'instanceof\'', () => {
    class Foo {}
    class Bar extends Foo {}
    const tests = [
      { expr: new Binary('instanceof', new AccessScope('foo', 0), new AccessMember(new AccessScope('foo', 0), 'constructor')), expected: true },
      { expr: new Binary('instanceof', new AccessScope('foo', 0), new AccessMember(new AccessScope('bar', 0), 'constructor')), expected: false },
      { expr: new Binary('instanceof', new AccessScope('bar', 0), new AccessMember(new AccessScope('bar', 0), 'constructor')), expected: true },
      { expr: new Binary('instanceof', new AccessScope('bar', 0), new AccessMember(new AccessScope('foo', 0), 'constructor')), expected: true },
      { expr: new Binary('instanceof', new LiteralString('foo'), new AccessMember(new AccessScope('foo', 0), 'constructor')), expected: false },
      { expr: new Binary('instanceof', new AccessScope('foo', 0), new AccessScope('foo', 0)), expected: false },
      { expr: new Binary('instanceof', new AccessScope('foo', 0), new LiteralPrimitive(null)), expected: false },
      { expr: new Binary('instanceof', new AccessScope('foo', 0), new LiteralPrimitive(undefined)), expected: false },
      { expr: new Binary('instanceof', new LiteralPrimitive(null), new AccessScope('foo', 0)), expected: false },
      { expr: new Binary('instanceof', new LiteralPrimitive(undefined), new AccessScope('foo', 0)), expected: false }
    ];
    let scope = createScopeForTest({foo: new Foo(), bar: new Bar()});

    for (const { expr, expected } of tests) {
      it(expr.toString(), () => {
        expect(expr.evaluate(scope, null)).toBe(expected);
      });
    }
  });
});
