import {Parser} from '../src/parser';
import {AccessScope} from '../src/ast';

describe('AccessScope', () => {
  let expression;

  beforeAll(() => {
    let parser = new Parser();
    expression = parser.parse('foo');
  });

  it('is an instance of AccessScope', () => {
    expect(expression instanceof AccessScope).toBe(true);
    expect(expression.name).toBe('foo');
  });

  // immediate scope

  it('accesses undefined property in immediate scope', () => {
    let scope = {};
    expect(expression.evaluate(scope)).toBe(undefined);
  });

  it('accesses defined property in immediate scope', () => {
    let scope = { foo: 'hello world' };
    expect(expression.evaluate(scope)).toBe(scope.foo);
  });

  it('accesses defined property in immediate scope with value undefined', () => {
    let scope = { foo: undefined };
    expect(expression.evaluate(scope)).toBe(scope.foo);
  });

  it('accesses defined property in immediate scope with value null', () => {
    let scope = { foo: null };
    expect(expression.evaluate(scope)).toBe(scope.foo);
  });

  it('accesses defined property in immediate scope with value 0', () => {
    let scope = { foo: 0 };
    expect(expression.evaluate(scope)).toBe(scope.foo);
  });

  // parent scope

  it('accesses undefined property in parent scope', () => {
    let scope = { $parent: {} };
    expect(expression.evaluate(scope)).toBe(undefined);
  });

  it('accesses defined property in parent scope', () => {
    let scope = { $parent: { foo: 'hello world' } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.foo);
  });

  it('accesses defined property in parent scope with value undefined', () => {
    let scope = { $parent: { foo: undefined } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.foo);
  });

  it('accesses defined property in parent scope with value null', () => {
    let scope = { $parent: { foo: null } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.foo);
  });

  it('accesses defined property in parent scope with value 0', () => {
    let scope = { $parent: { foo: 0 } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.foo);
  });

  // grandparent scope

  it('accesses undefined property in grandparent scope', () => {
    let scope = { $parent: { $parent: {} } };
    expect(expression.evaluate(scope)).toBe(undefined);
  });

  it('accesses defined property in grandparent scope', () => {
    let scope = { $parent: { $parent: { foo: 'hello world' } } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.$parent.foo);
  });

  it('accesses defined property in grandparent scope with value undefined', () => {
    let scope = { $parent: { $parent: { foo: undefined } } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.$parent.foo);
  });

  it('accesses defined property in grandparent scope with value null', () => {
    let scope = { $parent: { $parent: { foo: null } } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.$parent.foo);
  });

  it('accesses defined property in grandparent scope with value 0', () => {
    let scope = { $parent: { $parent: { foo: 0 } } };
    expect(expression.evaluate(scope)).toBe(scope.$parent.$parent.foo);
  });
});
