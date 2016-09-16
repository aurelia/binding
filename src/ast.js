import {Unparser} from './unparser';
import {getContextFor} from './scope';

export class Expression {
  constructor() {
    this.isChain = false;
    this.isAssignable = false;
  }

  evaluate(scope: Scope, lookupFunctions: any, args?: any): any {
    throw new Error(`Binding expression "${this}" cannot be evaluated.`);
  }

  assign(scope: Scope, value: any, lookupFunctions: any): any {
    throw new Error(`Binding expression "${this}" cannot be assigned to.`);
  }

  toString() {
    return Unparser.unparse(this);
  }
}

export class Chain extends Expression {
  constructor(expressions) {
    super();

    this.expressions = expressions;
    this.isChain = true;
  }

  evaluate(scope, lookupFunctions) {
    let result;
    let expressions = this.expressions;
    let last;

    for (let i = 0, length = expressions.length; i < length; ++i) {
      last = expressions[i].evaluate(scope, lookupFunctions);

      if (last !== null) {
        result = last;
      }
    }

    return result;
  }

  accept(visitor) {
    return visitor.visitChain(this);
  }
}

export class BindingBehavior extends Expression {
  constructor(expression, name, args) {
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, lookupFunctions) {
    return this.expression.evaluate(scope, lookupFunctions);
  }

  assign(scope, value, lookupFunctions) {
    return this.expression.assign(scope, value, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitBindingBehavior(this);
  }

  connect(binding, scope) {
    this.expression.connect(binding, scope);
  }

  bind(binding, scope, lookupFunctions) {
    if (this.expression.expression && this.expression.bind) {
      this.expression.bind(binding, scope, lookupFunctions);
    }
    let behavior = lookupFunctions.bindingBehaviors(this.name);
    if (!behavior) {
      throw new Error(`No BindingBehavior named "${this.name}" was found!`);
    }
    let behaviorKey = `behavior-${this.name}`;
    if (binding[behaviorKey]) {
      throw new Error(`A binding behavior named "${this.name}" has already been applied to "${this.expression}"`);
    }
    binding[behaviorKey] = behavior;
    behavior.bind.apply(behavior, [binding, scope].concat(evalList(scope, this.args, binding.lookupFunctions)));
  }

  unbind(binding, scope) {
    let behaviorKey = `behavior-${this.name}`;
    binding[behaviorKey].unbind(binding, scope);
    binding[behaviorKey] = null;
    if (this.expression.expression && this.expression.unbind) {
      this.expression.unbind(binding, scope);
    }
  }
}

export class ValueConverter extends Expression {
  constructor(expression, name, args, allArgs) {
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
    this.allArgs = allArgs;
  }

  evaluate(scope, lookupFunctions) {
    let converter = lookupFunctions.valueConverters(this.name);
    if (!converter) {
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if ('toView' in converter) {
      return converter.toView.apply(converter, evalList(scope, this.allArgs, lookupFunctions));
    }

    return this.allArgs[0].evaluate(scope, lookupFunctions);
  }

  assign(scope, value, lookupFunctions) {
    let converter = lookupFunctions.valueConverters(this.name);
    if (!converter) {
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if ('fromView' in converter) {
      value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, lookupFunctions)));
    }

    return this.allArgs[0].assign(scope, value, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitValueConverter(this);
  }

  connect(binding, scope) {
    let expressions = this.allArgs;
    let i = expressions.length;
    while (i--) {
      expressions[i].connect(binding, scope);
    }
  }
}

export class Assign extends Expression {
  constructor(target, value) {
    super();

    this.target = target;
    this.value = value;
  }

  evaluate(scope, lookupFunctions) {
    return this.target.assign(scope, this.value.evaluate(scope, lookupFunctions));
  }

  accept(vistor) {
    vistor.visitAssign(this);
  }

  connect(binding, scope) {
  }
}

export class Conditional extends Expression {
  constructor(condition, yes, no) {
    super();

    this.condition = condition;
    this.yes = yes;
    this.no = no;
  }

  evaluate(scope, lookupFunctions) {
    return (!!this.condition.evaluate(scope)) ? this.yes.evaluate(scope) : this.no.evaluate(scope);
  }

  accept(visitor) {
    return visitor.visitConditional(this);
  }

  connect(binding, scope) {
    this.condition.connect(binding, scope);
    if (this.condition.evaluate(scope)) {
      this.yes.connect(binding, scope);
    } else {
      this.no.connect(binding, scope);
    }
  }
}

export class AccessThis extends Expression {
  constructor(ancestor) {
    super();
    this.ancestor = ancestor;
  }

  evaluate(scope, lookupFunctions) {
    let oc = scope.overrideContext;
    let i = this.ancestor;
    while (i-- && oc) {
      oc = oc.parentOverrideContext;
    }
    return i < 1 && oc ? oc.bindingContext : undefined;
  }

  accept(visitor) {
    return visitor.visitAccessThis(this);
  }

