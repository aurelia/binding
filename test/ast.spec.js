import {Parser} from '../src/parser';
import {
  CallScope,
  CallMember
} from '../src/ast';

describe('AST', () => {
  let parser;

  beforeAll(() => {
    parser = new Parser();
  });

  describe('CallScope', () => {
    it('calls scope', () => {
      let expression = parser.parse('foo()');
      expect(expression instanceof CallScope).toBe(true);
      let scope = { foo: () => 'bar' };
      spyOn(scope, 'foo').and.callThrough();
      expect(expression.evaluate(scope, null, [])).toBe('bar');
      expect(scope.foo).toHaveBeenCalled();
    });

    it('handles null/undefined', () => {
      let expression = parser.parse('foo()');
      expect(expression instanceof CallScope).toBe(true);
      expect(expression.evaluate({ }, null, [])).toEqual(undefined);
      expect(expression.evaluate({ foo: undefined }, null, [])).toEqual(undefined);
      expect(expression.evaluate({ foo: null }, null, [])).toEqual(null);
    });
  });

  describe('CallMember', () => {
    it('calls member', () => {
      let expression = parser.parse('foo.bar()');
      expect(expression instanceof CallMember).toBe(true);
      let scope = { foo: { bar: () => 'baz' } };
      spyOn(scope.foo, 'bar').and.callThrough();
      expect(expression.evaluate(scope, null, [])).toBe('baz');
      expect(scope.foo.bar).toHaveBeenCalled();
    });

    it('handles null/undefined member', () => {
      let expression = parser.parse('foo.bar()');
      expect(expression instanceof CallMember).toBe(true);
      expect(expression.evaluate({ foo: {} }, null, [])).toEqual(undefined);
      expect(expression.evaluate({ foo: { bar: undefined } }, null, [])).toEqual(undefined);
      expect(expression.evaluate({ foo: { bar: null } }, null, [])).toEqual(null);
    });
  });
});
