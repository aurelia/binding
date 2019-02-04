import * as LogManager from 'aurelia-logging';
import {
  PLATFORM,
  DOM
} from 'aurelia-pal';
import {
  TaskQueue
} from 'aurelia-task-queue';
import {
  metadata
} from 'aurelia-metadata';
export declare interface OverrideContext {
  parentOverrideContext: OverrideContext;
  bindingContext: any;
}

// view instances implement this interface
// view instances implement this interface
export declare interface Scope {
  bindingContext: any;
  overrideContext: OverrideContext;
}
export declare const targetContext: any;
export declare const sourceContext: any;
export declare function camelCase(name?: any): any;
export declare function createOverrideContext(bindingContext?: any, parentOverrideContext?: OverrideContext): OverrideContext;
export declare function getContextFor(name: string, scope: Scope, ancestor: number): any;
export declare function createScopeForTest(bindingContext: any, parentBindingContext?: any): Scope;
export declare function connectable(): any;
export declare function enqueueBindingConnect(binding?: any): any;
export declare function setConnectQueueThreshold(value?: any): any;
export declare function enableConnectQueue(): any;
export declare function disableConnectQueue(): any;
export declare function getConnectQueueSize(): any;
export declare function subscriberCollection(): any;
export declare class ExpressionObserver {
  constructor(scope?: any, expression?: any, observerLocator?: any, lookupFunctions?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  subscribe(context?: any, callable?: any): any;
  unsubscribe(context?: any, callable?: any): any;
  call(): any;
}
export declare function calcSplices(current?: any, currentStart?: any, currentEnd?: any, old?: any, oldStart?: any, oldEnd?: any): any;
export declare function mergeSplice(splices?: any, index?: any, removed?: any, addedCount?: any): any;
export declare function projectArraySplices(array?: any, changeRecords?: any): any;
export declare function getChangeRecords(map?: any): any;
export declare class ModifyCollectionObserver {
  constructor(taskQueue?: any, collection?: any);
  subscribe(context?: any, callable?: any): any;
  unsubscribe(context?: any, callable?: any): any;
  addChangeRecord(changeRecord?: any): any;
  flushChangeRecords(): any;
  reset(oldCollection?: any): any;
  getLengthObserver(): any;
  call(): any;
}
export declare class CollectionLengthObserver {
  constructor(collection?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  subscribe(context?: any, callable?: any): any;
  unsubscribe(context?: any, callable?: any): any;
  call(newValue?: any): any;
}
export declare function getArrayObserver(taskQueue?: any, array?: any): any;
export declare class Expression {
  constructor();
  evaluate(scope: Scope, lookupFunctions: any, args?: any): any;
  assign(scope: Scope, value: any, lookupFunctions: any): any;
  toString(): any;
}
export declare class BindingBehavior extends Expression {
  constructor(expression?: any, name?: any, args?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  assign(scope?: any, value?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
  bind(binding?: any, scope?: any, lookupFunctions?: any): any;
  unbind(binding?: any, scope?: any): any;
}
export declare class ValueConverter extends Expression {
  constructor(expression?: any, name?: any, args?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  assign(scope?: any, value?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class Assign extends Expression {
  constructor(target?: any, value?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(vistor?: any): any;
  connect(binding?: any, scope?: any): any;
  assign(scope?: any, value?: any): any;
}
export declare class Conditional extends Expression {
  constructor(condition?: any, yes?: any, no?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class AccessThis extends Expression {
  constructor(ancestor?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class AccessScope extends Expression {
  constructor(name?: any, ancestor?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  assign(scope?: any, value?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class AccessMember extends Expression {
  constructor(object?: any, name?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  assign(scope?: any, value?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class AccessKeyed extends Expression {
  constructor(object?: any, key?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  assign(scope?: any, value?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class CallScope extends Expression {
  constructor(name?: any, args?: any, ancestor?: any);
  evaluate(scope?: any, lookupFunctions?: any, mustEvaluate?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class CallMember extends Expression {
  constructor(object?: any, name?: any, args?: any);
  evaluate(scope?: any, lookupFunctions?: any, mustEvaluate?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class CallFunction extends Expression {
  constructor(func?: any, args?: any);
  evaluate(scope?: any, lookupFunctions?: any, mustEvaluate?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class Binary extends Expression {
  constructor(operation?: any, left?: any, right?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class Unary extends Expression {
  constructor(operation?: any, expression?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class LiteralPrimitive extends Expression {
  constructor(value?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class LiteralString extends Expression {
  constructor(value?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class LiteralTemplate extends Expression {
  constructor(cooked?: any, expressions?: any, raw?: any, tag?: any);
  getScopeContext(scope?: any, lookupFunctions?: any): any;
  getObjectContext(scope?: any, lookupFunctions?: any): any;
  evaluate(scope?: any, lookupFunctions?: any, mustEvaluate?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class LiteralArray extends Expression {
  constructor(elements?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare class LiteralObject extends Expression {
  constructor(keys?: any, values?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare let Unparser: any;
export declare class ExpressionCloner {
  cloneExpressionArray(array?: any): any;
  visitBindingBehavior(behavior?: any): any;
  visitValueConverter(converter?: any): any;
  visitAssign(assign?: any): any;
  visitConditional(conditional?: any): any;
  visitAccessThis(access?: any): any;
  visitAccessScope(access?: any): any;
  visitAccessMember(access?: any): any;
  visitAccessKeyed(access?: any): any;
  visitCallScope(call?: any): any;
  visitCallFunction(call?: any): any;
  visitCallMember(call?: any): any;
  visitUnary(unary?: any): any;
  visitBinary(binary?: any): any;
  visitLiteralPrimitive(literal?: any): any;
  visitLiteralArray(literal?: any): any;
  visitLiteralObject(literal?: any): any;
  visitLiteralString(literal?: any): any;
  visitLiteralTemplate(literal?: any): any;
}
export declare function cloneExpression(expression?: any): any;
export declare const bindingMode: any;
export declare class Parser {
  constructor();
  parse(src?: any): any;
}
export declare class ParserImplementation {
  
  /** Current raw token value based on start and current index */
  raw: any;
  constructor(src?: any);
  parseBindingBehavior(): any;
  parseValueConverter(): any;
  parseVariadicArgs(): any;
  parseExpression(): any;
  parseConditional(): any;
  parseBinary(minPrecedence?: any): any;
  parseLeftHandSide(context?: any): any;
  parseTemplate(context?: any, func?: any): any;
  nextToken(): any;
  
  /** Advance to the next char */
  next(): any;
  scanIdentifier(): any;
  scanNumber(isFloat?: any): any;
  scanString(): any;
  scanTemplate(): any;
  scanTemplateTail(): any;
  
  /** Throw error (defaults to unexpected token if no message provided) */
  err(message?: any, column?: any): any;
  
  /** Consumes the current token if it matches the provided one and returns true, otherwise returns false */
  opt(token?: any): any;
  
  /** Consumes the current token if it matches the provided one, otherwise throws */
  expect(token?: any): any;
}
export declare function getMapObserver(taskQueue?: any, map?: any): any;
export declare const delegationStrategy: any;
export declare class EventManager {
  constructor();
  registerElementConfig(config?: any): any;
  registerEventStrategy(eventName?: any, strategy?: any): any;
  
  /**
     * @param {Element | object} target
     * @param {string} propertyName
     */
  getElementHandler(target?: any, propertyName?: any): any;
  
  /**
     * @param {EventTarget} target
     * @param {string} targetEvent
     * @param {EventListenerOrEventListenerObject} callbackOrListener
     * @param {delegationStrategy} delegate
     * @param {boolean} disposable
     */
  addEventListener(target?: any, targetEvent?: any, callbackOrListener?: any, delegate?: any, disposable?: any): any;
}
export declare class EventSubscriber {
  
  /**
     * @param {string[]} events
     */
  constructor(events?: any);
  
  /**
     * @param {Element} element
     * @param {EventListenerOrEventListenerObject} callbackOrListener
     */
  subscribe(element?: any, callbackOrListener?: any): any;
  dispose(): any;
}
export declare class DirtyChecker {
  constructor();
  addProperty(property?: any): any;
  removeProperty(property?: any): any;
  scheduleDirtyCheck(): any;
  check(): any;
}
export declare class DirtyCheckProperty {
  constructor(dirtyChecker?: any, obj?: any, propertyName?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  call(): any;
  isDirty(): any;
  subscribe(context?: any, callable?: any): any;
  unsubscribe(context?: any, callable?: any): any;
}
export declare const propertyAccessor: any;
export declare class PrimitiveObserver {
  doNotCache: any;
  constructor(primitive?: any, propertyName?: any);
  getValue(): any;
  setValue(): any;
  subscribe(): any;
  unsubscribe(): any;
}
export declare class SetterObserver {
  constructor(taskQueue?: any, obj?: any, propertyName?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  getterValue(): any;
  setterValue(newValue?: any): any;
  call(): any;
  subscribe(context?: any, callable?: any): any;
  unsubscribe(context?: any, callable?: any): any;
  convertProperty(): any;
}
export declare class XLinkAttributeObserver {
  
  // xlink namespaced attributes require getAttributeNS/setAttributeNS
  // (even though the NS version doesn't work for other namespaces
  // in html5 documents)
  constructor(element?: any, propertyName?: any, attributeName?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  subscribe(): any;
}
export declare const dataAttributeAccessor: any;
export declare class DataAttributeObserver {
  constructor(element?: any, propertyName?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  subscribe(): any;
}
export declare class StyleObserver {
  constructor(element?: any, propertyName?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  subscribe(): any;
}
export declare class ValueAttributeObserver {
  constructor(element?: any, propertyName?: any, handler?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  notify(): any;
  handleEvent(): any;
  subscribe(context?: any, callable?: any): any;
  unsubscribe(context?: any, callable?: any): any;
}
export declare class CheckedObserver {
  constructor(element?: any, handler?: any, observerLocator?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  call(context?: any, splices?: any): any;
  synchronizeElement(): any;
  synchronizeValue(): any;
  notify(): any;
  handleEvent(): any;
  subscribe(context?: any, callable?: any): any;
  unsubscribe(context?: any, callable?: any): any;
  unbind(): any;
}
export declare class SelectValueObserver {
  constructor(element?: any, handler?: any, observerLocator?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  call(context?: any, splices?: any): any;
  synchronizeOptions(): any;
  synchronizeValue(): any;
  notify(): any;
  handleEvent(): any;
  subscribe(context?: any, callable?: any): any;
  unsubscribe(context?: any, callable?: any): any;
  bind(): any;
  unbind(): any;
}
export declare class ClassObserver {
  constructor(element?: any);
  getValue(): any;
  setValue(newValue?: any): any;
  subscribe(): any;
}
export declare function hasDeclaredDependencies(descriptor?: any): any;
export declare function declarePropertyDependencies(ctor?: any, propertyName?: any, dependencies?: any): any;
export declare function computedFrom(...rest: any[]): any;
export declare class ComputedExpression extends Expression {
  constructor(name?: any, dependencies?: any);
  evaluate(scope?: any, lookupFunctions?: any): any;
  assign(scope?: any, value?: any): any;
  accept(visitor?: any): any;
  connect(binding?: any, scope?: any): any;
}
export declare function createComputedObserver(obj?: any, propertyName?: any, descriptor?: any, observerLocator?: any): any;
export declare const elements: any;
export declare const presentationElements: any;
export declare const presentationAttributes: any;
export declare const SVGAnalyzer: any;
export declare class ObserverLocator {
  static inject: any;
  
  /**
     * @param {TaskQueue} taskQueue
     * @param {EventManager} eventManager
     * @param {DirtyChecker} dirtyChecker
     * @param {SVGAnalyzer} svgAnalyzer
     * @param {Parser} parser
     */
  constructor(taskQueue?: any, eventManager?: any, dirtyChecker?: any, svgAnalyzer?: any, parser?: any);
  getObserver(obj?: any, propertyName?: any): any;
  getOrCreateObserversLookup(obj?: any): any;
  createObserversLookup(obj?: any): any;
  
  /**@param {ObjectObservationAdapter} adapter */
  addAdapter(adapter?: any): any;
  getAdapterObserver(obj?: any, propertyName?: any, descriptor?: any): any;
  createPropertyObserver(obj?: any, propertyName?: any): any;
  getAccessor(obj?: any, propertyName?: any): any;
  getArrayObserver(array?: any): any;
  getMapObserver(map?: any): any;
  getSetObserver(set?: any): any;
}
export declare class ObjectObservationAdapter {
  getObserver(object?: any, propertyName?: any, descriptor?: any): any;
}
export declare class BindingExpression {
  constructor(observerLocator?: any, targetProperty?: any, sourceExpression?: any, mode?: any, lookupFunctions?: any, attribute?: any);
  createBinding(target?: any): any;
}
export declare class Binding {
  constructor(observerLocator?: any, sourceExpression?: any, target?: any, targetProperty?: any, mode?: any, lookupFunctions?: any);
  updateTarget(value?: any): any;
  updateSource(value?: any): any;
  call(context?: any, newValue?: any, oldValue?: any): any;
  bind(source?: any): any;
  unbind(): any;
  connect(evaluate?: any): any;
}
export declare class CallExpression {
  constructor(observerLocator?: any, targetProperty?: any, sourceExpression?: any, lookupFunctions?: any);
  createBinding(target?: any): any;
}
export declare class Call {
  constructor(observerLocator?: any, sourceExpression?: any, target?: any, targetProperty?: any, lookupFunctions?: any);
  callSource($event?: any): any;
  bind(source?: any): any;
  unbind(): any;
}
export declare class ValueConverterResource {
  constructor(name?: any);
  static convention(name?: any): any;
  initialize(container?: any, target?: any): any;
  register(registry?: any, name?: any): any;
  load(container?: any, target?: any): any;
}
export declare function valueConverter(nameOrTarget?: any): any;
export declare class BindingBehaviorResource {
  constructor(name?: any);
  static convention(name?: any): any;
  initialize(container?: any, target?: any): any;
  register(registry?: any, name?: any): any;
  load(container?: any, target?: any): any;
}
export declare function bindingBehavior(nameOrTarget?: any): any;
export declare class ListenerExpression {
  constructor(eventManager?: any, targetEvent?: any, sourceExpression?: any, delegationStrategy?: any, preventDefault?: any, lookupFunctions?: any);
  createBinding(target?: any): any;
}
export declare class Listener {
  constructor(eventManager?: any, targetEvent?: any, delegationStrategy?: any, sourceExpression?: any, target?: any, preventDefault?: any, lookupFunctions?: any);
  callSource(event?: any): any;
  handleEvent(event?: any): any;
  bind(source?: any): any;
  unbind(): any;
}
export declare class NameExpression {
  constructor(sourceExpression?: any, apiName?: any, lookupFunctions?: any);
  createBinding(target?: any): any;
  static locateAPI(element: Element, apiName: string): Object;
}
export declare class BindingEngine {
  static inject: any;
  constructor(observerLocator?: any, parser?: any);
  createBindingExpression(targetProperty?: any, sourceExpression?: any, mode?: any, lookupFunctions?: any): any;
  propertyObserver(obj?: any, propertyName?: any): any;
  collectionObserver(collection?: any): any;
  expressionObserver(bindingContext?: any, expression?: any): any;
  parseExpression(expression?: any): any;
  registerAdapter(adapter?: any): any;
}
export declare function getSetObserver(taskQueue?: any, set?: any): any;
export declare function observable(targetOrConfig: any, key: string, descriptor?: PropertyDescriptor): any;
export declare function connectBindingToSignal(binding?: any, name?: any): any;
export declare function signalBindings(name?: any): any;