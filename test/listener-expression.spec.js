import './setup';
import {fireEvent, checkDelay} from './shared';
import {Parser} from '../src/parser';
import {EventManager} from '../src/event-manager';
import {ListenerExpression} from '../src/listener-expression';
import {createScopeForTest} from '../src/scope';
import {DOM} from 'aurelia-pal';

describe('ListenerExpression', () => {
  it('binds', () => {
    let eventName = 'mousemove';

    // create expression
    let delegate = false;
    let preventDefault = false;
    let lookupFunctions = { bindingBehaviors: name => null, valueConverters: name => null };
    let listenerExpression = new ListenerExpression(
      new EventManager(),
      eventName,
      new Parser().parse('doSomething($event, arg1, arg2)'),
      delegate,
      preventDefault,
      lookupFunctions);

    // create binding
    let target = DOM.createElement('div');
    let binding = listenerExpression.createBinding(target);

    // create view model
    let viewModel = {
      arg1: 1,
      arg2: { hello: 'world' },
      doSomething: ($event, arg1, arg2, ...rest) => {
        return arg1;
      }
    };
    spyOn(viewModel, 'doSomething').and.callThrough();

    // bind
    binding.bind(createScopeForTest(viewModel));

    // fire event
    let event = DOM.createCustomEvent(eventName);
    target.dispatchEvent(event);
    expect(viewModel.doSomething).toHaveBeenCalledWith(event, viewModel.arg1, viewModel.arg2);

    // unbind
    binding.unbind();
  });
});
