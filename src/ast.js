export class Expression {
  constructor(){
    this.isChain = false;
    this.isAssignable = false;
  }

  evaluate(scope: any, valueConverters: any, args?: any): any{
    throw new Error(`Binding expression "${this}" cannot be evaluated.`);
  }

  assign(scope: any, value: any, valueConverters: any): any{
    throw new Error(`Binding expression "${this}" cannot be assigned to.`);
  }

  toString(){
    return Unparser.unparse(this);
  }
}

export class Chain extends Expression {
  constructor(expressions){
    super();

    this.expressions = expressions;
    this.isChain = true;
  }

  evaluate(scope, valueConverters) {
    var result,
        expressions = this.expressions,
        length = expressions.length,
        i, last;

    for (i = 0; i < length; ++i) {
      last = expressions[i].evaluate(scope, valueConverters);

      if (last !== null) {
        result = last;
      }
    }

    return result;
  }

  accept(visitor){
    visitor.visitChain(this);
  }
}

export class ValueConverter extends Expression {
  constructor(expression, name, args, allArgs){
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
    this.allArgs = allArgs;
  }

  evaluate(scope, valueConverters){
    var converter = valueConverters(this.name);
    if(!converter){
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if('toView' in converter){
      return converter.toView.apply(converter, evalList(scope, this.allArgs, valueConverters));
    }

    return this.allArgs[0].evaluate(scope, valueConverters);
  }

  assign(scope, value, valueConverters){
    var converter = valueConverters(this.name);
    if(!converter){
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if('fromView' in converter){
      value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, valueConverters)));
    }

    return this.allArgs[0].assign(scope, value, valueConverters);
  }

  accept(visitor){
    visitor.visitValueConverter(this);
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
  constructor(target, value){
    super();

    this.target = target;
    this.value = value;
  }

  evaluate(scope, valueConverters){
    return this.target.assign(scope, this.value.evaluate(scope, valueConverters));
  }

  accept(vistor){
    vistor.visitAssign(this);
  }

  connect(binding, scope) {
  }
}

export class Conditional extends Expression {
  constructor(condition, yes, no){
    super();

    this.condition = condition;
    this.yes = yes;
    this.no = no;
  }

  evaluate(scope, valueConverters){
    return (!!this.condition.evaluate(scope)) ? this.yes.evaluate(scope) : this.no.evaluate(scope);
  }

