import {CallScope, AccessScope} from '../../src/ast';
import {createOverrideContext, createScopeForTest} from '../../src/scope';

describe('CallScope', () => {
  let foo, hello, binding;

  beforeAll(() => {
    foo = new CallScope('foo', [], 0);
    hello = new CallScope('hello', [new AccessScope('arg', 0)], 0);
    binding = { observeProperty: jasmine.createSpy('observeProperty') };
  });

  it('evaluates undefined bindingContext', () => {
    let scope = { overrideContext: createOverrideContext(undefined) };
    expect(foo.evaluate(scope, null)).toBe(undefined);
    expect(hello.evaluate(scope, null)).toBe(undefined);
  });

  it('throws when mustEvaluate and evaluating undefined bindingContext', () => {
    let scope = { overrideContext: createOverrideContext(undefined) };
    let mustEvaluate = true;
    expect(() => foo.evaluate(scope, null, mustEvaluate)).toThrow();
    expect(() => hello.evaluate(scope, null, mustEvaluate)).toThrow();
  });

  it('connects undefined bindingContext', () => {
    let scope = { overrideContext: createOverrideContext(undefined) };
    binding.observeProperty.calls.reset();
    foo.connect(binding, scope);
    expect(binding.observeProperty).not.toHaveBeenCalled();
    hello.connect(binding, scope);
    expect(binding.observeProperty).toHaveBeenCalledWith(scope.overrideContext, 'arg');
  });

  it('evaluates null bindingContext', () => {
    let scope = { overrideContext: createOverrideContext(null), bindingContext: null };
    expect(foo.evaluate(scope, null)).toBe(undefined);
    expect(hello.evaluate(scope, null)).toBe(undefined);
  });

  it('throws when mustEvaluate and evaluating null bindingContext', () => {
    let scope = { overrideContext: createOverrideContext(null), bindingContext: null };
    let mustEvaluate = true;
    expect(() => foo.evaluate(scope, null, mustEvaluate)).toThrow();
    expect(() => hello.evaluate(scope, null, mustEvaluate)).toThrow();
  });

  it('connects null bindingContext', () => {
    let scope = { overrideContext: createOverrideContext(null), bindingContext: null };
    binding.observeProperty.calls.reset();
    foo.connect(binding, scope);
    expect(binding.observeProperty).not.toHaveBeenCalled();
    hello.connect(binding, scope);
    expect(binding.observeProperty).toHaveBeenCalledWith(scope.overrideContext, 'arg');
  });

  it('evaluates defined property on bindingContext', () => {
    let scope = createScopeForTest({ foo: () => 'bar', hello: arg => arg, arg: 'world' });
    expect(foo.evaluate(scope, null)).toBe('bar');
    expect(hello.evaluate(scope, null)).toBe('world');
  });

  it('evaluates defined property on overrideContext', () => {
    let scope = createScopeForTest({ abc: () => 'xyz' });
    scope.overrideContext.foo = () => 'bar';
    scope.overrideContext.hello = arg => arg;
    scope.overrideContext.arg = 'world';
    expect(foo.evaluate(scope, null)).toBe('bar');
    expect(hello.evaluate(scope, null)).toBe('world');
  });

  it('connects defined property on bindingContext', () => {
    let scope = createScopeForTest({ foo: 'bar' });
    binding.observeProperty.calls.reset();
    foo.connect(binding, scope);
    expect(binding.observeProperty).not.toHaveBeenCalled();
    hello.connect(binding, scope);
    expect(binding.observeProperty).toHaveBeenCalledWith(scope.bindingContext, 'arg');
  });

  it('connects defined property on overrideContext', () => {
    let scope = createScopeForTest({ abc: 'xyz' });
    scope.overrideContext.foo = () => 'bar';
    scope.overrideContext.hello = arg => arg;
    scope.overrideContext.arg = 'world';
    binding.observeProperty.calls.reset();
    foo.connect(binding, scope);
    expect(binding.observeProperty).not.toHaveBeenCalled();
    hello.connect(binding, scope);
    expect(binding.observeProperty).toHaveBeenCalledWith(scope.overrideContext, 'arg');
  });

  it('connects undefined property on bindingContext', () => {
    let scope = createScopeForTest({ abc: 'xyz' });
    binding.observeProperty.calls.reset();
    foo.connect(binding, scope);
    expect(binding.observeProperty).not.toHaveBeenCalled();
    hello.connect(binding, scope);
    expect(binding.observeProperty).toHaveBeenCalledWith(scope.bindingContext, 'arg');
  });

  it('evaluates defined property on first ancestor bindingContext', () => {
    let scope = createScopeForTest({ abc: 'xyz' }, { foo: () => 'bar', hello: arg => arg, arg: 'world' });
    expect(foo.evaluate(scope, null)).toBe('bar');
    expect(hello.evaluate(scope, null)).toBe('world');
  });

  it('evaluates defined property on first ancestor overrideContext', () => {
    let scope = createScopeForTest({ abc: 'xyz' }, { def: 'rsw' });
    scope.overrideContext.parentOverrideContext.foo = () => 'bar';
    scope.overrideContext.parentOverrideContext.hello = arg => arg;
    scope.overrideContext.parentOverrideContext.arg = 'world';
    expect(foo.evaluate(scope, null)).toBe('bar');
    expect(hello.evaluate(scope, null)).toBe('world');
  });

  it('connects defined property on first ancestor bindingContext', () => {
    let scope = createScopeForTest({ abc: 'xyz' }, { foo: () => 'bar', hello: arg => arg, arg: 'world' });
    binding.observeProperty.calls.reset();
    foo.connect(binding, scope);
    expect(binding.observeProperty).not.toHaveBeenCalled();
    hello.connect(binding, scope);
    expect(binding.observeProperty).toHaveBeenCalledWith(scope.overrideContext.parentOverrideContext.bindingContext, 'arg');
  });

  it('connects defined property on first ancestor overrideContext', () => {
    let scope = createScopeForTest({ abc: 'xyz' }, { def: 'rsw' });
    scope.overrideContext.parentOverrideContext.foo = () => 'bar';
    scope.overrideContext.parentOverrideContext.hello = arg => arg;
    scope.overrideContext.parentOverrideContext.arg = 'world';
    binding.observeProperty.calls.reset();
    foo.connect(binding, scope);
    expect(binding.observeProperty).not.toHaveBeenCalled();
    hello.connect(binding, scope);
    expect(binding.observeProperty).toHaveBeenCalledWith(scope.overrideContext.parentOverrideContext, 'arg');
  });
});
