import {Decorators, Metadata} from 'aurelia-metadata';
import {ValueConverterResource} from './value-converter';

//ES7 Decorators
export function valueConverter(nameOrTarget){
  if(nameOrTarget === undefined || typeof nameOrTarget === 'string'){
    return function(target){
      Reflect.defineMetadata(Metadata.resource, new ValueConverterResource(nameOrTarget), target);
    }
  }

  Reflect.defineMetadata(Metadata.resource, new ValueConverterResource(), nameOrTarget);
}

Decorators.configure.parameterizedDecorator('valueConverter', valueConverter);

export function computedFrom(...rest){
  return function(target, key, descriptor){
    if (descriptor.set){
      throw new Error(`The computed property "${key}" cannot have a setter function.`);
    }
    descriptor.get.dependencies = rest;
    return descriptor;
  }
}
