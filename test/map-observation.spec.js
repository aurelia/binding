import {TaskQueue} from 'aurelia-task-queue';
import {getMapObserver} from '../src/map-observation';
import {initialize} from 'aurelia-pal-browser';

describe('ModifyMapObserver', () => {
  let taskQueue;
  beforeAll(() => {
    initialize();
    taskQueue = new TaskQueue();
  });

  it('getMapObserver should return same observer instance for the same Map instance', () => {
    let map = new Map();
    let observer1 = getMapObserver(taskQueue, map);
    let observer2 = getMapObserver(taskQueue, map);

    expect(observer1 === observer2).toBe(true);
  });

  it('getMapObserver should return different observer instances for different Map instances', () => {
    let map1 = new Map();
    let map2 = new Map();
    let observer1 = getMapObserver(taskQueue, map1);
    let observer2 = getMapObserver(taskQueue, map2);

    expect(observer1 !== observer2).toBe(true);
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
