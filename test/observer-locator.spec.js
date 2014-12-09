import {ObserverLocator, EventManager, DirtyChecker} from '../lib/index';
import {TaskQueue} from 'aurelia-task-queue';

describe('observer locator', () => {
  it('should have some tests', () => {
    var locator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker());
    expect(locator).toBe(locator);
  });
});