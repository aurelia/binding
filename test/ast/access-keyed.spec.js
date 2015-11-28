import {AccessKeyed, AccessScope, LiteralString} from '../../src/ast';
import {createScopeForTest} from '../../src/scope';

describe('AccessKeyed', () => {
  let expression;

  beforeAll(() => {
    expression = new AccessKeyed(new AccessScope('foo', 0), new LiteralString('bar'));
  });

  it('evaluates member on bindingContext', () => {
    let scope = createScopeForTest({ foo: { bar: 'baz' } });
    expect(expression.evaluate(scope, null)).toBe('baz');
  });

  it('evaluates member on overrideContext', () => {
    let scope = createScopeForTest({});
    scope.overrideContext.foo = { bar: 'baz' };
    expect(expression.evaluate(scope, null)).toBe('baz');
  });

  it('assigns member on bindingContext', () => {
    let scope = createScopeForTest({ foo: { bar: 'baz' } });
    expression.assign(scope, 'bang')
    expect(scope.bindingContext.foo.bar).toBe('bang');
  });

  it('assigns member on overrideContext', () => {
    let scope = createScopeForTest({});
    scope.overrideContext.foo = { bar: 'baz' };
    expression.assign(scope, 'bang')
    expect(scope.overrideContext.foo.bar).toBe('bang');
  });

  it('evaluates null/undefined object', () => {
    let scope = createScopeForTest({ foo: null });
    expect(expression.evaluate(scope, null)).toBe(undefined);
    scope = createScopeForTest({ foo: undefined });
    expect(expression.evaluate(scope, null)).toBe(undefined);
    scope = createScopeForTest({});
    expect(expression.evaluate(scope, null)).toBe(undefined);
  });
});
