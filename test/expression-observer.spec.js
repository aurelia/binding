import './setup';
import {ExpressionObserver} from '../src/expression-observer';
import {AccessScope} from '../src/ast';
import {createOverrideContext} from '../src/scope';
import {
  createObserverLocator,
	executeSharedPropertyObserverTests
} from './shared';

describe('SetterObserver', () => {
  var obj, observer;

  beforeAll(() => {
    obj = { foo: 'bar' };
    let scope = { bindingContext: obj, overrideContext: createOverrideContext(obj) };
    observer = new ExpressionObserver(scope, new AccessScope('foo', 0), createObserverLocator());
  });

  it('implements the property observer api', done => {
    executeSharedPropertyObserverTests(obj, observer, done);
  });
});
