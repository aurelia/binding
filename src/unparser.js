export let Unparser = null;

if (typeof FEATURE_NO_UNPARSER === 'undefined') {
  Unparser = class {
    constructor(buffer) {
      this.buffer = buffer;
    }

    static unparse(expression) {
      let buffer = [];
      let visitor = new Unparser(buffer);

      expression.accept(visitor);

      return buffer.join('');
    }

    write(text) {
      this.buffer.push(text);
    }

    writeArgs(args) {
      this.write('(');

      for (let i = 0, length = args.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        args[i].accept(this);
      }

      this.write(')');
    }

    visitBindingBehavior(behavior) {
      let args = behavior.args;

      behavior.expression.accept(this);
      this.write(`&${behavior.name}`);

      for (let i = 0, length = args.length; i < length; ++i) {
        this.write(':');
        args[i].accept(this);
      }
    }

    visitValueConverter(converter) {
      let args = converter.args;

      converter.expression.accept(this);
      this.write(`|${converter.name}`);

      for (let i = 0, length = args.length; i < length; ++i) {
        this.write(':');
        args[i].accept(this);
      }
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

    visitAccessThis(access) {
      if (access.ancestor === 0) {
        this.write('$this');
        return;
      }
      this.write('$parent');
      let i = access.ancestor - 1;
      while (i--) {
        this.write('.$parent');
      }
    }

    visitAccessScope(access) {
      let i = access.ancestor;
      while (i--) {
        this.write('$parent.');
      }
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
      let i = call.ancestor;
      while (i--) {
        this.write('$parent.');
      }
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
      if (prefix.operation.charCodeAt(0) >= /*a*/97) {
        // add a space after if it's a keyword unary operator
        // note: the Bitwise NOT (~) has charCode 126, so if/when that operator is added, it should be excluded here
        this.write(' ');
      }
      prefix.expression.accept(this);
      this.write(')');
    }

    visitBinary(binary) {
      binary.left.accept(this);
      if (binary.operation.charCodeAt(0) === /*i*/105) {
        // add a space before and after if it's either 'in' or 'instanceof'
        this.write(` ${binary.operation} `);
      } else {
        this.write(binary.operation);
      }
      binary.right.accept(this);
    }

    visitLiteralPrimitive(literal) {
      this.write(`${literal.value}`);
    }

    visitLiteralArray(literal) {
      let elements = literal.elements;

      this.write('[');

      for (let i = 0, length = elements.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        elements[i].accept(this);
      }

      this.write(']');
    }

    visitLiteralObject(literal) {
      let keys = literal.keys;
      let values = literal.values;

      this.write('{');

      for (let i = 0, length = keys.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        this.write(`'${keys[i]}':`);
        values[i].accept(this);
      }

      this.write('}');
    }

    visitLiteralString(literal) {
      let escaped = literal.value.replace(/'/g, "\'");
      this.write(`'${escaped}'`);
    }

    visitLiteralTemplate(literal) {
      const { cooked, expressions } = literal;
      const length = expressions.length;
      this.write('`');
      this.write(cooked[0]);
      for (let i = 0; i < length; i++) {
        expressions[i].accept(this);
        this.write(cooked[i + 1]);
      }
      this.write('`');
    }
  };
}
