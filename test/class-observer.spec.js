import './setup';
import {
  createObserverLocator,
  createElement
} from './shared';
import {ClassObserver} from '../src/class-observer';

describe('ClassObserver', () => {
  var element, observerA, observerB;

  beforeAll(() => {
    var locator = createObserverLocator();
    element = createElement('<div class="foo bar"></div>');
    observerA = locator.getObserver(element, 'class');
    observerB = locator.getObserver(element, 'class');
  });

  it('is used', () => {
    expect(observerA instanceof ClassObserver).toBe(true);
    expect(observerB instanceof ClassObserver).toBe(true);
  });

  it('does not share StyleObservers', () => {
    expect(observerA === observerB).toBe(false);
  });

  it('adds and removes own classes', () => {
    var contains = element.classList.contains.bind(element.classList);
    expect(contains('foo') && contains('bar')).toBe(true);
    observerA.setValue(' xxx \t\r\n\v\f yyy  ');
    expect(contains('foo') && contains('bar')).toBe(true);
    expect(contains('xxx') && contains('yyy')).toBe(true);
    expect(observerA.getValue()).toBe(' xxx \t\r\n\v\f yyy  ');
    observerA.setValue('');
    expect(contains('foo') && contains('bar')).toBe(true);
    expect(contains('xxx') || contains('yyy')).toBe(false);
    observerB.setValue('bbb');
    expect(contains('foo') && contains('bar')).toBe(true);
    expect(contains('bbb')).toBe(true);
    observerB.setValue('aaa');
    expect(contains('foo') && contains('bar')).toBe(true);
    expect(contains('aaa') && !contains('bbb')).toBe(true);
    observerA.setValue('foo bar');
    expect(contains('foo') && contains('bar')).toBe(true);
    observerA.setValue('');
    expect(contains('foo') || contains('bar')).toBe(false);
    observerA.setValue('foo');
    expect(contains('foo')).toBe(true);
    observerA.setValue(null);
    expect(contains('foo')).toBe(false);
    observerA.setValue('foo');
    expect(contains('foo')).toBe(true);
    observerA.setValue(undefined);
    expect(contains('foo')).toBe(false);
  });
});