  connect(binding, scope) {
  }
}

export class AccessScope extends Expression {
  constructor(name, ancestor) {
    super();

    this.name = name;
    this.ancestor = ancestor;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let context = getContextFor(this.name, scope, this.ancestor);
    return context[this.name];
  }

  assign(scope, value) {
    let context = getContextFor(this.name, scope, this.ancestor);
    return context ? (context[this.name] = value) : undefined;
  }

  accept(visitor) {
    return visitor.visitAccessScope(this);
  }

  connect(binding, scope) {
    let context = getContextFor(this.name, scope, this.ancestor);
    binding.observeProperty(context, this.name);
  }
}

export class AccessMember extends Expression {
  constructor(object, name) {
    super();

    this.object = object;
    this.name = name;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    return instance === null || instance === undefined ? instance : instance[this.name];
  }

  assign(scope, value) {
    let instance = this.object.evaluate(scope);

    if (instance === null || instance === undefined) {
      instance = {};
      this.object.assign(scope, instance);
    }

    instance[this.name] = value;
    return value;
  }

  accept(visitor) {
    return visitor.visitAccessMember(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (obj) {
      binding.observeProperty(obj, this.name);
    }
  }
}

export class AccessKeyed extends Expression {
  constructor(object, key) {
    super();

    this.object = object;
    this.key = key;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    let lookup = this.key.evaluate(scope, lookupFunctions);
    return getKeyed(instance, lookup);
  }

  assign(scope, value) {
    let instance = this.object.evaluate(scope);
    let lookup = this.key.evaluate(scope);
    return setKeyed(instance, lookup, value);
  }

  accept(visitor) {
    return visitor.visitAccessKeyed(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (obj instanceof Object) {
      this.key.connect(binding, scope);
      let key = this.key.evaluate(scope);
      // observe the property represented by the key as long as it's not an array
      // being accessed by an integer key which would require dirty-checking.
      if (key !== null && key !== undefined
        && !(Array.isArray(obj) && typeof(key) === 'number')) {
        binding.observeProperty(obj, key);
      }
    }
  }
}

export class CallScope extends Expression {
  constructor(name, args, ancestor) {
    super();

    this.name = name;
    this.args = args;
    this.ancestor = ancestor;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let args = evalList(scope, this.args, lookupFunctions);
    let context = getContextFor(this.name, scope, this.ancestor);
    let func = getFunction(context, this.name, mustEvaluate);
    if (func) {
      return func.apply(context, args);
    }
    return undefined;
  }

  accept(visitor) {
    return visitor.visitCallScope(this);
  }

  connect(binding, scope) {
    let args = this.args;
    let i = args.length;
    while (i--) {
      args[i].connect(binding, scope);
    }
    // todo: consider adding `binding.observeProperty(scope, this.name);`
  }
}

export class CallMember extends Expression {
  constructor(object, name, args) {
    super();

    this.object = object;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    let args = evalList(scope, this.args, lookupFunctions);
    let func = getFunction(instance, this.name, mustEvaluate);
    if (func) {
      return func.apply(instance, args);
    }
    return undefined;
  }

  accept(visitor) {
    return visitor.visitCallMember(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (getFunction(obj, this.name, false)) {
      let args = this.args;
      let i = args.length;
      while (i--) {
        args[i].connect(binding, scope);
      }
    }
  }
}

export class CallFunction extends Expression {
  constructor(func, args) {
    super();

    this.func = func;
    this.args = args;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let func = this.func.evaluate(scope, lookupFunctions);
    if (typeof func === 'function') {
      return func.apply(null, evalList(scope, this.args, lookupFunctions));
    }
    if (!mustEvaluate && (func === null || func === undefined)) {
      return undefined;
    }
    throw new Error(`${this.func} is not a function`);
  }

  accept(visitor) {
    return visitor.visitCallFunction(this);
  }

  connect(binding, scope) {
    this.func.connect(binding, scope);
    let func = this.func.evaluate(scope);
    if (typeof func === 'function') {
      let args = this.args;
      let i = args.length;
      while (i--) {
        args[i].connect(binding, scope);
      }
    }
  }
}

export class Binary extends Expression {
  constructor(operation, left, right) {
    super();

    this.operation = operation;
    this.left = left;
    this.right = right;
  }

