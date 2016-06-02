import {camelCase} from './camel-case';
import {metadata} from 'aurelia-metadata';

export class ViewEngineHooksResource {
  constructor() {}

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerViewEngineHooks(this.instance);
  }

  load(container, target) {}
  
  static convention(name) { // eslint-disable-line
    if (name.endsWith('ViewEngineHooks')) {
      return new ViewEngineHooksResource();
    }
  }
}

export function viewEngineHooks(target) { // eslint-disable-line
  return function(target) {
    metadata.define(metadata.resource, new ViewEngineHooksResource(), target);
  };
}