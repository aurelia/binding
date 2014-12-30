export class Expression {
  constructor(){
    this.isChain = false;
    this.isAssignable = false;
  }

  eval(){
    throw new Error(`Cannot evaluate ${this}`);
  }

  assign(){
    throw new Error(`Cannot assign to ${this}`);
  }

  bind(context, wrapper){
    return new BoundExpression(this, context, wrapper);
  }

  toString(){
    return Unparser.unparse(this);
  }
}

export class BoundExpression {
  constructor(expression, context, wrapper=null){
    this.expression = expression;
    this._context = context;
    this._wrapper = wrapper;
  }

  eval(locals=null){
    return this.expression.eval(this._computeContext(locals));
  }

  assign(value, locals=null){
    return this.expression.assign(this._computeContext(locals), value);
  }

  _computeContext(locals){
    if (locals==null) {
      return this._context;
    }

    if (this._wrapper){
      return this._wrapper(this._context, locals);
    }

    throw new Error(`Locals ${locals} provided, but missing wrapper.`);
  }
}

export class Chain extends Expression {
  constructor(expressions){
    super();

    this.expressions = expressions;
    this.isChain = true;
  }

  eval(scope, filters=defaultFilterMap) {
    var result,
        expressions = this.expressions,
        length = expressions.length,
        i, last;

    for (i = 0; i < length; ++i) {
      last = expressions[i].eval(scope, filters);
      
      if (last != null) {
        result = last;
      }
    }

    return result;
  }

  accept(visitor){
    visitor.visitChain(this);
  }
}

export class Filter extends Expression {
  constructor(expression, name, args, allArgs){
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
    this.allArgs = allArgs;
  }

  eval(scope, filters=defaultFilterMap){
    var filter = filters(this.name);
    if(!filter){
      throw new Error(`No Filter: ${this.name} found!`);
    }

    return filter.apply(null, evalList(scope, this.allArgs, filters));
  }
  
  accept(visitor){
    visitor.visitFilter(this);
  }
}

export class Assign extends Expression {
  constructor(target, value){
    super();

    this.target = target;
    this.value = value;
  }

  eval(scope, filters=defaultFilterMap){
    return this.target.assign(scope, this.value.eval(scope, filters));
  }

  accept(vistor){
    vistor.visitAssign(this);
  }
}

export class Conditional extends Expression {
  constructor(condition, yes, no){
    super();

    this.condition = condition;
    this.yes = yes;
    this.no = no;
  }

  eval(scope, filters=defaultFilterMap){
    return (!!this.condition.eval(scope)) ? this.yes.eval(scope) : this.no.eval(scope);
  }

  accept(visitor){
    visitor.visitConditional(this);
  }
}

export class AccessScope extends Expression {
  constructor(name){
    super();

    this.name = name;
    this.isAssignable = true;
  }

  eval(scope, filters=defaultFilterMap){
    return scope[this.name];
  }

  assign(scope, value){
    return scope[this.name] = value;
  }

  accept(visitor){
    visitor.visitAccessScope(this);
  }
}

export class AccessMember extends Expression {
  constructor(object, name){
    super();

    this.object = object;
    this.name = name;
    this.isAssignable = true;
  }

  eval(scope, filters=defaultFilterMap){
    var instance = this.object.eval(scope, filters);
    return instance == null ? null : instance[this.name];
  }

  assign(scope, value){
    var instance = this.object.eval(scope);

    if(!instance){
      instance = {};
      this.object.assign(scope, instance);
    }

    return instance[this.name] = value;
  }

  accept(visitor){
    visitor.visitAccessMember(this);
  }
}

export class AccessKeyed extends Expression {
  constructor(object, key){
    super();

    this.object = object;
    this.key = key;
    this.isAssignable = true;
  }

  eval(scope, filters=defaultFilterMap){
    var instance = this.object.eval(scope, filters);
    var lookup = this.key.eval(scope, filters);
    return getKeyed(instance, lookup);
  }

  assign(scope, value){
    var instance = this.object.eval(scope);
    var lookup = this.key.eval(scope);
    return setKeyed(instance, lookup, value);
  }

  accept(visitor){
    visitor.visitAccessKeyed(this);
  }
}

export class CallScope extends Expression {
  constructor(name, args){
    super();

    this.name = name;
    this.args = args;
  }

  eval(scope, filters=defaultFilterMap){
    var args = evalList(scope, this.args, filters);
    return ensureFunctionFromMap(scope, this.name).apply(scope, args);
  }

  accept(visitor){
    visitor.visitCallScope(this);
  }
}

