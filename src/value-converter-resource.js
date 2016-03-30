import {camelCase} from './camel-case';
import {metadata} from 'aurelia-metadata';

export class ValueConverterResource {
  constructor(name) {
    this.name = name;
  }

  static convention(name) { // eslint-disable-line
    if (name.endsWith('ValueConverter')) {
      return new ValueConverterResource(camelCase(name.substring(0, name.length - 14)));
    }
  }

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerValueConverter(name || this.name, this.instance);
  }

  load(container, target) {}
}

export function valueConverter(nameOrTarget) {  // eslint-disable-line
  if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
    return function(target) {
      metadata.define(metadata.resource, new ValueConverterResource(nameOrTarget), target);
    };
  }

  metadata.define(metadata.resource, new ValueConverterResource(), nameOrTarget);
}
