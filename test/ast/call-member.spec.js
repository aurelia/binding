import {CallMember, AccessScope, Spread, LiteralPrimitive} from '../../src/ast';
import {createScopeForTest} from '../../src/scope';

describe('CallMember', () => {
  it('evaluates', () => {
    let expression = new CallMember(new AccessScope('foo', 0), 'bar', []);
    let bindingContext = { foo: { bar: () => 'baz' } };
    let scope = createScopeForTest(bindingContext);
    spyOn(bindingContext.foo, 'bar').and.callThrough();
    expect(expression.evaluate(scope, null)).toBe('baz');
    expect(bindingContext.foo.bar).toHaveBeenCalled();
  });

  it('evaluate handles null/undefined member', () => {
    let expression = new CallMember(new AccessScope('foo', 0), 'bar', []);
    expect(expression.evaluate(createScopeForTest({ foo: {} }), null)).toEqual(undefined);
    expect(expression.evaluate(createScopeForTest({ foo: { bar: undefined } }), null)).toEqual(undefined);
    expect(expression.evaluate(createScopeForTest({ foo: { bar: null } }), null)).toEqual(undefined);
  });

  it('evaluate throws when mustEvaluate and member is null or undefined', () => {
    let expression = new CallMember(new AccessScope('foo', 0), 'bar', []);
    let mustEvaluate = true;
    expect(() => expression.evaluate(createScopeForTest({}), null, mustEvaluate)).toThrow();
    expect(() => expression.evaluate(createScopeForTest({ foo: {} }), null, mustEvaluate)).toThrow();
    expect(() => expression.evaluate(createScopeForTest({ foo: { bar: undefined } }), null, mustEvaluate)).toThrow();
    expect(() => expression.evaluate(createScopeForTest({ foo: { bar: null } }), null, mustEvaluate)).toThrow();
  });

  it('evaluates with rest parameters', () => {
    let expression = new CallMember(
      new AccessScope('foo', 0),
      'bar',
      [new Spread([new AccessScope('baz', 0), new LiteralPrimitive(5), new LiteralPrimitive(6)], true)]
    );
    let callResult;
    let scope = createScopeForTest({
      baz: 4,
      foo: {
        bar() {
          callResult = [].slice.call(arguments);
        }
      }
    });
    expression.evaluate(scope);
    expect(callResult.toString()).toBe('4,5,6');
  });
});
