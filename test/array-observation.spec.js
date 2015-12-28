import {TaskQueue} from 'aurelia-task-queue';
import {getArrayObserver} from '../src/array-observation';

describe('array observation', () => {
  let taskQueue;

  beforeAll(() => {
    taskQueue = new TaskQueue();
  });

  it('pops', () => {
    let array = ['foo', 'bar', 'hello', 'world'];
    array.pop();
    Array.prototype.pop.call(array);
    expect(array).toEqual(['foo', 'bar']);
    let observer = getArrayObserver(taskQueue, array);
    spyOn(observer, 'addChangeRecord');
    array.pop();
    expect(observer.addChangeRecord).toHaveBeenCalled();
    observer.addChangeRecord.calls.reset();
    Array.prototype.pop.call(array);
    expect(observer.addChangeRecord).toHaveBeenCalled();
    expect(array).toEqual([]);
  });

  it('pushes', () => {
    let array = [];
    array.push('foo');
    Array.prototype.push.call(array, 'bar');
    expect(array).toEqual(['foo', 'bar']);
    let observer = getArrayObserver(taskQueue, array);
    spyOn(observer, 'addChangeRecord');
    array.push('hello');
    expect(observer.addChangeRecord).toHaveBeenCalled();
    observer.addChangeRecord.calls.reset();
    Array.prototype.push.call(array, 'world');
    expect(observer.addChangeRecord).toHaveBeenCalled();
    expect(array).toEqual(['foo', 'bar', 'hello', 'world']);
  });

  it('reverses', () => {
    let array = [1, 2, 3, 4];
    array.reverse();
    expect(array).toEqual([4, 3, 2, 1]);
    Array.prototype.reverse.call(array);
    expect(array).toEqual([1, 2, 3, 4]);
    let observer = getArrayObserver(taskQueue, array);
    spyOn(observer, 'flushChangeRecords');
    spyOn(observer, 'reset');
    array.reverse();
    expect(array).toEqual([4, 3, 2, 1]);
    expect(observer.flushChangeRecords).toHaveBeenCalled();
    expect(observer.reset).toHaveBeenCalled();
    observer.flushChangeRecords.calls.reset();
    observer.reset.calls.reset();
    Array.prototype.reverse.call(array);
    expect(array).toEqual([1, 2, 3, 4]);
    expect(observer.flushChangeRecords).toHaveBeenCalled();
    expect(observer.reset).toHaveBeenCalled();
  });

  it('shifts', () => {
    let array = ['foo', 'bar', 'hello', 'world'];
    array.shift();
    Array.prototype.shift.call(array);
    expect(array).toEqual(['hello', 'world']);
    let observer = getArrayObserver(taskQueue, array);
    spyOn(observer, 'addChangeRecord');
    array.shift();
    expect(observer.addChangeRecord).toHaveBeenCalled();
    observer.addChangeRecord.calls.reset();
    Array.prototype.shift.call(array);
    expect(observer.addChangeRecord).toHaveBeenCalled();
    expect(array).toEqual([]);
  });

  it('sorts', () => {
    let array = [1, 2, 3, 4];
    array.sort((a, b) => b - a);
    expect(array).toEqual([4, 3, 2, 1]);
    Array.prototype.sort.call(array, (a, b) => a - b);
    expect(array).toEqual([1, 2, 3, 4]);
    let observer = getArrayObserver(taskQueue, array);
    spyOn(observer, 'flushChangeRecords');
    spyOn(observer, 'reset');
    array.sort((a, b) => b - a);
    expect(array).toEqual([4, 3, 2, 1]);
    expect(observer.flushChangeRecords).toHaveBeenCalled();
    expect(observer.reset).toHaveBeenCalled();
    observer.flushChangeRecords.calls.reset();
    observer.reset.calls.reset();
    Array.prototype.sort.call(array, (a, b) => a - b);
    expect(array).toEqual([1, 2, 3, 4]);
    expect(observer.flushChangeRecords).toHaveBeenCalled();
    expect(observer.reset).toHaveBeenCalled();
  });

  it('splices', () => {
    let array = [1, 2, 3, 4];
    array.splice(1, 1, 'hello');
    Array.prototype.splice.call(array, 2, 1, 'world');
    expect(array).toEqual([1, 'hello', 'world', 4]);
    let observer = getArrayObserver(taskQueue, array);
    spyOn(observer, 'addChangeRecord');
    array.splice(1, 1, 'foo');
    expect(observer.addChangeRecord).toHaveBeenCalled();
    observer.addChangeRecord.calls.reset();
    Array.prototype.splice.call(array, 2, 1, 'bar');
    expect(observer.addChangeRecord).toHaveBeenCalled();
    expect(array).toEqual([1, 'foo', 'bar', 4]);
  });

  it('unshifts', () => {
    let array = [];
    array.unshift('foo');
    Array.prototype.unshift.call(array, 'bar');
    expect(array).toEqual(['bar', 'foo']);
    let observer = getArrayObserver(taskQueue, array);
    spyOn(observer, 'addChangeRecord');
    array.unshift('hello');
    expect(observer.addChangeRecord).toHaveBeenCalled();
    observer.addChangeRecord.calls.reset();
    Array.prototype.unshift.call(array, 'world');
    expect(observer.addChangeRecord).toHaveBeenCalled();
    expect(array).toEqual(['world', 'hello', 'bar', 'foo']);
  });
});
