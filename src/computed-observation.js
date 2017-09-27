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
  return deco;
  /**
   * @param {Function} target
   * @param {string} key
   * @param {PropertyDescriptor} descriptor
   */
  function deco(target, key, descriptor) {
    /**
     * For typescript, property initialization will be delegated to constructor
     * For babel, it's a special property on descriptor, `initializer`
     * Which means, descriptor.get === getter & descriptor.value === method
     */
    if (descriptor === undefined || (descriptor.get === undefined && descriptor.value === undefined)) {
      const realTarget = key === undefined ? target : target.constructor;
      throw new Error(`Cannot place 'computedFrom' on property '${key}' for '${realTarget.name}'. No getter or method found. Is it on a normal class field ?`);
    }
    // decorator on method
    if (descriptor.get === undefined) {
      descriptor.value.dependencies = rest;
    } else { // decorator on getter
      descriptor.get.dependencies = rest;
    }
    return descriptor;
  }
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