  evaluate(scope, lookupFunctions) {
    let left = this.left.evaluate(scope);

    switch (this.operation) {
    case '&&': return left && this.right.evaluate(scope);
    case '||': return left || this.right.evaluate(scope);
    // no default
    }

    let right = this.right.evaluate(scope);

    switch (this.operation) {
    case '==' : return left == right; // eslint-disable-line eqeqeq
    case '===': return left === right;
    case '!=' : return left != right; // eslint-disable-line eqeqeq
    case '!==': return left !== right;
    // no default
    }

    // Null check for the operations.
    if (left === null || right === null || left === undefined || right === undefined) {
      switch (this.operation) {
      case '+':
        if (left !== null && left !== undefined) return left;
        if (right !== null && right !== undefined) return right;
        return 0;
      case '-':
        if (left !== null && left !== undefined) return left;
        if (right !== null && right !== undefined) return 0 - right;
        return 0;
      // no default
      }

      return null;
    }

    switch (this.operation) {
    case '+'  : return autoConvertAdd(left, right);
    case '-'  : return left - right;
    case '*'  : return left * right;
    case '/'  : return left / right;
    case '%'  : return left % right;
    case '<'  : return left < right;
    case '>'  : return left > right;
    case '<=' : return left <= right;
    case '>=' : return left >= right;
    case '^'  : return left ^ right;
    // no default
    }

    throw new Error(`Internal error [${this.operation}] not handled`);
  }

  accept(visitor) {
    return visitor.visitBinary(this);
  }

  connect(binding, scope) {
    this.left.connect(binding, scope);
    let left = this.left.evaluate(scope);
    if (this.operation === '&&' && !left || this.operation === '||' && left) {
      return;
    }
    this.right.connect(binding, scope);
  }
}

export class PrefixNot extends Expression {
  constructor(operation, expression) {
    super();

    this.operation = operation;
    this.expression = expression;
  }

  evaluate(scope, lookupFunctions) {
    return !this.expression.evaluate(scope);
  }

  accept(visitor) {
    return visitor.visitPrefix(this);
  }

  connect(binding, scope) {
    this.expression.connect(binding, scope);
  }
}

export class LiteralPrimitive extends Expression {
  constructor(value) {
    super();

    this.value = value;
  }

  evaluate(scope, lookupFunctions) {
    return this.value;
  }

  accept(visitor) {
    return visitor.visitLiteralPrimitive(this);
  }

  connect(binding, scope) {
  }
}

export class LiteralString extends Expression {
  constructor(value) {
    super();

    this.value = value;
  }

  evaluate(scope, lookupFunctions) {
    return this.value;
  }

  accept(visitor) {
    return visitor.visitLiteralString(this);
  }

  connect(binding, scope) {
  }
}

export class LiteralArray extends Expression {
  constructor(elements) {
    super();

    this.elements = elements;
  }

  evaluate(scope, lookupFunctions) {
    let elements = this.elements;
    let result = [];

    for (let i = 0, length = elements.length; i < length; ++i) {
      result[i] = elements[i].evaluate(scope, lookupFunctions);
    }

    return result;
  }

  accept(visitor) {
    return visitor.visitLiteralArray(this);
  }

  connect(binding, scope) {
    let length = this.elements.length;
    for (let i = 0; i < length; i++) {
      this.elements[i].connect(binding, scope);
    }
  }
}

export class LiteralObject extends Expression {
  constructor(keys, values) {
    super();

    this.keys = keys;
    this.values = values;
  }

  evaluate(scope, lookupFunctions) {
    let instance = {};
    let keys = this.keys;
    let values = this.values;

    for (let i = 0, length = keys.length; i < length; ++i) {
      instance[keys[i]] = values[i].evaluate(scope, lookupFunctions);
    }

    return instance;
  }

  accept(visitor) {
    return visitor.visitLiteralObject(this);
  }

  connect(binding, scope) {
    let length = this.keys.length;
    for (let i = 0; i < length; i++) {
      this.values[i].connect(binding, scope);
    }
  }
}

/// Evaluate the [list] in context of the [scope].
function evalList(scope, list, lookupFunctions) {
  const length = list.length;
  const result = [];
  for (let i = 0; i < length; i++) {
    result[i] = list[i].evaluate(scope, lookupFunctions);
  }
  return result;
}

/// Add the two arguments with automatic type conversion.
function autoConvertAdd(a, b) {
  if (a !== null && b !== null) {
    // TODO(deboer): Support others.
    if (typeof a === 'string' && typeof b !== 'string') {
      return a + b.toString();
    }

    if (typeof a !== 'string' && typeof b === 'string') {
      return a.toString() + b;
    }

    return a + b;
  }

  if (a !== null) {
    return a;
  }

  if (b !== null) {
    return b;
  }

  return 0;
}

function getFunction(obj, name, mustExist) {
  let func = obj === null || obj === undefined ? null : obj[name];
  if (typeof func === 'function') {
    return func;
  }
  if (!mustExist && (func === null || func === undefined)) {
    return null;
  }
  throw new Error(`${name} is not a function`);
}

function getKeyed(obj, key) {
  if (Array.isArray(obj)) {
    return obj[parseInt(key, 10)];
  } else if (obj) {
    return obj[key];
  } else if (obj === null || obj === undefined) {
    return undefined;
  }

  return obj[key];
}

function setKeyed(obj, key, value) {
  if (Array.isArray(obj)) {
    let index = parseInt(key, 10);

    if (obj.length <= index) {
      obj.length = index + 1;
    }

    obj[index] = value;
  } else {
    obj[key] = value;
  }

  return value;
}
