import { Container } from 'aurelia-dependency-injection';

/**
 * The "parallel" or "artificial" aspect of the binding scope. Provides access to the parent binding
 * context and stores contextual bindable members such as $event, $index, $odd, etc. Members on this
 * object take precedence over members of the bindingContext object.
 */
export declare interface OverrideContext {
  parentOverrideContext: OverrideContext;
  bindingContext: any;
}

/**
 * The two part binding scope. The first part is the bindingContext which represents the primary scope, typically a
 * view-model instance and second the overrideContext
 */
export declare interface Scope {
  /**
   * The primary aspect of the binding scope.  Typically a view-model instance.
   */
  bindingContext: any;
  /**
   * The "parallel" or "artificial" aspect of the binding scope. Provides access to the parent binding
   * context and stores contextual bindable members such as $event, $index, $odd, etc. Members on this
   * object take precedence over members of the bindingContext object.
   */
  overrideContext: OverrideContext;
}

/**
 * Gets the binding context for the specified property name by looking for the property
 * on the scope.bindingContext, then on the scope.overrideContext before repeating on
 * the ancestor scopes until the property is found. If the property is not found anywhere
 * in the scope then the root binding context is returned.
 * @param name The property name.
 * @param scope The scope.
 * @param ancestor The number of ancestor scopes to skip back to (used in $parent bindings).
 */
export declare function getContextFor(name: string, scope: Scope, ancestor?: number): any;

/**
 * Provides a mechanism for releasing resources.
 */
export declare interface Disposable {
  /**
   * Performs tasks associated with freeing, releasing, or resetting resources.
   */
  dispose(): void;
}

/**
 * Creates an overrideContext object with the supplied bindingContext and optional parent overrideContext.
 */
export declare function createOverrideContext(bindingContext: any, parentOverrideContext?: OverrideContext): OverrideContext;

/**
 * Creates a scope object for testing purposes.
 */
export declare function createScopeForTest(bindingContext: any, parentBindingContext?: any): Scope;

/**
 * A ValueConverter resource.
 */
export declare class ValueConverterResource {
  static convention(name: string): ValueConverterResource;
  constructor(name: string);
  initialize(container: Container, target: any): void;
  register(registry: any, name: string): void;
}

/**
 * A BindingBehavior resource.
 */
export declare class BindingBehaviorResource {
  static convention(name: string): BindingBehaviorResource;
  constructor(name: string);
  initialize(container: Container, target: any): void;
  register(registry: any, name: string): void;
}

/**
 * Decorator: Adds efficient subscription management methods to the decorated class's prototype.
 */
export declare function subscriberCollection(): any;


/**
 * Describes the strategy phase where event should be handled.
 */
export declare enum delegationStrategy {
  /**
   * No event delegation.
   */
  none = 0,
  /**
   * Capturing phase event delegation strategy.
   */
  capturing = 1,
  /**
   * Bubbling phase event delegation strategy.
   */
  bubbling = 2
}

/**
 * Subscribes to appropriate element events based on the element property
 * being observed for changes.
 * This is an internal API and is subject to change without notice in future releases.
 */
export declare class EventManager {
  registerElementConfig(config: { tagName: string; properties: { [propertyName: string]: string[] }; }): void;
  /**
   * Subscribes to specified event on the target element.
   * @param target Target element.
   * @param targetEvent Name of event to subscribe.
   * @param callback Event listener callback.
   * @param delegate True to use event delegation mechanism.
   * @param disposable True to return a disposable object with dispose() method instead of a function
   * @returns function which removes event listener.
   */
  addEventListener(target: EventTarget, targetEvent: string, callback: EventListenerOrEventListenerObject, delegate: delegationStrategy, disposable: true): Disposable;
  addEventListener(target: EventTarget, targetEvent: string, callback: EventListenerOrEventListenerObject, delegate: delegationStrategy): () => void;
}

/**
 * Observes property changes.
 */
export declare interface PropertyObserver {
  /**
   * Subscribe to property change events.
   */
  subscribe(callback: (newValue: any, oldValue: any) => void): Disposable;
}

