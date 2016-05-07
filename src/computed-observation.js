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


export function cachedComputedFrom(...rest) {
  const dependencyAccess = (object, dependency) => {
    let value;

    if (typeof dependency === "string") {
      value = dependency.split('.').reduce((subjObject, subdependency) => subjObject[subdependency], object);
    } else {
      let scope = { bindingContext: object, overrideContext: createOverrideContext(object) };
      value = dependency.evaluate(scope, null);
    }
    return value;
  };

  return function(target, key, descriptor) {
    const _descriptor = descriptor.get;
    const dependencies = rest;
    let store;
    const cache = {};

    descriptor.get = function() {

      const cached = dependencies.reduce((cached, dependency) => {
        return cached && cache[dependency] == dependencyAccess(this,dependency) ;
      }, true);

      if (!cached) {
        dependencies.map((dependency) => {
          let key;
          if (typeof dependency === "string") {
            key = dependency;
          } else {
            key = dependency.name;
          }
          return cache[key] = dependencyAccess(this,dependency);
        });
        store = _descriptor.call(this);
      }
      return store;
    };
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