export class CallMember extends Expression {
  constructor(object, name, args){
    super();

    this.object = object;
    this.name = name;
    this.args = args;
  }

  eval(scope, filters=defaultFilterMap){
    var instance = this.object.eval(scope, filters);
    var args = evalList(scope, this.args, filters);
    return ensureFunctionFromMap(instance, this.name).apply(instance, args);
  }

  accept(visitor){
    visitor.visitCallMember(this);
  }
}

export class CallFunction extends Expression {
  constructor(func,args){
    super();

    this.func = func;
    this.args = args;
  }

  eval(scope, filters=defaultFilterMap){
    var func = this.func.eval(scope, filters);

    if (typeof func != 'function') {
      throw new Error(`${this.func} is not a function`);
    } else {
      return func.apply(null, evalList(scope, this.args, filters));
    }
  }

  accept(visitor){
    visitor.visitCallFunction(this);
  }
}

export class Binary extends Expression {
  constructor(operation, left, right){
    super();

    this.operation = operation;
    this.left = left;
    this.right = right;
  }

  eval(scope, filters=defaultFilterMap){
    var left = this.left.eval(scope);

    switch (this.operation) {
      case '&&': return !!left && !!this.right.eval(scope);
      case '||': return !!left || !!this.right.eval(scope);
    }

    var right = this.right.eval(scope);

    // Null check for the operations.
    if (left == null || right == null) {
      switch (this.operation) {
        case '+':
          if (left != null) return left;
          if (right != null) return right;
          return 0;
        case '-':
          if (left != null) return left;
          if (right != null) return 0 - right;
          return 0;
      }

      return null;
    }

    switch (this.operation) {
      case '+'  : return autoConvertAdd(left, right);
      case '-'  : return left - right;
      case '*'  : return left * right;
      case '/'  : return left / right;
      case '~/' : return Math.floor(left / right);
      case '%'  : return left % right;
      case '==' : return left == right;
      case '!=' : return left != right;
      case '<'  : return left < right;
      case '>'  : return left > right;
      case '<=' : return left <= right;
      case '>=' : return left >= right;
      case '^'  : return left ^ right;
      case '&'  : return left & right;
    }

    throw new Error(`Internal error [${this.operation}] not handled`);
  }

  accept(visitor){
    visitor.visitBinary(this);
  }
}

export class PrefixNot extends Expression {
  constructor(operation, expression){
    super();

    this.operation = operation;
    this.expression = expression;
  }

  eval(scope, filters=defaultFilterMap){
    return !this.expression.eval(scope);
  }

  accept(visitor){
    visitor.visitPrefix(this);
  }
}

export class LiteralPrimitive extends Expression {
  constructor(value){
    super();

    this.value = value;
  }

  eval(scope, filters=defaultFilterMap){
    return this.value;
  }

  accept(visitor){
    visitor.visitLiteralPrimitive(this);
  }
}

export class LiteralString extends Expression {
  constructor(value){
    super();

    this.value = value;
  }

  eval(scope, filters=defaultFilterMap){
    return this.value;
  }

  accept(visitor){
    visitor.visitLiteralString(this);
  }
}

export class LiteralArray extends Expression {
  constructor(elements){
    super();

    this.elements = elements;
  }

  eval(scope, filters=defaultFilterMap){
    var elements = this.elements,
        length = elements.length,
        result = [],
        i;

    for(i = 0; i < length; ++i){
      result[i] = elements[i].eval(scope, filters);
    }

    return result;
  }

  accept(visitor){
    visitor.visitLiteralArray(this);
  }
}

export class LiteralObject extends Expression {
  constructor(keys, values){
    super();
    
    this.keys = keys;
    this.values = values;
  }

  eval(scope, filters=defaultFilterMap){
    var instance = {},
        keys = this.keys,
        values = this.values,
        length = keys.length,
        i;

    for(i = 0; i < length; ++i){
      instance[keys[i]] = values[i].eval(scope, filters);
    }

    return instance;
  }

  accept(visitor){
    visitor.visitLiteralObject(this);
  }
}

export class Unparser {
  constructor(buffer) {
    this.buffer = buffer;
  }

  static unparse(expression) {
    var buffer = [],
        visitor = new Unparser(buffer);

    expression.accept(visitor);

    return buffer.join('');
  }

  write(text){
    this.buffer.push(text);
  }

  writeArgs(args) {
    var i, length;

    this.write('(');

    for (i = 0, length = args.length; i < length; ++i) {
      if (i != 0) {
        this.write(',');
      }

      args[i].accept(this);
    }

    this.write(')');
  }

