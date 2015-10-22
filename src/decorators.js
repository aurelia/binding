import {decorators, metadata} from 'aurelia-metadata';
import {ValueConverterResource} from './value-converter-resource';
import {BindingBehaviorResource} from './binding-behavior-resource';

//ES7 Decorators
export function valueConverter(nameOrTarget){
  if(nameOrTarget === undefined || typeof nameOrTarget === 'string'){
    return function(target){
      metadata.define(metadata.resource, new ValueConverterResource(nameOrTarget), target);
    }
  }

  metadata.define(metadata.resource, new ValueConverterResource(), nameOrTarget);
}

decorators.configure.parameterizedDecorator('valueConverter', valueConverter);

export function bindingBehavior(nameOrTarget){
  if(nameOrTarget === undefined || typeof nameOrTarget === 'string'){
    return function(target){
      metadata.define(metadata.resource, new BindingBehaviorResource(nameOrTarget), target);
    }
  }

  metadata.define(metadata.resource, new BindingBehaviorResource(), nameOrTarget);
}

decorators.configure.parameterizedDecorator('bindingBehavior', bindingBehavior);

export function computedFrom(...rest){
  return function(target, key, descriptor){
    descriptor.get.dependencies = rest;
    return descriptor;
  }
}
