import {
  Chain, ValueConverter, Assign, Conditional,
  AccessThis, AccessScope, AccessMember, AccessKeyed,
  CallScope, CallFunction, CallMember,
  PrefixNot, BindingBehavior, Binary,
  LiteralPrimitive, LiteralArray, LiteralObject, LiteralString
} from './ast';

export class ExpressionCloner {
  cloneExpressionArray(array) {
    let clonedArray = [];
    let i = array.length;
    while (i--) {
      clonedArray[i] = array[i].accept(this);
    }
    return clonedArray;
  }

  visitChain(chain) {
    return new Chain(this.cloneExpressionArray(chain.expressions));
  }

  visitBindingBehavior(behavior) {
    return new BindingBehavior(
      behavior.expression.accept(this),
      behavior.name,
      this.cloneExpressionArray(behavior.args));
  }

  visitValueConverter(converter) {
    return new ValueConverter(
      converter.expression.accept(this),
      converter.name,
      this.cloneExpressionArray(converter.args));
  }

  visitAssign(assign) {
    return new Assign(assign.target.accept(this), assign.value.accept(this));
  }

  visitConditional(conditional) {
    return new Conditional(
      conditional.condition.accept(this),
      conditional.yes.accept(this),
      conditional.no.accept(this));
  }

  visitAccessThis(access) {
    return new AccessThis(access.ancestor);
  }

  visitAccessScope(access) {
    return new AccessScope(access.name, access.ancestor);
  }

  visitAccessMember(access) {
    return new AccessMember(access.object.accept(this), access.name);
  }

  visitAccessKeyed(access) {
    return new AccessKeyed(access.object.accept(this), access.key.accept(this));
  }

  visitCallScope(call) {
    return new CallScope(call.name, this.cloneExpressionArray(call.args), call.ancestor);
  }

  visitCallFunction(call) {
    return new CallFunction(call.func.accept(this), this.cloneExpressionArray(call.args));
  }

  visitCallMember(call) {
    return new CallMember(call.object.accept(this), call.name, this.cloneExpressionArray(call.args));
  }

  visitPrefix(prefix) {
    return new PrefixNot(prefix.operation, prefix.expression.accept(this));
  }

  visitBinary(binary) {
    return new Binary(binary.operation, binary.left.accept(this), binary.right.accept(this));
  }

  visitLiteralPrimitive(literal) {
    return new LiteralPrimitive(literal);
  }

  visitLiteralArray(literal) {
    return new LiteralArray(this.cloneExpressionArray(literal.elements));
  }

  visitLiteralObject(literal) {
    return new LiteralObject( literal.keys, this.cloneExpressionArray(literal.values));
  }

  visitLiteralString(literal) {
    return new LiteralString(literal.value);
  }
}

export function cloneExpression(expression) {
  let visitor = new ExpressionCloner();
  return expression.accept(visitor);
}
