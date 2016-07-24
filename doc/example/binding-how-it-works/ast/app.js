import {
  inject,
  observable,
  Parser,
  Chain
}
from 'aurelia-framework';


@inject(Parser)
export class App {
  @observable expressionString;
  value = null;
  examples = [
    { name: 'Basic Property', expression: `firstName` },
    { name: 'Property Path', expression: `person.firstName` },
    { name: 'Conditional', expression: `isActive ? 'active' : ''` },
    { name: 'Array Index', expression: `myArray[index]` },
    { name: 'Binary', expression: `x * y` },
    { name: 'Object Literal', expression: `{ x: 3, y: height, z: depth }` },
    { name: 'Literal Array', expression: `[a, 1, 'hello', null, undefined]` },
    { name: 'Call Method', expression: 'save(entity)' },
    { name: 'Assignment', expression: 'width = rangeInput.value' },
    { name: 'Value Converter', expression: `startDate | dateFormat:'MM/dd/yyyy'` },
    { name: 'Binding Behavior', expression: `lastName & updateTrigger:'blur'` },
    { name: 'Kitchen Sink', expression: `getPosts({ start: minDate, end: maxDate })[0].timestamp | timeAgo & signal:'tick'` },
  ];

  constructor(parser) {
    this.parser = parser;
    this.expressionString = ``;
  }

  expressionStringChanged(newValue, oldValue) {
    this.error = '';
    this.expression = null;

    try {
      let value = { role: 'Root', expression: this.parser.parse(newValue) };
      if (value.expression instanceof Chain) {
        value = null;
      }
      this.value = value;
    }
    catch(e) {
      this.value = null;
      this.error = e.toString();
    }
  }
}
