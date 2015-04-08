import {Decorators, Metadata} from 'aurelia-metadata';
import {ValueConverterResource} from './value-converter';

export {EventManager} from './event-manager';
export {ObserverLocator, ObjectObservationAdapter} from './observer-locator';
export {ValueConverterResource} from './value-converter';
export {calcSplices} from './array-change-records';
export * from './binding-modes';
export {Parser} from './parser';
export {BindingExpression} from './binding-expression';
export {ListenerExpression} from './listener-expression';
export {NameExpression} from './name-expression';
export {CallExpression} from './call-expression';
export {DirtyChecker} from './dirty-checking';
export {getChangeRecords} from './map-change-records';
export {ComputedPropertyObserver, declarePropertyDependencies} from './computed-observation';

//ES7 Decorators
export function valueConverter(name){
  return function(target){
    Metadata.on(target).add(new ValueConverterResource(name));
    return target;
  }
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
