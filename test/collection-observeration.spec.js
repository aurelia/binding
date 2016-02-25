import './setup';
import {createObserverLocator, checkDelay} from './shared';
import {ModifyCollectionObserver} from '../src/collection-observation';

describe('collection length', () => {
  var locator;
  beforeAll(() => {
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

describe('addChangeRecord', () => {
  var locator;
  beforeAll(() => {
    locator = new ModifyCollectionObserver();
    locator.lengthObserver = true;
    locator.queued = true;
  });

  beforeEach(() => {
    locator.changeRecords = null;
  });

  describe('splice record', () => {
    it('should not change index when deleting last item - splice(3, 1)', ()=> {
      let array = array = ['1', '2', '3'];
      let record = {
        type: 'splice',
        object: array,
        index: 3,
        removed: ['4'],
        addedCount: 0
       };

       locator.addChangeRecord(record);

       expect(locator.changeRecords[0].index).toBe(3);
    });

    it('should set index of last item when index -1 - splice(-1, 1)', ()=> {
      let array = array = ['1', '2', '3'];
      let record = {
        type: 'splice',
        object: array,
        index: -1,
        removed: ['4'],
        addedCount: 0
       };

       locator.addChangeRecord(record);

       expect(locator.changeRecords[0].index).toBe(3);
    });

    it('should set index of second last item when index -2 - splice(-2, 1)', ()=> {
      let array = array = ['1', '2', '4'];
        let record = {
         type: 'splice',
         object: array,
         index: -2,
         removed: ['3'],
         addedCount: 0
       };

       locator.addChangeRecord(record);

       expect(locator.changeRecords[0].index).toBe(2);
    });

    it('should set index of second last item when index -1 and adding 1 - splice(-1, 0, "Foo")', ()=> {
      let array = array = ['1', '2', '3', 'Foo', '4'];
        let record = {
         type: 'splice',
         object: array,
         index: -1,
         removed: [],
         addedCount: 1
       };

       locator.addChangeRecord(record);

       expect(locator.changeRecords[0].index).toBe(3);
    });

    it('should set index of third last item when index -2 and adding 1 - splice(-2, 0, "Foo")', ()=> {
      let array = array = ['1', '2', 'Foo', '3', '4'];
        let record = {
         type: 'splice',
         object: array,
         index: -2,
         removed: [],
         addedCount: 1
       };

       locator.addChangeRecord(record);

       expect(locator.changeRecords[0].index).toBe(2);
    });

    it('should set index of third last item when index -1 and adding 1 - splice(-1, 0, "Foo", "Bar")', ()=> {
      let array = ['1', '2', '3', 'Foo', 'Bar', '4'];
        let record = {
         type: 'splice',
         object: array,
         index: -1,
         removed: [],
         addedCount: 2
       };

       locator.addChangeRecord(record);

       expect(locator.changeRecords[0].index).toBe(3);
    });

    it('should set index of second last item on index -1 removing 1 adding 1  - splice(-1, 1, "Foo")', ()=> {
      let array = array = ['1', '2', '3', 'Foo'];
      let record = {
       type: 'splice',
       object: array,
       index: -1,
       removed: ['4'],
       addedCount: 1
      };

      locator.addChangeRecord(record);

      expect(locator.changeRecords[0].index).toBe(3);
    });

    it('should set index to array length minus added count when index bigger than array - splice(6, 0, "Foo")', ()=> {
      let array = array = ['1', '2', '3', '4', 'Foo'];
      let record = {
       type: 'splice',
       object: array,
       index: 6,
       removed: [],
       addedCount: 1
      };

       locator.addChangeRecord(record);

       expect(locator.changeRecords[0].index).toBe(4);
    });
  });
});
