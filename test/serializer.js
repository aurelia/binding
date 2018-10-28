export class Serializer {
  static serialize(expr) {
    const visitor = new Serializer();
    if (expr === null || expr === undefined || typeof expr.accept !== 'function') {
      return `${expr}`;
    }
    return expr.accept(visitor);
  }
  visitAccessMember(expr) {
    return `{"type":"AccessMember","name":${expr.name},"object":${expr.object.accept(this)}}`;
  }
  visitAccessKeyed(expr) {
    return `{"type":"AccessKeyed","object":${expr.object.accept(this)},"key":${expr.key.accept(this)}}`;
  }
  visitAccessThis(expr) {
    return `{"type":"AccessThis","ancestor":${expr.ancestor}}`;
  }
  visitAccessScope(expr) {
    return `{"type":"AccessScope","name":"${expr.name}","ancestor":${expr.ancestor}}`;
  }
  visitLiteralArray(expr) {
    return `{"type":"LiteralArray","elements":${this.serializeExpressions(expr.elements)}}`;
  }
  visitLiteralObject(expr) {
    return `{"type":"LiteralObject","keys":${serializePrimitives(expr.keys)},"values":${this.serializeExpressions(expr.values)}}`;
  }
  visitLiteralPrimitive(expr) {
    return `{"type":"LiteralPrimitive","value":${serializePrimitive(expr.value)}}`;
  }
  visitLiteralString(expr) {
    return `{"type":"LiteralString","value":${serializePrimitive(expr.value)}}`;
  }
  visitCallFunction(expr) {
    return `{"type":"CallFunction","func":${expr.func.accept(this)},"args":${this.serializeExpressions(expr.args)}}`;
  }
  visitCallMember(expr) {
    return `{"type":"CallMember","name":"${expr.name}","object":${expr.object.accept(this)},"args":${this.serializeExpressions(expr.args)}}`;
  }
  visitCallScope(expr) {
    return `{"type":"CallScope","name":"${expr.name}","ancestor":${expr.ancestor},"args":${this.serializeExpressions(expr.args)}}`;
  }
  visitLiteralTemplate(expr) {
    return `{"type":"LiteralTemplate","cooked":${serializePrimitives(expr.cooked)},"raw":${serializePrimitives(expr.cooked.raw)},"expressions":${this.serializeExpressions(expr.expressions)}}`;
  }
  visitUnary(expr) {
    return `{"type":"Unary","operation":"${expr.operation}","expression":${expr.expression.accept(this)}}`;
  }
  visitBinary(expr) {
    return `{"type":"Binary","operation":"${expr.operation}","left":${expr.left.accept(this)},"right":${expr.right.accept(this)}}`;
  }
  visitConditional(expr) {
    return `{"type":"Conditional","condition":${expr.condition.accept(this)},"yes":${expr.yes.accept(this)},"no":${expr.no.accept(this)}}`;
  }
  visitAssign(expr) {
    return `{"type":"Assign","target":${expr.target.accept(this)},"value":${expr.value.accept(this)}}`;
  }
  visitValueConverter(expr) {
    return `{"type":"ValueConverter","name":"${expr.name}","expression":${expr.expression.accept(this)},"args":${this.serializeExpressions(expr.args)}}`;
  }
  visitBindingBehavior(expr) {
    return `{"type":"BindingBehavior","name":"${expr.name}","expression":${expr.expression.accept(this)},"args":${this.serializeExpressions(expr.args)}}`;
  }
  // tslint:disable-next-line:no-any
  serializeExpressions(args) {
    let text = '[';
    for (let i = 0, ii = args.length; i < ii; ++i) {
      if (i !== 0) {
        text += ',';
      }
      text += args[i].accept(this);
    }
    text += ']';
    return text;
  }
}

// tslint:disable-next-line:no-any
function serializePrimitives(values) {
  let text = '[';
  for (let i = 0, ii = values.length; i < ii; ++i) {
    if (i !== 0) {
      text += ',';
    }
    text += serializePrimitive(values[i]);
  }
  text += ']';
  return text;
}

  // tslint:disable-next-line:no-any
function serializePrimitive(value) {
  if (typeof value === 'string') {
    return `"\\"${escapeString(value)}\\""`;
  } else if (value === null || value === undefined) {
    return `"${value}"`;
  }
  return `${value}`;
}

function escapeString(str) {
  let ret = '';
  for (let i = 0, ii = str.length; i < ii; ++i) {
    ret += escape(str.charAt(i));
  }
  return ret;
}

function escape(ch) {
  switch (ch) {
  case '\b': return '\\b';
  case '\t': return '\\t';
  case '\n': return '\\n';
  case '\v': return '\\v';
  case '\f': return '\\f';
  case '\r': return '\\r';
  case '\"': return '\\"';
  case '\'': return '\\\'';
  case '\\': return '\\\\';
  default: return ch;
  }
}
