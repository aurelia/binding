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
  name = '???';
  children = null;
  
  valueChanged({ role, expression }) {
    if (expression instanceof AccessThis) {
      this.children = null;
    } else if (expression instanceof AccessScope) {
      this.children = null;
    } else if (expression instanceof AccessMember) {
      this.children = [{ role: 'object', expression: expression.object }];
    } else if (expression instanceof AccessKeyed) {
      this.children = [
        { role: 'Object', expression: expression.object }, 
        { role: 'Key', expression: expression.key }
      ];
    } else if (expression instanceof Assign) {
      this.children = [
        { role: 'Target', expression: expression.target }, 
        { role: 'Value', expression: expression.value }
      ];
    } else if (expression instanceof Binary) {
      this.children = [
        { role: 'Left', expression: expression.left },
        { role: 'Right', expression: expression.right }
      ];
    } else if (expression instanceof BindingBehavior) {
      this.children = [
        { role: 'Target', expression: expression.expression },
        ...expression.args.map(x => ({ role: 'Argument', expression: x }))
      ];
    } else if (expression instanceof CallFunction) {
      this.children = [
        { role: 'Function', expression: expression.func }, 
        ...expression.args.map(x => ({ role: 'Argument', expression: x }))
      ];
    } else if (expression instanceof CallMember) {
      this.children = [
        { role: 'Object', expression: expression.object },
        ...expression.args.map(x => ({ role: 'Argument', expression: x }))
      ];
    } else if (expression instanceof CallScope) {
      this.children = expression.args.map(x => ({ role: 'Argument', expression: x }));
    } else if (expression instanceof Conditional) {
      this.children = [
        { role: 'Condition', expression: expression.condition },
        { role: 'True-Value', expression: expression.yes },
        { role: 'False-Value', expression: expression.no }
      ];
    } else if (expression instanceof LiteralPrimitive || expression instanceof LiteralString) {
      this.children = null;
    } else if (expression instanceof LiteralArray) {
      this.children = expression.elements.map(x => ({ role: 'Element', expression: x }));
    } else if (expression instanceof LiteralObject) {
      this.children = expression.values.map(x => ({ role: 'Property Value', expression: x }));
    } else if (expression instanceof PrefixNot) {
      this.children = [{ role: 'Target', expression: expression.expression }];
    } else if (expression instanceof ValueConverter) {
      this.children = [
        { role: 'Target', expression: expression.allArgs[0] },
        ...expression.args.map(x => ({ role: 'Argument', expression: x }))
      ];
    } else {
      this.children = null;
    }
  }
}