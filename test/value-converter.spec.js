import {ValueConverter} from '../src/index';

describe('ValueConverter', () => {
  it('uses ends with ValueConverter convention', () => {
    expect(ValueConverter.convention('FooValueConverter')).toBeDefined();
    expect(ValueConverter.convention('FooValueConverter') instanceof ValueConverter).toBe(true);
    expect(ValueConverter.convention('FooBar')).toBeUndefined();
  });
  it('uses camel case naming convention', () => {
    expect(ValueConverter.convention('FooValueConverter').name).toBe('foo');
    expect(ValueConverter.convention('FooBarValueConverter').name).toBe('fooBar');
    expect(ValueConverter.convention('FooBarBazValueConverter').name).toBe('fooBarBaz');
  });
});
