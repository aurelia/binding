import {OoPropertyObserver} from '../src/property-observation';
import {
	executeSharedPropertyObserverTests,
	createObserverLocator
} from './shared';
import {hasObjectObserve} from '../src/environment';

describe('OoPropertyObserver', () => {
	var obj, observerLocator, observer;

  if (!hasObjectObserve) {
    return;
  }

	beforeAll(() => {
		obj = { foo: 'bar' };
		observerLocator = createObserverLocator();
		observer = observerLocator.getObserver(obj, 'foo');
	});

	it('is a OoPropertyObserver', () => {
		expect(observer instanceof OoPropertyObserver).toBe(true);
	});

  it('implements the property observer api', done => {
    executeSharedPropertyObserverTests(obj, observer, done);
  });

	it('tracks and untracks', () => {
	  var dispose;
		expect(observer.callbacks.length).toBe(0);
		dispose = observer.subscribe(() => {});
		expect(observer.callbacks.length).toBe(1);
		dispose();
		expect(observer.callbacks.length).toBe(0);
	});
});
