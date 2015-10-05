import {TaskQueue} from 'aurelia-task-queue';
import {getMapObserver} from '../src/map-observation';
import {initialize} from 'aurelia-pal-browser';

describe('ModifyMapObserver', () => {
  let taskQueue;
  beforeAll(() => {
    initialize();
    taskQueue = new TaskQueue();
  });

  it('identifies set with falsey oldValue as an "update"', done => {
    let map = new Map();
    map.set('foo', 0); // falsey old value.
    let observer = getMapObserver(taskQueue, map);
    let callback = jasmine.createSpy('callback');
    observer.subscribe(callback);
    map.set('foo', 'bar');
    taskQueue.queueMicroTask({
      call: () => {
        expect(callback).toHaveBeenCalledWith([{ type: 'update', object: map, key: 'foo', oldValue: 0 }], undefined);
        observer.unsubscribe(callback);
        done();
      }
    });
  });
});
