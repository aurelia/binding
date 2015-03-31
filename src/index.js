import {Decorators, Metadata} from 'aurelia-metadata';
import {ValueConverter} from './value-converter';

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
export {ComputedObservationAdapter, declarePropertyDependencies} from './computed-observation';

//ES7 Decorators
export function valueConverter(name){
  return function(target){
    Metadata.on(target).add(new ValueConverterResource(name));
    return target;
  }
}

Decorators.configure.parameterizedDecorator('valueConverter', valueConverter);
