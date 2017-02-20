import {Assign, AccessScope} from '../../src/ast';
import {createOverrideContext, createScopeForTest} from '../../src/scope';

describe('Assign', () => {
  it('can chain assignments', () => {
    const foo = new Assign(new AccessScope('foo'), new AccessScope('bar'));
    const scope = { overrideContext: createOverrideContext(undefined) };
    foo.assign(scope, 1);
    expect(scope.overrideContext.foo).toBe(1);
    expect(scope.overrideContext.bar).toBe(1);
  });
});
