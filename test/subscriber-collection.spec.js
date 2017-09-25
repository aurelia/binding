import {subscriberCollection} from '../src/subscriber-collection';

@subscriberCollection()
class Test { }

describe('subscriberCollection', () => {
  it('calls subscribers', () => {
    let observer = new Test();
    let observer2 = new Test();

    let callable1 = { call: jasmine.createSpy('call') };
    observer.addSubscriber('1', callable1);
    let callable2 = { call: jasmine.createSpy('call') };
    observer.addSubscriber('2', callable2);
    let callable3 = { call: jasmine.createSpy('call') };
    observer.addSubscriber('3', callable3);
    let callable4 = { call: jasmine.createSpy('call').and.callFake(() => observer2.callSubscribers('new value2', 'old value2')) };
    observer.addSubscriber('4', callable4);
    let callable5 = { call: jasmine.createSpy('call') };
    observer.addSubscriber('5', callable5);

    let callable6 = { call: jasmine.createSpy('call') };
    observer2.addSubscriber('6', callable6);
    let callable7 = { call: jasmine.createSpy('call') };
    observer2.addSubscriber('7', callable7);
    let callable8 = { call: jasmine.createSpy('call') };
    observer2.addSubscriber('8', callable8);
    let callable9 = { call: jasmine.createSpy('call') };
    observer2.addSubscriber('9', callable9);
    let callable10 = { call: jasmine.createSpy('call') };
    observer2.addSubscriber('10', callable10);

    observer.callSubscribers('new value', 'old value');

    expect(callable1.call).toHaveBeenCalledWith('1', 'new value', 'old value');
    expect(callable2.call).toHaveBeenCalledWith('2', 'new value', 'old value');
    expect(callable3.call).toHaveBeenCalledWith('3', 'new value', 'old value');
    expect(callable4.call).toHaveBeenCalledWith('4', 'new value', 'old value');
    expect(callable5.call).toHaveBeenCalledWith('5', 'new value', 'old value');
    expect(callable6.call).toHaveBeenCalledWith('6', 'new value2', 'old value2');
    expect(callable7.call).toHaveBeenCalledWith('7', 'new value2', 'old value2');
    expect(callable8.call).toHaveBeenCalledWith('8', 'new value2', 'old value2');
    expect(callable9.call).toHaveBeenCalledWith('9', 'new value2', 'old value2');
    expect(callable10.call).toHaveBeenCalledWith('10', 'new value2', 'old value2');
  });

  it('removes subscribers', () => {
    let observer = new Test();

    let subscribers = [];
    for (let i = 0, ii = 100; ii > i; ++i) {
      observer.addSubscriber((i % 5).toString(), subscribers[i] = { i });
    }

    let removalCount = 0;
    for (let i = 4, ii = subscribers.length; ii > i; i += 5) {
      let result = observer.removeSubscriber((i % 5).toString(), subscribers[i]);
      if (result) {
        removalCount++;
      }
    }
    expect(observer._callablesRest.length).toBe(subscribers.length - 3 - removalCount);

    expect(observer.removeSubscriber('5', {})).toBe(false);
  });
});
