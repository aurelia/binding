import {Metadata} from 'aurelia-metadata';
import {ValueConverter} from './value-converter';

export {EventManager} from './event-manager';
export {ObserverLocator} from './observer-locator';
export {ValueConverter} from './value-converter';
export {calcSplices} from './array-change-records';
export * from './binding-modes';
export {Parser} from './parser';
export {BindingExpression} from './binding-expression';
export {ListenerExpression} from './listener-expression';
export {NameExpression} from './name-expression';
export {CallExpression} from './call-expression';
export {DirtyChecker} from './dirty-checking';

Metadata.configure.classHelper('valueConverter', ValueConverter);
