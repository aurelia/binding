import {ObserverLocator, EventManager, DirtyChecker} from '../src/index';
import {TaskQueue} from 'aurelia-task-queue';
import {DirtyCheckProperty} from '../src/dirty-checking';
import {Binding, BindingExpression} from '../src/binding-expression';
import {Parser} from '../src/parser';
import {ONE_WAY, TWO_WAY} from '../src/binding-modes';

describe('observer locator', () => {
  var obj, locator, parser;

  function createElement(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.firstChild;
  }

  beforeEach(() => {
    obj = { foo: 'bar' };
    locator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), []);
    parser = new Parser();
  });

  it('should bind attributes', () => {
    var i, ii, el, expression, binding, attr, attrs;
    attrs = ['id', 'data-name', 'data-11111', 'data-name-to-test', 'data-1name-2-test', 'data-a-b-c'];

    for (i = 0, ii = attrs.length; i < ii; i++) {
      attr = attrs[i];
      el = createElement('<h1 '+ attr + '.bind="foo">test</h1>');
      expression = new BindingExpression(locator, attr, parser.parse('foo'), ONE_WAY, name => undefined, undefined);
      binding = expression.createBinding(el);
      binding.bind(obj);
      expect(el.getAttribute(attr)).toBe('bar');
    }
  });
});
