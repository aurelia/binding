import {
  createElement,
  fireEvent,
  checkDelay,
  createObserverLocator,
  getBinding
} from './shared';
import {Parser} from '../src/parser';
import {CallExpression} from '../src/call-expression';

describe('CallExpression', () => {
  var expression, viewModel, behavior = {}, binding;

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
      name => null // valueConverterLookupFunction
    );
  });

  it('binds', () => {
    expect(behavior.foo).toBeUndefined();
    binding = expression.createBinding(behavior);
    binding.bind(viewModel);
    expect(behavior.foo).toBeDefined();
  });

  it('calls', () => {
    var result = behavior.foo();
    expect(result).toBe(viewModel.arg1);
    expect(viewModel.doSomething).toHaveBeenCalledWith(undefined, viewModel.arg1, viewModel.arg2);

    result = behavior.foo('a');
    expect(result).toBe(viewModel.arg1);
    expect(viewModel.doSomething).toHaveBeenCalledWith('a', viewModel.arg1, viewModel.arg2);

    viewModel.arg1 = 'something else';
    viewModel.arg2 = 'another value';
    result = behavior.foo();
    expect(result).toBe(viewModel.arg1);
    expect(viewModel.doSomething).toHaveBeenCalledWith(undefined, viewModel.arg1, viewModel.arg2);
  });

  it('unbinds', () => {
      binding.unbind();
      expect(behavior.foo).toBe(null);
  });
});