  visitChain(chain) {
    var expressions = chain.expressions,
        length = expressions.length,
        i;

    for (i = 0; i < length; ++i) {
      if (i != 0) {
        this.write(';');
      }
      
      expressions[i].accept(this);
    }
  }

  visitFilter(filter) {
    var args = filter.args,
        length = args.length,
        i;

    this.write('(');
    filter.expression.accept(this);
    this.write(`|${filter.name}`);

    for (i = 0; i < length; ++i) {
      this.write(' :');
      args[i].accept(this);
    }

    this.write(')');
  }

  visitAssign(assign) {
    assign.target.accept(this);
    this.write('=');
    assign.value.accept(this);
  }

  visitConditional(conditional) {
    conditional.condition.accept(this);
    this.write('?');
    conditional.yes.accept(this);
    this.write(':');
    conditional.no.accept(this);
  }

  visitAccessScope(access) {
    this.write(access.name);
  }

  visitAccessMember(access) {
    access.object.accept(this);
    this.write(`.${access.name}`);
  }

  visitAccessKeyed(access) {
    access.object.accept(this);
    this.write('[');
    access.key.accept(this);
    this.write(']');
  }

  visitCallScope(call) {
    this.write(call.name);
    this.writeArgs(call.args);
  }

  visitCallFunction(call) {
    call.func.accept(this);
    this.writeArgs(call.args);
  }

  visitCallMember(call) {
    call.object.accept(this);
    this.write(`.${call.name}`);
    this.writeArgs(call.args);
  }

  visitPrefix(prefix) {
    this.write(`(${prefix.operation}`);
    prefix.expression.accept(this);
    this.write(')');
  }

  visitBinary(binary) {
    this.write('(');
    binary.left.accept(this);
    this.write(binary.operation);
    binary.right.accept(this);
    this.write(')');
  }

  visitLiteralPrimitive(literal) {
    this.write(`${literal.value}`);
  }

  visitLiteralArray(literal) {
    var elements = literal.elements,
        length = elements.length,
        i;

    this.write('[');

    for (i = 0; i < length; ++i) {
      if (i != 0) {
        this.write(',');
      }

      elements[i].accept(this);
    }

    this.write(']');
  }

  visitLiteralObject(literal) {
    var keys = literal.keys,
        values = literal.values,
        length = keys.length,
        i;

    this.write('{');

    for (i = 0; i < length; ++i) {
      if (i != 0){
        this.write(',');
      }

      this.write(`'${keys[i]}':`);
      values[i].accept(this);
    }

    this.write('}');
  }

  visitLiteralString(literal) {
    var escaped = literal.value.replace(/'/g, "\'");
    this.write(`'${escaped}'`);
  }
}

function defaultFilterMap(name){
  throw new Error(`No NgFilter: ${name} found!`);
}

var evalListCache = [[],[0],[0,0],[0,0,0],[0,0,0,0],[0,0,0,0,0]];

/// Evaluate the [list] in context of the [scope].
function evalList(scope, list, filters=defaultFilterMap) {
  var length = list.length,
      cacheLength, i;

  for (cacheLength = evalListCache.length; cacheLength <= length; ++cacheLength) {
    _evalListCache.push([]);
  }

  var result = evalListCache[length];

  for (i = 0; i < length; ++i) {
    result[i] = list[i].eval(scope, filters);
  }

  return result;
}

/// Add the two arguments with automatic type conversion.
function autoConvertAdd(a, b) {
  if (a != null && b != null) {
    // TODO(deboer): Support others.
    if (typeof a == 'string' && typeof b != 'string') {
      return a + b.toString();
    }

    if (typeof a != 'string' && typeof b == 'string') {
      return a.toString() + b;
    }

    return a + b;
  }

  if (a != null) {
    return a;
  }

  if (b != null) {
    return b;
  }

  return 0;
}

function ensureFunctionFromMap(obj, name){
  var func = obj[name];

  if (typeof func == 'function') {
    return func;
  }

  if (func == null) {
    throw new Error(`Undefined function ${name}`);
  } else {
    throw new Error(`${name} is not a function`);
  }
}

function getKeyed(obj, key) {
  if (Array.isArray(obj)) {
    return obj[parseInt(key)];
  } else if (obj) {
    return obj[key];
  } else if (obj == null) {
    throw new Error('Accessing null object');
  } else {
    return obj[key];
  }
}

function setKeyed(obj, key, value) {
  if (Array.isArray(obj)) {
    var index = parseInt(key);

    if (obj.length <= index) {
      obj.length = index + 1;
    }

    obj[index] = value;
  } else {
    obj[key] = value;
  }

  return value;
}