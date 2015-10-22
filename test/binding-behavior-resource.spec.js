import {BindingBehaviorResource} from '../src/binding-behavior-resource';
import {initialize} from 'aurelia-pal-browser';

describe('BindingBehaviorResource', () => {
  beforeAll(() => initialize());

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
