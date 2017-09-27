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
    let scope = createScopeForTest({ foo: null });
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

  describe('decorated with computedFrom', () => {
    let fooFn;
    let helloFn;

    beforeEach(() => {
      fooFn = function() {
        return `message of bar is ${this.message}`;
      };
      fooFn.dependencies = ['message'];

      helloFn = function(arg) {
        return `hello with arg: ${arg}. Will update binding if message property changes. Current: ${this.message}`;
      };
      helloFn.dependencies = ['message', 'name'];
    });

    it('connects with dependencies on target method', () => {
      let scope = createScopeForTest({ message: 'Fuh Ro Dah', foo: fooFn, hello: helloFn, arg: 'world' });
      binding.observeProperty.calls.reset();
      binding.observerLocator = {
        parser: {
          parse(name) {
            return new AccessScope(name, 0);
          }
        }
      };
      foo.connect(binding, scope);
      expect(fooFn.dependencies[0] instanceof AccessScope).toBe(true);
      expect(binding.observeProperty).toHaveBeenCalledWith(scope.bindingContext, 'message');
      expect(binding.observeProperty).not.toHaveBeenCalledWith(scope.bindingContext, 'name');
      expect(binding.observeProperty).not.toHaveBeenCalledWith(scope.bindingContext, 'arg');

      binding.observeProperty.calls.reset();
      hello.connect(binding, scope);
      expect(helloFn.dependencies.every(d => d instanceof AccessScope)).toBe(true);

      expect(binding.observeProperty).toHaveBeenCalledWith(scope.bindingContext, 'message');
      expect(binding.observeProperty).toHaveBeenCalledWith(scope.bindingContext, 'name');
      expect(binding.observeProperty).toHaveBeenCalledWith(scope.bindingContext, 'arg');
    });
  });
});
