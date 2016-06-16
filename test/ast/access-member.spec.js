import {AccessMember, AccessScope} from '../../src/ast';
import {createScopeForTest} from '../../src/scope';

describe('AccessMember', () => {
  let expression;

  beforeAll(() => {
    expression = new AccessMember(new AccessScope('foo', 0), 'bar');
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

  it('returns the assigned value', () => {
    let scope = createScopeForTest({ foo: { bar: 'baz' } });
    expect(expression.assign(scope, 'bang')).toBe('bang');
  });
});