/**
 * Observes collection mutation.
 */
export declare interface CollectionObserver {
  /**
   * Subscribe to collection mutation events.
   */
  subscribe(callback: (changeRecords: Array<ICollectionObserverSplice<any>>) => void): Disposable;
}

/**
 * The change record of a collection mutation. 
 */
export declare interface ICollectionObserverSplice<T = any, K = any> {
  /* ArrayObserverSplice */
  /**
   * Number of items added to the collection.
   */
  addedCount: number;

  /**
   * The position at which the items were added.
   */
  index: number;

  /**
   * A collection of items that were removed from the collection.
   */
  removed: Array<T>;
  /* End ArrayObserverSplice */
                                                   
  /**
   * The observed Set or Map after the change.
   */
  object: Set<T> | Map<K, T>;
                                                   
  /**
   * The value of the Map item prior to the change.
   */
  oldValue: T;
       
  /**
   * The key of the Map item that was changed.
   */
  key: K;
                                                   
  /**
  * The Set value that was either added or removed.
  */
  value: T;
                                                   
  /**
   * The type of change that has taken place. Valid options are "add", "delete", "update", and  "clear".
   * 
   * *Note:* "update" is invalid for Set.
   * 
   * *Note:* "clear" is only valid for Map and Set.
   */
  type: "add" | "delete" | "update" | "clear";
}

/**
 * Describes the direction of the data flow in a binding.
 */
export declare enum bindingMode {
  /**
   * Updates the binding target once. This is essentially a simpler form of to-view binding
   * that provides better performance in cases where the source value does not change.
   */
  oneTime = 0,
  /**
   * Updates the binding target (target) property when the binding source (source) changes.
   * This type of binding is appropriate if the element being bound (target)
   * is implicitly read-only - serves only as an output.
   * If there is no need to monitor the changes of the target property, using the to-view
   * binding mode avoids the overhead of the two-way binding mode.
   */
  toView = 1,
  /**
   * Updates the binding target (target) property when the binding source (source) changes.
   * This type of binding is appropriate if the element being bound (target)
   * is implicitly read-only - serves only as an output.
   * If there is no need to monitor the changes of the target property, using the one-way
   * binding mode avoids the overhead of the two-way binding mode.
   * @deprecated Use `toView` instead.
   */
  oneWay = 1,
  /**
   * Causes changes to either the source property or the target property to automatically update
   * the other. This type of binding is appropriate for editable forms or other fully-interactive
   * UI scenarios.
   */
  twoWay = 2,
  /**
   * Updates the binding source (source) when the binding target (target) property changes.
   * This type of binding is appropriate if the element being bound (target)
   * is implicitly write-only - serves only as an intput.
   */
  fromView = 3
}

/**
 * Lookup functions for value converter and binding behavior resources.
 */
export declare interface LookupFunctions {
  bindingBehaviors(name: string): any;
  valueConverters(name: string): any;
}

/**
 * A callable object.
 */
export declare interface Callable {
  call(context: any, newValue: any, oldValue: any): void;
  call(context: any, changeRecords: any): void;
}

/**
 * Event subscription handler for observers
 */
export declare class EventSubscriber {
  constructor(events: string[]);

  subscribe(element: Element, handler: EventListenerOrEventListenerObject): void;

  dispose(): void;
}

/**
 * Observes property changes.
 */
export declare interface InternalPropertyObserver {
  /**
   * Gets the property value.
   */
  getValue(): any;
  /**
   * Sets the property value.
   */
  setValue(newValue: any): void;
  /**
   * Subscribe to property changes with a callback function.
   */
  subscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Subscribe a callable object to property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  subscribe(context: any, callable: Callable): void;
  /**
   * Unsubscribes a callback function from property changes.
   */
  unsubscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Unsubscribes a callable object from property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  unsubscribe(context: any, callable: Callable): void;
}

/**
 * Value observer for elements
 */
export declare class ValueAttributeObserver implements InternalPropertyObserver {

  constructor(
    element: Element,
    propertyName: string,
    handler: EventSubscriber
  );

  getValue(): any;

