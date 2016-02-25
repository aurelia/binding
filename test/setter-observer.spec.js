import './setup';
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
});
