import {OoPropertyObserver} from '../src/property-observation';
import {
	executeSharedPropertyObserverTests,
	createObserverLocator
} from './shared';
import {FEATURE} from 'aurelia-pal';
import {initialize} from 'aurelia-pal-browser';

initialize();

describe('OoPropertyObserver', () => {
	var obj, observerLocator, observer;

  if (!FEATURE.objectObserve) {
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

	it('flattens changes', done => {
		let callback = jasmine.createSpy('callback');
		observer.subscribe(callback);
		let oldValue = obj.foo;
		obj.foo = 1;
		obj.foo = 2;
		obj.foo = 3;
		setTimeout(() => {
			expect(callback).toHaveBeenCalledWith(3, oldValue);
			observer.unsubscribe(callback);
			done();
		});
	});

	it('tracks and untracks', () => {
	  expect(obj.__observer__.subscribers).toBe(0);
		let callback = () => {};
		observer.subscribe(callback);
		expect(obj.__observer__.subscribers).toBe(1);
		observer.unsubscribe(callback);
		expect(obj.__observer__.subscribers).toBe(0);
	});
});