  setValue(newValue: any): void;
  /**
   * Handle underlying checkbox element change events
   */
  handleEvent(): any;
  /**
   * Subscribe to property changes with a callback function.
   */
  subscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Subscribe a callable object to property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  subscribe(context: any, callable: Callable): void;
  /**
   * Unsubscribes a callback function from property changes.
   */
  unsubscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Unsubscribes a callable object from property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  unsubscribe(context: any, callable: Callable): void;
}

/**
 * Checked observer for checkboxes
 */
export declare class CheckedObserver implements InternalPropertyObserver {

  constructor(
    element: Element,
    handler: EventSubscriber,
    observerLocator: ObserverLocator
  );

  getValue(): any;

  setValue(newValue: any): void;
  /**
   * Handle underlying checkbox element change events
   */
  handleEvent(): any;
  /**
   * Subscribe to property changes with a callback function.
   */
  subscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Subscribe a callable object to property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  subscribe(context: any, callable: Callable): void;
  /**
   * Unsubscribes a callback function from property changes.
   */
  unsubscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Unsubscribes a callable object from property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  unsubscribe(context: any, callable: Callable): void;
}

/**
 * Select observer for select
 */
export declare class SelectValueObserver implements InternalPropertyObserver {

  constructor(
    element: Element,
    handler: EventSubscriber,
    observerLocator: ObserverLocator
  );

  getValue(): any;

  setValue(newValue: any): void;
  /**
   * Handle underlying checkbox element change events
   */
  handleEvent(): any;
  /**
   * Subscribe to property changes with a callback function.
   */
  subscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Subscribe a callable object to property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  subscribe(context: any, callable: Callable): void;
  /**
   * Unsubscribes a callback function from property changes.
   */
  unsubscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Unsubscribes a callable object from property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  unsubscribe(context: any, callable: Callable): void;
}

/**
 * Property observer for HTML Attributes.
 */
export declare class DataAttributeObserver implements InternalPropertyObserver {

  constructor(
    element: Element,
    propertyName: string
  );
  
  /**
   * Gets the property value.
   */
  getValue(): any;
  /**
   * Sets the property value.
   */
  setValue(newValue: any): void;
  /**
   * Subscribe to property changes with a callback function.
   */
  subscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Subscribe a callable object to property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  subscribe(context: any, callable: Callable): void;
  /**
   * Unsubscribes a callback function from property changes.
   */
  unsubscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Unsubscribes a callable object from property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  unsubscribe(context: any, callable: Callable): void;
}

/**
 * Property observer for properties that cannot be observed by other means
 */
export declare class DirtyCheckProperty implements InternalPropertyObserver {
  /**
   * Gets the property value.
   */
  getValue(): any;
  /**
   * Sets the property value.
   */
  setValue(newValue: any): void;
  /**
   * Subscribe to property changes with a callback function.
   */
  subscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Subscribe a callable object to property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  subscribe(context: any, callable: Callable): void;
  /**
   * Unsubscribes a callback function from property changes.
   */
  unsubscribe(callback: (newValue: any, oldValue: any) => void): void;
  /**
   * Unsubscribes a callable object from property changes.
   * @param context A value to be passed to the callable object's call function when a property change occurs.
   * @param callable A callable object.
   */
  unsubscribe(context: any, callable: Callable): void;
}

/**
 * Observes collection mutation.
 */
export declare interface InternalCollectionObserver {
  /**
   * Subscribe to collection mutation events with a callback function.
   */
  subscribe(callback: (changeRecords: any) => void): void;
  /**
   * Subscribe a callable object to collection mutation events.
   * @param context A value to be passed to the callable object's call function when collection mutation occurs.
   * @param callable A callable object.
   */
  subscribe(context: any, callable: Callable): void;
  /**
   * Unsubscribes a callback function from collection mutation changes.
   */
  unsubscribe(callback: (changeRecords: any) => void): void;
  /**
   * Unsubscribes a callable object from collection mutation events.
   * @param context A value to be passed to the callable object's call function when collection mutation occurs.
   * @param callable A callable object.
   */
  unsubscribe(context: any, callable: Callable): void;
  /**
   * This will flush the change records of this observer and call any subscribers if applicable.
   */
  flushChangeRecords(): void;
  /**
   * Reset the observer to the passed collection and call any subscribers with changes between the current collection and the reset collection.
   * @param oldCollection 
   */
  reset(oldCollection: any[] | Set<any> | Map<any, any>): void;
  /**
   * Get a length observer for this collection.
   */
  getLengthObserver(): any;
}

