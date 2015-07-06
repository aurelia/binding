import {PathObserver} from './path-observer';
import {CompositeObserver} from './composite-observer';
import {AccessKeyedObserver} from './access-keyed-observer';

export class Expression {
  constructor(){
    this.isChain = false;
    this.isAssignable = false;
  }

  evaluate(scope: any, valueConverters: any, args?: any): any{
    throw new Error(`Cannot evaluate ${this}`);
  }

  assign(scope: any, value: any, valueConverters: any): any{
    throw new Error(`Cannot assign to ${this}`);
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

  connect(binding, scope){
    var observer,
        childObservers = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.allArgs.length; i<ii; ++i){
      exp = this.allArgs[i]
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
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

  connect(binding, scope){
    return { value: this.evaluate(scope, binding.valueConverterLookupFunction) };
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

  connect(binding, scope){
    var conditionInfo = this.condition.connect(binding, scope),
        yesInfo = this.yes.connect(binding, scope),
        noInfo = this.no.connect(binding, scope),
        childObservers = [],
        observer;

    if(conditionInfo.observer){
      childObservers.push(conditionInfo.observer);
    }

    if(yesInfo.observer){
      childObservers.push(yesInfo.observer);
    }

    if(noInfo.observer){
      childObservers.push(noInfo.observer);
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:(!!conditionInfo.value) ? yesInfo.value : noInfo.value,
      observer: observer
    };
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

  connect(binding, scope){
    var observer = binding.getObserver(scope, this.name);

    return {
      value: observer.getValue(),
      observer: observer
    }
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
    return instance === null || instance === undefined
      ? instance
      : instance[this.name];
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

  connect(binding, scope){
    var info = this.object.connect(binding, scope),
        objectInstance = info.value,
        objectObserver = info.observer,
        observer;

    if(objectObserver){
      observer = new PathObserver(
        objectObserver,
        value => {
          if(value == null || value == undefined){
            return value;
          }

          return binding.getObserver(value, this.name)
        },
        objectInstance
        );
    }else{
      observer = binding.getObserver(objectInstance, this.name);
    }

    return {
      value: objectInstance == null ? null : objectInstance[this.name], //TODO: use prop abstraction
      observer: observer
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

  connect(binding, scope){
    var objectInfo = this.object.connect(binding, scope),
        keyInfo = this.key.connect(binding, scope),
        observer = new AccessKeyedObserver(objectInfo, keyInfo, binding.observerLocator,
          () => this.evaluate(scope, binding.valueConverterLookupFunction));

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
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
    return ensureFunctionFromMap(scope, this.name).apply(scope, args);
  }

  accept(visitor){
    visitor.visitCallScope(this);
  }

  connect(binding, scope){
    var observer,
        childObservers = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
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
    return ensureFunctionFromMap(instance, this.name).apply(instance, args);
  }

  accept(visitor){
    visitor.visitCallMember(this);
  }

  connect(binding, scope){
    var observer,
        objectInfo = this.object.connect(binding, scope),
        childObservers = [],
        i, ii, exp, expInfo;

    if(objectInfo.observer){
      childObservers.push(objectInfo.observer);
    }

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
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

    if (typeof func !== 'function') {
      throw new Error(`${this.func} is not a function`);
    } else {
      return func.apply(null, args || evalList(scope, this.args, valueConverters));
    }
  }

  accept(visitor){
    visitor.visitCallFunction(this);
  }

  connect(binding, scope){
    var observer,
        funcInfo = this.func.connect(binding, scope),
        childObservers = [],
        i, ii, exp, expInfo;

    if(funcInfo.observer){
      childObservers.push(funcInfo.observer);
    }

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
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

  connect(binding, scope){
    var leftInfo = this.left.connect(binding, scope),
        rightInfo = this.right.connect(binding, scope),
        childObservers = [],
        observer;

    if(leftInfo.observer){
      childObservers.push(leftInfo.observer);
    }

    if(rightInfo.observer){
      childObservers.push(rightInfo.observer);
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.evaluate(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
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

  connect(binding, scope){
    var info = this.expression.connect(binding, scope),
        observer;

    if(info.observer){
      observer = new CompositeObserver([info.observer], () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value: !info.value,
      observer: observer
    };
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

  connect(binding, scope){
    return { value:this.value }
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

  connect(binding, scope){
    return { value:this.value }
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
    var observer,
        childObservers = [],
        results = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.elements.length; i<ii; ++i){
      exp = this.elements[i];
      expInfo = exp.connect(binding, scope);

      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }

      results[i] = expInfo.value;
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:results,
      observer:observer
    };
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
    var observer,
        childObservers = [],
        instance = {},
        keys = this.keys,
        values = this.values,
        length = keys.length,
        i, valueInfo;

    for(i = 0; i < length; ++i){
      valueInfo = values[i].connect(binding, scope);

      if(valueInfo.observer){
        childObservers.push(valueInfo.observer);
      }

      instance[keys[i]] = valueInfo.value;
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.evaluate(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:instance,
      observer:observer
    };
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

function ensureFunctionFromMap(obj, name){
  var func = obj[name];

  if (typeof func === 'function') {
    return func;
  }

  if (func === null) {
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
