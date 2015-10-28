import {AccessThis} from '../../src/ast';
import {createScopeForTest} from '../../src/scope';

describe('AccessThis', () => {
  let expression;

  beforeAll(() => {
    expression = new AccessThis();
  });

  it('evaluates', () => {
    let scope = createScopeForTest({ foo: 'bar'});
    expect(expression.evaluate(scope, null)).toBe(scope.bindingContext);
    scope = createScopeForTest(null);
    expect(expression.evaluate(scope, null)).toBe(null);
    scope = createScopeForTest();
    expect(expression.evaluate(scope, null)).toBe(undefined);
  });
});