/**
 * Provides high-level access to the definition of a binding, which connects the properties of
 * binding target objects (typically, HTML elements), and any data source.
 *
 * There are several implementations of this interface, depending on the type of
 * binding (attribute, event, interpolation).
 *
 * The `updateSource`, `updateTarget` and `callSource` are methods that may or may not be defined
 * depending on the type of binding.
 */
export declare interface Binding {
  /**
   * The directionality of the binding.
   */
  mode?: bindingMode;
  /**
   * The expression to access/assign/connect the binding source property.
   */
  sourceExpression?: Expression;
  /**
   * Assigns a value to the target.
   */
  updateTarget?(value: any): void;
  /**
   * Assigns a value to the source.
   */
  updateSource?(value: any): void;
  /**
   * Calls the source method with the specified args object. This method is present in event bindings like trigger/delegate.
   */
  callSource?(event: any): any;
  /**
   * Connects the binding to a scope.
   */
  bind(source: Scope): void;
  /**
   * Disconnects the binding from a scope.
   */
  unbind(): void;

  /**
   * Whether the binding is data-bound.
   */
  isBound: boolean;

  /**
   * The binding's source.
   */
  source: Scope;
}

/**
 * A factory for binding instances.
 */
export declare interface BindingExpression {
  createBinding(target: any): Binding;
}

/**
 * A factory for binding instances.
 */
export declare interface ListenerExpression {
  createBinding(target: any): Binding;
}

/**
 * A factory for binding instances.
 */
export declare interface CallExpression {
  createBinding(target: any): Binding;
}

/**
 * A factory for binding instances.
 */
export declare interface NameExpression {
  createBinding(target: any): Binding;
}

/**
 * An expression AST visitor.
 */
export interface ExpressionVisitor { }

/**
 * Visits an expression AST and returns the string equivalent.
 */
export class Unparser implements ExpressionVisitor {
  constructor(buffer: string[]);
}

/**
 * Clones an expression AST.
 */
export class ExpressionCloner implements ExpressionVisitor { }

/**
 * Provides the base class from which the classes that represent expression tree nodes are derived.
 */
export declare class Expression {
  /**
   * Evaluates the expression using the provided scope and lookup functions.
   * @param scope The scope (bindingContext + overrideContext)
   * @param lookupFunctions Required for BindingBehavior and ValueConverter expressions.
   */
  evaluate(scope: Scope, lookupFunctions?: LookupFunctions): any;
  /**
   * Assigns a value to the property represented by the expression.
   */
  assign(scope: Scope, value: any, lookupFunctions: LookupFunctions): void;
  /**
   * Subscribes a binding instance to the property change events along the path of the expression.
   */
  connect(binding: Binding, scope: Scope): void;
  /**
   * Accepts an expression visitor.
   */
  accept(visitor: ExpressionVisitor): void;

}

/**
 * An expression that accesses a property on the scope.
 */
export declare class AccessScope extends Expression {
  /**
   * The property name.
   */
  name: string;
  /**
   * The number of hops up the scope tree.
   */
  ancestor: number;

  constructor(name: string, ancestor: number);
}

/**
 * An expression that accesses a property on an object.
 */
export declare class AccessMember extends Expression {
  /**
   * The object expression.
   */
  object: Expression;
  /**
   * The property name.
   */
  name: string;

  constructor(object: Expression, name: string);
}

/**
 * An expression that accesses a property on an object using a key.
 */
export declare class AccessKeyed extends Expression {
  /**
   * The object expression.
   */
  object: Expression;

  /**
   * The property name.
   */
  key: Expression;

  constructor(object: Expression, key: Expression)
}

/**
 * A binding behavior expression.
 */
