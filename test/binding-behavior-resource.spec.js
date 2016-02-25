import './setup';
import {BindingBehaviorResource} from '../src/binding-behavior-resource';

describe('BindingBehaviorResource', () => {
  it('uses ends with BindingBehavior convention', () => {
    expect(BindingBehaviorResource.convention('FooBindingBehavior')).toBeDefined();
    expect(BindingBehaviorResource.convention('FooBindingBehavior') instanceof BindingBehaviorResource).toBe(true);
    expect(BindingBehaviorResource.convention('FooBar')).toBeUndefined();
  });
  it('uses camel case naming convention', () => {
    expect(BindingBehaviorResource.convention('FooBindingBehavior').name).toBe('foo');
    expect(BindingBehaviorResource.convention('FooBarBindingBehavior').name).toBe('fooBar');
    expect(BindingBehaviorResource.convention('FooBarBazBindingBehavior').name).toBe('fooBarBaz');
  });
});
