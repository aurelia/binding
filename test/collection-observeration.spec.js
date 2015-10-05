import {createObserverLocator, checkDelay} from './shared';
import {initialize} from 'aurelia-pal-browser';

describe('collection length', () => {
  var locator;
  beforeAll(() => {
    initialize();
    locator = createObserverLocator();
  });

  it('should observe array.length', done => {
    var obj = [],
        observer = locator.getObserver(obj, 'length'),
        callback = jasmine.createSpy('callback');
    observer.subscribe(callback);
    expect(observer.getValue()).toBe(0);
    obj.push('foo');
    expect(observer.getValue()).toBe(1);
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(1, 0);
      observer.unsubscribe(callback);
      done();
    }, checkDelay * 2);
  });

  it('should observe map.size', done => {
    var obj = new Map(),
        observer = locator.getObserver(obj, 'size'),
        callback = jasmine.createSpy('callback');
    observer.subscribe(callback);
    expect(observer.getValue()).toBe(0);
    obj.set('foo', 'bar')
    expect(observer.getValue()).toBe(1);
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(1, 0);
      observer.unsubscribe(callback);
      done();
    }, checkDelay * 2);
  });
});
