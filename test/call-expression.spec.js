import './setup';
import {createObserverLocator} from './shared';
import {Parser} from '../src/parser';
import {CallExpression} from '../src/call-expression';
import {createScopeForTest} from '../src/scope';

describe('CallExpression', () => {
  let expression, viewModel, target = {}, binding, scope;

  beforeAll(() => {
    viewModel = {
      arg1: 1,
      arg2: { hello: 'world' },
      doSomething: ($event, arg1, arg2, ...rest) => {
        return arg1;
      }
    };
    spyOn(viewModel, 'doSomething').and.callThrough();
    expression = new CallExpression(
      createObserverLocator(),
      'foo', // attrName
      new Parser().parse('doSomething($event, arg1, arg2)'),
      { bindingBehaviors: name => null, valueConverters: name => null } // lookupFunctions
    );
  });

  it('binds', () => {
    expect(target.foo).toBeUndefined();
    binding = expression.createBinding(target);
    scope = createScopeForTest(viewModel);
    binding.bind(scope);
    expect(target.foo).toBeDefined();
  });

  it('calls with empty args', () => {
    let result = target.foo();
    expect(result).toBe(viewModel.arg1);
    expect(viewModel.doSomething).toHaveBeenCalledWith(undefined, viewModel.arg1, viewModel.arg2);
  });

  it('calls with string arg', () => {
    let result = target.foo('a');
    expect(result).toBe(viewModel.arg1);
    expect(viewModel.doSomething).toHaveBeenCalledWith('a', viewModel.arg1, viewModel.arg2);
  });

  it('calls with object arg and distributes parameters', () => {
    let args = { arg1: 'hello', arg2: 'world' };
    let result = target.foo(args);
    expect(result).toBe(args.arg1);
    expect(viewModel.doSomething).toHaveBeenCalledWith(args, args.arg1, args.arg2);
  });

  it('handles args update', () => {
    viewModel.arg1 = 'something else';
    viewModel.arg2 = 'another value';
    let result = target.foo();
    expect(result).toBe(viewModel.arg1);
    expect(viewModel.doSomething).toHaveBeenCalledWith(undefined, viewModel.arg1, viewModel.arg2);
  });

  it('shouldn\'t affect the overrideContext', () => {
    let args = { arg1: 'hello' };
    scope.overrideContext.arg1 = 'bar';
    target.foo(args);
    expect(scope.overrideContext.arg1).toBe('bar');
  });

  it('unbinds', () => {
    binding.unbind();
    expect(target.foo).toBe(null);
  });
});
