// import {OoPropertyObserver, UndefinedPropertyObserver} from '../src/property-observation';
// import {TestObservationAdapter, AdapterPropertyObserver} from './adapter';
// import {DirtyCheckProperty} from '../src/dirty-checking';
// import {
// 	executeSharedPropertyObserverTests,
// 	createObserverLocator
// } from './shared';
// import {hasObjectObserve} from '../src/environment';
//
// describe('UndefinedPropertyObserver', () => {
//   var obj, observer;
//
//   if (!hasObjectObserve) {
//     return;
//   }
//
//   beforeEach(() => {
//     var locator = createObserverLocator([new TestObservationAdapter(() => locator)]);
//     obj = {};
//     observer = locator.getObserver(obj, 'foo');
//     expect(observer instanceof UndefinedPropertyObserver).toBe(true);
//     expect(observer.getValue()).toBeUndefined();
//   });
//
//   it('handles primitive properties created via setValue', (done) => {
//     var callback = callback = jasmine.createSpy('callback'),
//         dispose = observer.subscribe(callback);
//     observer.setValue('bar');
//     expect(observer.actual instanceof OoPropertyObserver).toBe(true);
//     setTimeout(() => {
//       expect(callback).toHaveBeenCalledWith('bar', undefined);
//       dispose();
//       executeSharedPropertyObserverTests(obj, observer, done, 0);
//     }, 0);
//   });
//
//   it('handles primitive properties created via direct assignment', (done) => {
//     var callback = callback = jasmine.createSpy('callback'),
//         dispose = observer.subscribe(callback);
//     obj.foo = 'bar';
//     setTimeout(() => {
//       expect(observer.actual instanceof OoPropertyObserver).toBe(true);
//       expect(callback).toHaveBeenCalledWith('bar', undefined);
//       dispose();
//       executeSharedPropertyObserverTests(obj, observer, done);
//     }, 0);
//   });
//
//   it('handles primitive properties created via Object.defineProperty', (done) => {
//     var callback = callback = jasmine.createSpy('callback'),
//         dispose = observer.subscribe(callback);
//     Object.defineProperty(obj, 'foo', { value: 'bar', writable: true });
//     setTimeout(() => {
//       expect(callback).toHaveBeenCalledWith('bar', undefined);
//       dispose();
//       executeSharedPropertyObserverTests(obj, observer, done);
//     }, 0);
//   });
//
//   it('handles complex properties created via Object.defineProperty', (done) => {
//     var callback = callback = jasmine.createSpy('callback'),
//         dispose = observer.subscribe(callback),
//         foo = 'bar';
//     Object.defineProperty(obj, 'foo', {
//       get: function() { return foo; },
//       set: function(newValue) { foo = newValue; },
//       enumerable: true,
//       configurable: true
//     });
//     setTimeout(() => {
//       expect(observer.actual instanceof DirtyCheckProperty).toBe(true);
//       expect(callback).toHaveBeenCalledWith('bar', undefined);
//       dispose();
//       executeSharedPropertyObserverTests(obj, observer, done);
//     }, 0);
//   });
//
//   it('handles complex properties created via Object.defineProperty and handled by an adapter', (done) => {
//     var callback = callback = jasmine.createSpy('callback'),
//         dispose = observer.subscribe(callback),
//         foo = 'bar';
//     obj.handleWithAdapter = true;
//
//     Object.defineProperty(obj, 'foo', {
//       get: function() { return foo; },
//       set: function(newValue) { foo = newValue; },
//       enumerable: true,
//       configurable: true
//     });
//     setTimeout(() => {
//       expect(observer.actual instanceof AdapterPropertyObserver).toBe(true);
//       expect(callback).toHaveBeenCalledWith('bar', undefined);
//       dispose();
//       executeSharedPropertyObserverTests(obj, observer, done);
//     }, 0);
//   });
// });
