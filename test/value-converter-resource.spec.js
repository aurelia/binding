import './setup';
import {ValueConverterResource} from '../src/value-converter-resource';

describe('ValueConverterResource', () => {
  it('uses ends with ValueConverter convention', () => {
    expect(ValueConverterResource.convention('FooValueConverter')).toBeDefined();
    expect(ValueConverterResource.convention('FooValueConverter') instanceof ValueConverterResource).toBe(true);
    expect(ValueConverterResource.convention('FooBar')).toBeUndefined();
  });
  it('uses camel case naming convention', () => {
    expect(ValueConverterResource.convention('FooValueConverter').name).toBe('foo');
    expect(ValueConverterResource.convention('FooBarValueConverter').name).toBe('fooBar');
    expect(ValueConverterResource.convention('FooBarBazValueConverter').name).toBe('fooBarBaz');
  });
});
