import {Decorators, Metadata} from 'aurelia-metadata';
import {ValueConverterResource} from './value-converter';

//ES7 Decorators
export function valueConverter(nameOrTarget){
  if(nameOrTarget === undefined || typeof nameOrTarget === 'string'){
    return function(target){
      Metadata.define(Metadata.resource, new ValueConverterResource(nameOrTarget), target);
    }
  }

  Metadata.define(Metadata.resource, new ValueConverterResource(), nameOrTarget);
}

Decorators.configure.parameterizedDecorator('valueConverter', valueConverter);

export function computedFrom(...rest){
  return function(target, key, descriptor){
    descriptor.get.dependencies = rest;
    return descriptor;
  }
}
