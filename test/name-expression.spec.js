import {
  AccessScope,
  AccessMember,
  AccessKeyed,
  LiteralPrimitive,
  LiteralString,
  BindingBehavior
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

  it('supports binding behaviors', () => {
    let sourceExpression = new BindingBehavior(new AccessScope('foo'), 'test', []);
    let testBehavior = {
      bind: jasmine.createSpy('bind'),
      unbind: jasmine.createSpy('unbind')
    };
    let lookupFunctions = {
      bindingBehaviors: name => testBehavior,
      valueConverters: name => null
    };
    let expression = new NameExpression(sourceExpression, 'element', lookupFunctions);
    let scope = createScopeForTest({});
    let binding = expression.createBinding(element);
    binding.bind(scope);
    expect(scope.bindingContext.foo).toBe(element);
    expect(binding.lookupFunctions.bindingBehaviors().bind).toHaveBeenCalledWith(binding, scope);
    binding.unbind();
    expect(scope.bindingContext.foo).toBe(null);
    expect(binding.lookupFunctions.bindingBehaviors().unbind).toHaveBeenCalledWith(binding, scope);
  });

  it('throws error with tagName when element has no behavior', () => {
    let element = { tagName: 'test-element' };
    expect(() => NameExpression.locateAPI(element, 'controller')).toThrow(new Error(`No Aurelia APIs are defined for the element: "${element.tagName}".`));
  });

  it('unbind preserves updated value', () => {
    let sourceExpression = new AccessScope('foo');
    let expression = new NameExpression(sourceExpression, 'element');
    let scope = createScopeForTest({});
    let binding = expression.createBinding(element);
    binding.bind(scope);
    expect(scope.bindingContext.foo).toBe(element);
    scope.bindingContext.foo = 'should remain';
    binding.unbind();
    expect(scope.bindingContext.foo).toBe('should remain');
  });
});
