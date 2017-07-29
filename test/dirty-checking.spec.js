import './setup';
import {DirtyCheckProperty} from '../src/dirty-checking';
import {
	executeSharedPropertyObserverTests,
	createObserverLocator
} from './shared';

describe('DirtyCheckProperty', () => {
	var obj, observerLocator, observer;

	class Foo {
    constructor() {
      this._bar = null;
    }
    get bar() {
      return this._bar;
    }
    set bar(newValue) {
      this._bar = newValue;
    }
  }

	beforeAll(() => {
		obj = new Foo();
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
		let callback = () => {};
		observer.subscribe(callback);
		expect(dirtyChecker.tracked.length).toBe(1);
		observer.unsubscribe(callback);
		expect(dirtyChecker.tracked.length).toBe(0);
	});

	it('clears dirty checking timeout when destructor is called', () => {
		var dirtyChecker = observerLocator.dirtyChecker;
		dirtyChecker.timeout = setTimeout(() => {}, 0);
		spyOn(window, 'clearTimeout');
		dirtyChecker.destruct();
		expect(clearTimeout).toHaveBeenCalledWith(dirtyChecker.timeout);
	});

	it('clears tracked when destructor is called', () => {
		var dirtyChecker = observerLocator.dirtyChecker;
		let callback = () => {};
		observer.subscribe(callback);
		dirtyChecker.destruct();
		expect(dirtyChecker.tracked.length).toBe(0);
	});
});
