import {TaskQueue} from 'aurelia-task-queue';
import {SetterObserver} from '../src/property-observation';
import {
	executeSharedPropertyObserverTests
} from './shared';
import {initialize} from 'aurelia-pal-browser';

describe('SetterObserver', () => {
  var obj, observer;

  beforeAll(() => {
		initialize();
    var taskQueue = new TaskQueue();
    obj = { foo: 'bar' };
    observer = new SetterObserver(taskQueue, obj, 'foo');
  });

  it('implements the property observer api', done => {
    executeSharedPropertyObserverTests(obj, observer, done);
  });
});
