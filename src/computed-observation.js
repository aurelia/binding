import {Expression} from './ast';
import {createOverrideContext} from './scope';
import {ExpressionObserver} from './expression-observer';

export function hasDeclaredDependencies(descriptor) {
  return !!(descriptor && descriptor.get && descriptor.get.dependencies);
}

export function declarePropertyDependencies(ctor, propertyName, dependencies) {
  let descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
  descriptor.get.dependencies = dependencies;
}

export function computedFrom(...rest) {
  return function(target, key, descriptor) {
    descriptor.get.dependencies = rest;
    return descriptor;
  };
}

export class ComputedExpression extends Expression {
  constructor(name, dependencies) {
    super();

    this.name = name;
    this.dependencies = dependencies;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    return scope.bindingContext[this.name];
  }

  assign(scope, value) {
    scope.bindingContext[this.name] = value;
  }

  accept(visitor) {
    throw new Error('not implemented');
  }

  connect(binding, scope) {
    let dependencies = this.dependencies;
    let i = dependencies.length;
    while (i--) {
      dependencies[i].connect(binding, scope);
    }
  }
}

export function createComputedObserver(obj, propertyName, descriptor, observerLocator) {
  let dependencies = descriptor.get.dependencies;
  if (!(dependencies instanceof ComputedExpression)) {
    let i = dependencies.length;
    while (i--) {
      dependencies[i] = observerLocator.parser.parse(dependencies[i]);
    }
    dependencies = descriptor.get.dependencies = new ComputedExpression(propertyName, dependencies);
  }

  let scope = { bindingContext: obj, overrideContext: createOverrideContext(obj) };
  return new ExpressionObserver(scope, dependencies, observerLocator);
}