export declare class BindingBehavior extends Expression {
  evaluate(scope: Scope, lookupFunctions: LookupFunctions): any;
  assign(scope: Scope, value: any, lookupFunctions: LookupFunctions): void;
  connect(binding: Binding, scope: Scope): void;
  expression: Expression;
  name: string;
  args: Expression[];
  constructor(expression: Expression, name: string, args: Expression[])
}

/**
 * A value converter expression.
 */
export declare class ValueConverter extends Expression {
  evaluate(scope: Scope, lookupFunctions: LookupFunctions): any;
  assign(scope: Scope, value: any, lookupFunctions: LookupFunctions): void;
  connect(binding: Binding, scope: Scope): void;
  expression: Expression;
  name: string;
  args: Expression[];
  allArgs: Expression[];
  constructor(expression: Expression, name: string, args: Expression[], allArgs: Expression[])
}

/**
 * An expression representing a literal string.
 */
export declare class LiteralString extends Expression {
  value: string;
  constructor(value: string);
}

/**
 * A binary expression (add, subtract, equals, greater-than, etc).
 */
export declare class Binary extends Expression {
  operation: string;
  left: Expression;
  right: Expression;
  constructor(operation: string, left: Expression, right: Expression);
}

/**
 * A conditional (ternary) expression.
 */
export declare class Conditional extends Expression {
  condition: Expression;
  yes: Expression;
  no: Expression;
  constructor(condition: Expression, yes: Expression, no: Expression);
}

/**
 * A literal primitive (null, undefined, number, boolean).
 */
export declare class LiteralPrimitive extends Expression {
  value: any;
  constructor(value: any);
}

/**
 * An expression representing a call to a member function.
 */
export declare class CallMember extends Expression {
  object: Expression;
  name: string;
  args: Expression[];
  constructor(object: Expression, name: string, args: Expression[]);
}

/**
 * An expression representing a (optionally tagged) template literal.
 */
export declare class LiteralTemplate extends Expression {
  /**
   * The cooked (escaped) string parts of the template.
   * The first item is the TemplateHead. If there is only one item,
   * then this counts as a NoSubstituteTemplate - functionally equivalent
   * to a LiteralString, unless it's tagged.
   */
  cooked: string[] & {
    /**
     * The raw (unescaped) string parts of the template.
     * These are only retrieved and stored for tagged templates.
     */
    raw?: string[]
  };
  /**
   * The expressions within the template (the parts between `${` and `}`)
   */
  expressions: Expression[];
  /**
   * The tag (function) to be invoked with the LiteralTemplate arguments.
   * The first argument is LiteralTemplate.cooked.
   * The following arguments are the results of evaluating LiteralTemplate.expressions.
   */
  func?: AccessScope | AccessMember | AccessKeyed;
  constructor(cooked: string[], expressions?: Expression[], raw?: string[], func?: AccessScope | AccessMember | AccessKeyed);
}

/**
 * Parses strings containing javascript expressions and returns a data-binding specialized AST.
 */
export declare class Parser {
  /**
   * Parses a string containing a javascript expression and returns a data-binding specialized AST. Memoized.
   */
  parse(input: string): Expression;
}

/**
 * Provides efficient property observers for properties that would otherwise require dirty-checking.
 */
export declare interface ObjectObservationAdapter {
  getObserver(object: any, propertyName: string, descriptor: PropertyDescriptor): InternalPropertyObserver | null | undefined;
}

/**
 * Internal object observation API. Locates observers for properties, arrays and maps using a variety of strategies.
 */
export declare class ObserverLocator {
  /**
   * Gets an observer for property changes.
   */
  getObserver(obj: any, propertyName: string): InternalPropertyObserver;
  /**
   * Adds a property observation adapter.
   */
  addAdapter(adapter: ObjectObservationAdapter): void;
  /**
   * Gets an observer for array mutation.
   */
  getArrayObserver(array: Array<any>): InternalCollectionObserver;
  /**
   * Gets an observer for map mutation.
   */
  getMapObserver(map: Map<any, any>): InternalCollectionObserver;
  /**
   * Gets an observer for set mutation.
   */
  getSetObserver(set: Set<any>): InternalCollectionObserver;
}