  accept(visitor){
    visitor.visitConditional(this);
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

export class AccessScope extends Expression {
  constructor(name){
    super();

    this.name = name;
    this.isAssignable = true;
  }

  evaluate(scope, valueConverters){
    return scope[this.name];
  }

  assign(scope, value){
    return scope[this.name] = value;
  }

  accept(visitor){
    visitor.visitAccessScope(this);
  }

  connect(binding, scope) {
    binding.observeProperty(scope, this.name);
  }
}

export class AccessMember extends Expression {
  constructor(object, name){
    super();

    this.object = object;
    this.name = name;
    this.isAssignable = true;
  }

  evaluate(scope, valueConverters){
    var instance = this.object.evaluate(scope, valueConverters);
    return instance === null || instance === undefined ? instance : instance[this.name];
  }

  assign(scope, value){
    var instance = this.object.evaluate(scope);

    if(instance === null || instance === undefined){
      instance = {};
      this.object.assign(scope, instance);
    }

    return instance[this.name] = value;
  }

  accept(visitor){
    visitor.visitAccessMember(this);
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
  constructor(object, key){
    super();

    this.object = object;
    this.key = key;
    this.isAssignable = true;
  }

  evaluate(scope, valueConverters){
    var instance = this.object.evaluate(scope, valueConverters);
    var lookup = this.key.evaluate(scope, valueConverters);
    return getKeyed(instance, lookup);
  }

  assign(scope, value){
    var instance = this.object.evaluate(scope);
    var lookup = this.key.evaluate(scope);
    return setKeyed(instance, lookup, value);
  }

  accept(visitor){
    visitor.visitAccessKeyed(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (obj instanceof Object) {
      this.key.connect(binding, scope);
      let key = this.key.evaluate(scope);
      if (key !== null && key !== undefined) {
        binding.observeProperty(obj, key);
      }
    }
  }
}

export class CallScope extends Expression {
  constructor(name, args){
    super();

    this.name = name;
    this.args = args;
  }

  evaluate(scope, valueConverters, args){
    args = args || evalList(scope, this.args, valueConverters);
    let func = getFunction(scope, this.name);
    if (func) {
      return func.apply(scope, args);
    } else {
      return func;
    }
  }

  accept(visitor){
    visitor.visitCallScope(this);
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
  constructor(object, name, args){
    super();

    this.object = object;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, valueConverters, args){
    var instance = this.object.evaluate(scope, valueConverters);
    args = args || evalList(scope, this.args, valueConverters);
    let func = getFunction(instance, this.name);
    if (func) {
      return func.apply(instance, args);
    } else {
      return func;
    }
  }

  accept(visitor){
    visitor.visitCallMember(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (getFunction(obj, this.name)) {
      let args = this.args;
      let i = args.length;
      while (i--) {
        args[i].connect(binding, scope);
      }
    }
  }
}

export class CallFunction extends Expression {
  constructor(func,args){
    super();

    this.func = func;
    this.args = args;
  }

  evaluate(scope, valueConverters, args){
    var func = this.func.evaluate(scope, valueConverters);

    if (typeof func === 'function') {
      return func.apply(null, args || evalList(scope, this.args, valueConverters));
    } else if (func === null || func === undefined) {
      return func;
    } else {
      throw new Error(`${this.func} is not a function`);
    }
  }

  accept(visitor){
    visitor.visitCallFunction(this);
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
  constructor(operation, left, right){
    super();

    this.operation = operation;
    this.left = left;
    this.right = right;
  }

  evaluate(scope, valueConverters){
    var left = this.left.evaluate(scope);

    switch (this.operation) {
      case '&&': return left && this.right.evaluate(scope);
      case '||': return left || this.right.evaluate(scope);
    }

    var right = this.right.evaluate(scope);

    switch (this.operation) {
      case '==' : return left == right;
      case '===': return left === right;
      case '!=' : return left != right;
      case '!==': return left !== right;
    }

    // Null check for the operations.
    if (left === null || right === null) {
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
      case '%'  : return left % right;
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
  constructor(operation, expression){
    super();

    this.operation = operation;
    this.expression = expression;
  }

  evaluate(scope, valueConverters){
    return !this.expression.evaluate(scope);
  }

  accept(visitor){
    visitor.visitPrefix(this);
  }

  connect(binding, scope) {
    this.expression.connect(binding, scope);
  }
}

export class LiteralPrimitive extends Expression {
  constructor(value){
    super();

    this.value = value;
  }

  evaluate(scope, valueConverters){
    return this.value;
  }

  accept(visitor){
    visitor.visitLiteralPrimitive(this);
  }

  connect(binding, scope) {
  }
}

export class LiteralString extends Expression {
  constructor(value){
    super();

    this.value = value;
  }

  evaluate(scope, valueConverters){
    return this.value;
  }

  accept(visitor){
    visitor.visitLiteralString(this);
  }

  connect(binding, scope) {
  }
}

export class LiteralArray extends Expression {
  constructor(elements){
    super();

    this.elements = elements;
  }

  evaluate(scope, valueConverters){
    var elements = this.elements,
        length = elements.length,
        result = [],
        i;

    for(i = 0; i < length; ++i){
      result[i] = elements[i].evaluate(scope, valueConverters);
    }

    return result;
  }

  accept(visitor){
    visitor.visitLiteralArray(this);
  }

  connect(binding, scope) {
    let length = this.elements.length;
    for (let i = 0; i < length; i++) {
      this.elements[i].connect(binding, scope);
    }
  }
}

export class LiteralObject extends Expression {
  constructor(keys, values){
    super();

    this.keys = keys;
    this.values = values;
  }

  evaluate(scope, valueConverters){
    var instance = {},
        keys = this.keys,
        values = this.values,
        length = keys.length,
        i;

    for(i = 0; i < length; ++i){
      instance[keys[i]] = values[i].evaluate(scope, valueConverters);
    }

    return instance;
  }

  accept(visitor){
    visitor.visitLiteralObject(this);
  }

  connect(binding, scope){
    let length = this.keys.length;
    for (let i = 0; i < length; i++) {
      this.values[i].connect(binding, scope);
    }
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
      if (i !== 0) {
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
      if (i !== 0) {
        this.write(';');
      }

      expressions[i].accept(this);
    }
  }

  visitValueConverter(converter) {
    var args = converter.args,
        length = args.length,
        i;

    this.write('(');
    converter.expression.accept(this);
    this.write(`|${converter.name}`);

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
      if (i !== 0) {
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
      if (i !== 0){
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

var evalListCache = [[],[0],[0,0],[0,0,0],[0,0,0,0],[0,0,0,0,0]];

/// Evaluate the [list] in context of the [scope].
function evalList(scope, list, valueConverters) {
  var length = list.length,
      cacheLength, i;

  for (cacheLength = evalListCache.length; cacheLength <= length; ++cacheLength) {
    evalListCache.push([]);
  }

  var result = evalListCache[length];

  for (i = 0; i < length; ++i) {
    result[i] = list[i].evaluate(scope, valueConverters);
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

function getFunction(obj, name) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  let func = obj[name];

  if (typeof func === 'function') {
    return func;
  }

  if (func === null || func === undefined) {
    return func;
  } else {
    throw new Error(`${name} is not a function`);
  }
}

function getKeyed(obj, key) {
  if (Array.isArray(obj)) {
    return obj[parseInt(key)];
  } else if (obj) {
    return obj[key];
  } else if (obj === null) {
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
