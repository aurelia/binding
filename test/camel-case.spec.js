import {camelCase} from '../src/camel-case';

describe('camelCase', () => {
  it('camel-cases', () => {
    expect(camelCase('')).toBe('');
    expect(camelCase('A')).toBe('a');
    expect(camelCase('abc-def')).toBe('abcDef');
    expect(camelCase('abc-def-g-h-i')).toBe('abcDefGHI');
    expect(camelCase('Something')).toBe('something');
    expect(camelCase('FOO')).toBe('fOO');
  });
});
