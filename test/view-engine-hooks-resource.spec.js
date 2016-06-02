import './setup';
import {ViewEngineHooksResource} from '../src/view-engine-hooks-resource';

describe('ViewEngineHooksResource', () => {
  it('uses ends with ViewEngineHooks convention', () => {
    expect(BindingBehaviorResource.convention('FooViewEngineHooks')).toBeDefined();
    expect(BindingBehaviorResource.convention('FooViewEngineHooks') instanceof BindingBehaviorResource).toBe(true);
    expect(BindingBehaviorResource.convention('FooBar')).toBeUndefined();
  });
});
