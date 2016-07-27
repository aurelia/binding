import {
  AccessThis,
  AccessScope,
  AccessMember,
  AccessKeyed,
  Assign,
  Binary,
  BindingBehavior,
  CallFunction,
  CallMember,
  CallScope,
  Conditional,
  LiteralPrimitive,
  LiteralArray,
  LiteralObject,
  LiteralString,
  PrefixNot,
  ValueConverter,

  bindable,
  containerless,
}
from 'aurelia-framework';

@containerless
export class Expression {
  @bindable value;
  type = null;
  children = null;

  valueChanged({ role, expression }) {
    if (expression instanceof AccessThis) {
      this.type = 'AccessThis';
      this.children = null;
    } else if (expression instanceof AccessScope) {
      this.type = 'AccessScope';
      this.children = null;
    } else if (expression instanceof AccessMember) {
      this.type = 'AccessMember';
      this.children = [{ role: 'Object', expression: expression.object }];
    } else if (expression instanceof AccessKeyed) {
      this.type = 'AccessKeyed';
      this.children = [
        { role: 'Object', expression: expression.object },
        { role: 'Key', expression: expression.key }
      ];
    } else if (expression instanceof Assign) {
      this.type = 'Assign';
      this.children = [
        { role: 'Target', expression: expression.target },
        { role: 'Value', expression: expression.value }
      ];
    } else if (expression instanceof Binary) {
      this.type = 'Binary';
      this.children = [
        { role: 'Left', expression: expression.left },
        { role: 'Right', expression: expression.right }
      ];
    } else if (expression instanceof BindingBehavior) {
      this.type = 'BindingBehavior';
      this.children = [
        { role: 'Target', expression: expression.expression },
        ...expression.args.map(x => ({ role: 'Argument', expression: x }))
      ];
    } else if (expression instanceof CallFunction) {
      this.type = 'CallFunction';
      this.children = [
        { role: 'Function', expression: expression.func },
        ...expression.args.map(x => ({ role: 'Argument', expression: x }))
      ];
    } else if (expression instanceof CallMember) {
      this.type = 'CallMember';
      this.children = [
        { role: 'Object', expression: expression.object },
        ...expression.args.map(x => ({ role: 'Argument', expression: x }))
      ];
    } else if (expression instanceof CallScope) {
      this.type = 'CallScope';
      this.children = expression.args.map(x => ({ role: 'Argument', expression: x }));
    } else if (expression instanceof Conditional) {
      this.type = 'Conditional';
      this.children = [
        { role: 'Condition', expression: expression.condition },
        { role: 'True-Value', expression: expression.yes },
        { role: 'False-Value', expression: expression.no }
      ];
    } else if (expression instanceof LiteralPrimitive) {
      this.type = 'LiteralPrimitive';
      this.children = null;
    } else if (expression instanceof LiteralString) {
      this.type = 'LiteralString';
      this.children = null;
    } else if (expression instanceof LiteralArray) {
      this.type = 'LiteralArray';
      this.children = expression.elements.map(x => ({ role: 'Element', expression: x }));
    } else if (expression instanceof LiteralObject) {
      this.type = 'LiteralObject';
      this.children = expression.values.map(x => ({ role: 'Property Value', expression: x }));
    } else if (expression instanceof PrefixNot) {
      this.type = 'PrefixNot';
      this.children = [{ role: 'Target', expression: expression.expression }];
    } else if (expression instanceof ValueConverter) {
      this.type = 'ValueConverter';
      this.children = [
        { role: 'Target', expression: expression.allArgs[0] },
        ...expression.args.map(x => ({ role: 'Argument', expression: x }))
      ];
    } else {
      this.type = 'Unknown';
      this.children = null;
    }
  }
}
