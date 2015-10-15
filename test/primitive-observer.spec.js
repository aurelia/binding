import {PrimitiveObserver} from '../src/property-observation';
import {createObserverLocator} from './shared';

describe('PrimitiveObserver', () => {
	let observerLocator;

	beforeAll(() => {
		observerLocator = createObserverLocator();
	});

	it('handles numbers', () => {
		expect(observerLocator.getObserver(0, 'foo') instanceof PrimitiveObserver).toBe(true);
    expect(observerLocator.getObserver(Number.NaN, 'foo') instanceof PrimitiveObserver).toBe(true);
    expect(observerLocator.getObserver(Infinity, 'foo') instanceof PrimitiveObserver).toBe(true);

    let observer = observerLocator.getObserver(0, 'foo');
    expect(observer.getValue()).toBe(undefined);

    let threw = false;
    try {
      observer.subscribe();
      observer.unsubscribe();
    } catch(e) {
      threw = true;
    }
    expect(threw).toBe(false);

    let error;
    try {
      observer.setValue('bar');
    } catch(e) {
      error = e;
    }
    expect(error).toEqual(new Error(`The foo property of a number (0) cannot be assigned.`));
	});

  it('handles strings', () => {
		expect(observerLocator.getObserver('foo', 'bar') instanceof PrimitiveObserver).toBe(true);
    expect(observerLocator.getObserver(new String('foo'), 'bar') instanceof PrimitiveObserver).toBe(false);

    let observer = observerLocator.getObserver('foo', 'length');
    expect(observer.getValue()).toBe(3);

    let threw = false;
    try {
      observer.subscribe();
      observer.unsubscribe();
    } catch(e) {
      threw = true;
    }
    expect(threw).toBe(false);

    let error;
    try {
      observer.setValue('bar');
    } catch(e) {
      error = e;
    }
    expect(error).toEqual(new Error(`The length property of a string (foo) cannot be assigned.`));
	});

  it('handles booleans', () => {
		expect(observerLocator.getObserver(true, 'foo') instanceof PrimitiveObserver).toBe(true);
    expect(observerLocator.getObserver(false, 'foo') instanceof PrimitiveObserver).toBe(true);

    let observer = observerLocator.getObserver(true, 'foo');
    expect(observer.getValue()).toBe(undefined);

    let threw = false;
    try {
      observer.subscribe();
      observer.unsubscribe();
    } catch(e) {
      threw = true;
    }
    expect(threw).toBe(false);

    let error;
    try {
      observer.setValue('bar');
    } catch(e) {
      error = e;
    }
    expect(error).toEqual(new Error(`The foo property of a boolean (true) cannot be assigned.`));
	});
});
