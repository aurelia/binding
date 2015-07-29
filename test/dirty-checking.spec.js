import {DirtyCheckProperty} from '../src/dirty-checking';
import {
	FooNoDep,
	executeSharedPropertyObserverTests,
	createObserverLocator
} from './shared';

describe('DirtyCheckProperty', () => {
	var obj, observerLocator, observer;

	beforeAll(() => {
		obj = new FooNoDep();
		observerLocator = createObserverLocator();
		observer = observerLocator.getObserver(obj, 'bar');
	});

	it('is a DirtyCheckProperty', () => {
		expect(observer instanceof DirtyCheckProperty).toBe(true);
	});

  it('implements the property observer api', done => {
    executeSharedPropertyObserverTests(obj, observer, done);
  });

	it('tracks and untracks', () => {
	  var dirtyChecker = observerLocator.dirtyChecker,
				dispose;
		expect(dirtyChecker.tracked.length).toBe(0);
		dispose = observer.subscribe(() => {});
		expect(dirtyChecker.tracked.length).toBe(1);
		dispose();
		expect(dirtyChecker.tracked.length).toBe(0);
	});
});
