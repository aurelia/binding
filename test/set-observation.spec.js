import {TaskQueue} from 'aurelia-task-queue';
import {getSetObserver} from '../src/set-observation';
import {initialize} from 'aurelia-pal-browser';

describe('ModifySetObserver', () => {
  let taskQueue;
  let set;
  let observer;
  let callback;
  beforeAll(() => {
    initialize();
    taskQueue = new TaskQueue();
  });

  beforeEach(() => {
    set = new Set(['foo', 'bar']);
    observer = getSetObserver(taskQueue, set);
    callback = jasmine.createSpy('callback');
    observer.subscribe(callback);
  });

  it('getSetObserver should return same observer instance for the same Set instance', () => {
    let set = new Set();
    let observer1 = getSetObserver(taskQueue, set);
    let observer2 = getSetObserver(taskQueue, set);

    expect(observer1 === observer2).toBe(true);
  });

  it('getSetObserver should return different observer instances for different Set instances', () => {
    let set1 = new Set();
    let set2 = new Set();
    let observer1 = getSetObserver(taskQueue, set1);
    let observer2 = getSetObserver(taskQueue, set2);

    expect(observer1 !== observer2).toBe(true);
  });

  it('should add changeRecord on add', done => {
    set.add('baz');
    taskQueue.queueMicroTask({
      call: () => {
        expect(callback).toHaveBeenCalledWith([{ type: 'add', object: set, value: 'baz' }], undefined);
        observer.unsubscribe(callback);
        done();
      }
    });
  });

  it('should not add changeRecord on add when entry already exists', done => {
    set.add('bar');
    taskQueue.queueMicroTask({
      call: () => {
        expect(callback).not.toHaveBeenCalled();
        observer.unsubscribe(callback);
        done();
      }
    });
  });

  it('should add changeRecord on delete', done => {
    set.delete('bar');
    taskQueue.queueMicroTask({
      call: () => {
        expect(callback).toHaveBeenCalledWith([{ type: 'delete', object: set, value: 'bar' }], undefined);
        observer.unsubscribe(callback);
        done();
      }
    });
  });

  it('should not add changeRecord on delete when entry does not exist', done => {
    set.delete('baz');
    taskQueue.queueMicroTask({
      call: () => {
        expect(callback).not.toHaveBeenCalled();
        observer.unsubscribe(callback);
        done();
      }
    });
  });

  it('should add changeRecord on clear', done => {
    set.clear();
    taskQueue.queueMicroTask({
      call: () => {
        expect(callback).toHaveBeenCalledWith([{ type: 'clear', object: set }], undefined);
        observer.unsubscribe(callback);
        done();
      }
    });
  });
});