/**
 * Binding system API.
 */
export declare class BindingEngine {
  /**
   * Creates a binding expression for the specified target property and source expression.
   * @param targetProperty The target attribute, eg "value" / "checked" / "textcontent" / "data-foo".
   * @param sourceExpression A javascript expression accessing the source property.
   * @param mode The directionality of the binding.
   * @param lookupFunctions Lookup functions for value converter and binding behavior resources.
   */
  createBindingExpression(targetProperty: string, sourceExpression: string, mode?: bindingMode, lookupFunctions?: LookupFunctions): BindingExpression;
  /**
   * Gets an observer for property changes.
   */
  propertyObserver(obj: Object, propertyName: string): PropertyObserver;
  /**
   * Gets an observer for collection mutation.
   */
  collectionObserver(collection: Array<any> | Map<any, any> | Set<any>): CollectionObserver;
  /**
   * Gets an observer for a javascript expression that accesses a property on the binding context.
   * @param bindingContext The binding context (view-model)
   * @param expression A javascript expression accessing the source property.
   */
  expressionObserver(bindingContext: any, expression: string): PropertyObserver;
  /**
   * Parses a string containing a javascript expression and returns a data-binding specialized AST. Memoized.
   */
  parseExpression(expression: string): Expression;
  /**
   * Registers an adapter that provides an efficient property observeration strategy for
   * properties that would otherwise require dirty-checking.
   */
  registerAdapter(adapter: ObjectObservationAdapter): void;
}

/**
 * Returns whether a property's dependencies have been declared.
 */
export declare function hasDeclaredDependencies(descriptor: PropertyDescriptor): boolean;

/**
 * Declares a property's dependencies.
 */
export declare function declarePropertyDependencies(ctor: any, propertyName: string, dependencies: string[]): void;

/**
* Decorator: Indicates that the decorated property is computed from other properties.
* @param propertyNames The names of the properties the decorated property is computed from.  Simple property names, not expressions.
*/
export declare function computedFrom(...propertyNames: string[]): any;

/**
* Decorator: Indicates that the decorated class is a value converter.
* @param name The name of the value converter.
*/
export declare function valueConverter(name: string): any;

/**
* Decorator: Indicates that the decorated class is a binding behavior.
* @param name The name of the binding behavior.
*/
export declare function bindingBehavior(name: string): any;

/**
 * A context used when invoking a binding's callable API to notify
 * the binding that the context is a "source update".
 */
export declare const sourceContext: string;

/**
 * A context used when invoking a binding's callable API to notify
 * the binding that the context is a "target update".
 */
export declare const targetContext: string;

/**
 * An internal API used by Aurelia's array observation components.
 */
export declare function getChangeRecords(): any;

/**
 * An internal API used by Aurelia's array observation components.
 */
export declare function mergeSplice(splices: any, index: number, removed: any, addedCount: number): any;

/**
* Decorator: Specifies that a property is observable.
* @param targetOrConfig The name of the property, or a configuration object.
*/
export declare function observable(targetOrConfig?: Object, key?: any, descriptor?: any): any;

/**
 * camel-cases a string.
 */
export declare function camelCase(name: string): string;

/**
 * Internal API used to analyze SVG attributes.
 */
export declare interface SVGAnalyzer {
  isStandardSvgAttribute(nodeName: string, attributeName: string): boolean;
}

/**
* Decorator: Internal decorator used to mixin binding APIs.
*/
export declare function connectable(): void;

/**
 * Internal API that adds a binding to the connect queue.
 */
export declare function enqueueBindingConnect(binding: Binding): void;

/**
 * Connects a binding instance to a signal.
 * @param binding The binding instance that should be triggered to refresh by the signal.
 * @param name The signal to associate with the binding instance.
 */
export declare function connectBindingToSignal(binding: Binding, name: string): void;

/**
 * Signals all bindings that are associated with the specified signal name.
 * @param name The signal associated with the binding(s) to refresh.
 */
export declare function signalBindings(name: string): void;
