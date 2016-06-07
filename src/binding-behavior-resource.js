import {camelCase} from './camel-case';
import {metadata} from 'aurelia-metadata';

export class BindingBehaviorResource {
  constructor(name) {
    this.name = name;
  }

  static convention(name) {
    if (name.endsWith('BindingBehavior')) {
      return new BindingBehaviorResource(camelCase(name.substring(0, name.length - 15)));
    }
  }

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerBindingBehavior(name || this.name, this.instance);
  }

  load(container, target) {}
}

export function bindingBehavior(nameOrTarget) {
  if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
    return function(target) {
      metadata.define(metadata.resource, new BindingBehaviorResource(nameOrTarget), target);
    };
  }

  metadata.define(metadata.resource, new BindingBehaviorResource(), nameOrTarget);
}
