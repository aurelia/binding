import {Parser} from '../src/parser';
import {CallScope, AccessScope} from '../src/ast';

describe('CallScope', () => {
  let expression;

  beforeAll(() => {
    let parser = new Parser();
    expression = parser.parse('foo(x)');
  });

  it('is an instance of CallScope', () => {
    expect(expression instanceof CallScope).toBe(true);
    expect(expression.args).toEqual([new AccessScope('x')]);
    expect(expression.name).toBe('foo');
  });

  // immediate scope

  it('accesses undefined method in immediate scope', () => {
    let scope = {};
    expect(expression.evaluate(scope)).toBe(undefined);
  });

  it('accesses defined method in immediate scope', () => {
    let scope = { foo: x => x, x: 'hello world' };
    expect(expression.evaluate(scope)).toBe(scope.x);
  });

  it('accesses defined method in immediate scope with value undefined', () => {
    let scope = { foo: undefined };
    expect(expression.evaluate(scope)).toBe(scope.foo);
  });

  it('accesses defined method in immediate scope with value null', () => {
    let scope = { foo: null };
    expect(expression.evaluate(scope)).toBe(scope.foo);
  });

  it('accesses defined method in immediate scope with value 0', () => {
    let scope = { foo: 0 };
    expect(() => expression.evaluate(scope)).toThrow();
  });

  // parent scope

  it('accesses undefined method in parent scope', () => {
    let scope = { $parent: {} };
    expect(expression.evaluate(scope)).toBe(undefined);
  });

  it('accesses defined method in parent scope', () => {
    let scope = { $parent: { foo: x => x }, x: 'hello world' };
    expect(expression.evaluate(scope)).toBe(scope.x);
  });

  it('accesses defined method in parent scope with value undefined', () => {
    let scope = { $parent: { foo: undefined } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.foo);
  });

  it('accesses defined method in parent scope with value null', () => {
    let scope = { $parent: { foo: null } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.foo);
  });

  it('accesses defined method in parent scope with value 0', () => {
    let scope = { $parent: { foo: 0 } };
    expect(() => expression.evaluate(scope)).toThrow();
  });

  // grandparent scope

  it('accesses undefined method in grandparent scope', () => {
    let scope = { $parent: { $parent: {} } };
    expect(expression.evaluate(scope)).toBe(undefined);
  });

  it('accesses defined method in grandparent scope', () => {
    let scope = { $parent: { $parent: { foo: x => x } }, x: 'hello world' };
    expect(expression.evaluate(scope)).toBe(scope.x);
  });

  it('accesses defined method in grandparent scope with value undefined', () => {
    let scope = { $parent: { $parent: { foo: null } } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.$parent.foo);
  });

  it('accesses defined method in grandparent scope with value null', () => {
    let scope = { $parent: { $parent: { foo: undefined } } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.$parent.foo);
  });

  it('accesses defined method in grandparent scope with value 0', () => {
    let scope = { $parent: { $parent: { foo: 0 } } };
    expect(() => expression.evaluate(scope)).toThrow();
  });
});
