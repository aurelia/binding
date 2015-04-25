import {TaskQueue} from 'aurelia-task-queue';
import {SetterObserver} from '../src/property-observation';
import {
	executeSharedPropertyObserverTests
} from './shared';

describe('SetterObserver', () => {
  var obj, observer;

  beforeAll(() => {
    var taskQueue = new TaskQueue();
    obj = { foo: 'bar' };
    observer = new SetterObserver(taskQueue, obj, 'foo');
  });

  it('implements the property observer api', done => {
    executeSharedPropertyObserverTests(obj, observer, done);
  });

  it('stops observing if there are no callbacks', () => {
    var dispose = observer.subscribe(() => {});
    expect(observer.observing).toBe(true);
    expect(observer.callbacks.length).toBe(1);
    dispose();
    expect(observer.callbacks.length).toBe(0);
  });

  it('keeps observing if there are callbacks', () => {
    var dispose = observer.subscribe(() => {});
    observer.subscribe(() => {});
    dispose();
    expect(observer.callbacks.length).toBe(1);
  });
});
