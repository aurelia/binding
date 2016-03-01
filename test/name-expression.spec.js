import {
  AccessScope,
  AccessMember,
  AccessKeyed,
  LiteralPrimitive,
  LiteralString
} from '../src/ast';
import {createScopeForTest} from '../src/scope';
import {NameExpression} from '../src/name-expression';

describe('NameExpression', () => {
  let element;

  beforeEach(() => {
    element = {
      au: {
        controller: {
          view: {},
          viewModel: {}
        }
      }
    };
  });

  it('binds element to scope', () => {
    let sourceExpression = new AccessScope('foo');
    let expression = new NameExpression(sourceExpression, 'element');
    let scope = createScopeForTest({});
    let binding = expression.createBinding(element);
    binding.bind(scope);
    expect(scope.bindingContext.foo).toBe(element);
    binding.unbind();
    expect(scope.bindingContext.foo).toBe(null);
  });

  it('binds view to member', () => {
    let sourceExpression = new AccessMember(new AccessScope('foo'), 'bar');
    let expression = new NameExpression(sourceExpression, 'view');
    let scope = createScopeForTest({ foo: {} });
    let binding = expression.createBinding(element);
    binding.bind(scope);
    expect(scope.bindingContext.foo.bar).toBe(element.au.controller.view);
    binding.unbind();
    expect(scope.bindingContext.foo.bar).toBe(null);
  });

  it('binds view-model to key', () => {
    let sourceExpression = new AccessKeyed(new AccessScope('foo'), new LiteralString('bar'));
    let expression = new NameExpression(sourceExpression, 'view-model');
    let scope = createScopeForTest({ foo: {} });
    let binding = expression.createBinding(element);
    binding.bind(scope);
    expect(scope.bindingContext.foo['bar']).toBe(element.au.controller.viewModel);
    binding.unbind();
    expect(scope.bindingContext.foo['bar']).toBe(null);
  });

  it('binds controller to index', () => {
    let sourceExpression = new AccessKeyed(new AccessScope('foo'), new LiteralPrimitive(5));
    let expression = new NameExpression(sourceExpression, 'controller');
    let scope = createScopeForTest({ foo: [] });
    let binding = expression.createBinding(element);
    binding.bind(scope);
    expect(scope.bindingContext.foo[5]).toBe(element.au.controller);
    binding.unbind();
    expect(scope.bindingContext.foo[5]).toBe(null);
  });
});
