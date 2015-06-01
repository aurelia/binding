import {hasArrayObserve} from './environment';
import {projectArraySplices} from './array-change-records';
import {ModifyCollectionObserver, CollectionLengthObserver} from './collection-observation';

var arrayProto = Array.prototype;

export function getArrayObserver(taskQueue, array){
  if(hasArrayObserve){
    return new ArrayObserveObserver(array);
  }else{
    return ModifyArrayObserver.create(taskQueue, array);
  }
}

class ModifyArrayObserver extends ModifyCollectionObserver {
  constructor(taskQueue, array){
    super(taskQueue, array);
  }

  static create(taskQueue, array){
    var observer = new ModifyArrayObserver(taskQueue, array);

    array['pop'] = function(){
      var methodCallResult = arrayProto['pop'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'delete',
       object: array,
       name: array.length,
       oldValue: methodCallResult
      });
      return methodCallResult;
    }

    array['push'] = function(){
      var methodCallResult = arrayProto['push'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'splice',
       object: array,
       index: array.length - arguments.length,
       removed: [],
       addedCount: arguments.length
      });
      return methodCallResult;
    }

    array['reverse'] = function(){
      var oldArray = array.slice();
      var methodCallResult = arrayProto['reverse'].apply(array, arguments);
      observer.reset(oldArray);
      return methodCallResult;
    }

    array['shift'] = function() {
      var methodCallResult = arrayProto['shift'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'delete',
       object: array,
       name: 0,
       oldValue: methodCallResult
      });
      return methodCallResult
    };

    array['sort'] = function() {
      var oldArray = array.slice();
      var methodCallResult = arrayProto['sort'].apply(array, arguments);
      observer.reset(oldArray);
      return methodCallResult;
    };

    array['splice'] = function() {
      var methodCallResult = arrayProto['splice'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'splice',
       object: array,
       index: arguments[0],
       removed: methodCallResult,
       addedCount: arguments.length > 2 ? arguments.length - 2 : 0
      });
      return methodCallResult;
    };

    array['unshift'] = function() {
      var methodCallResult = arrayProto['unshift'].apply(array, arguments);
      observer.addChangeRecord({
       type: 'splice',
       object: array,
       index: 0,
       removed: [],
       addedCount: arguments.length
      });
      return methodCallResult;
    };

    return observer;
  }
}

class ArrayObserveObserver {
  constructor(array){
    this.array = array;
    this.callbacks = [];
  }

  subscribe(callback){
    var callbacks = this.callbacks;

    if(callbacks.length === 0){
      this.handler = this.handleChanges.bind(this);
      Array.observe(this.array, this.handler);
    }

    callbacks.push(callback);

    return () => {
      callbacks.splice(callbacks.indexOf(callback), 1);
      if (callbacks.length === 0) {
        Array.unobserve(this.array, this.handler)
      }
    };
  }

  getLengthObserver(){
    return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.array));
  }

  handleChanges(changeRecords){
    var callbacks = this.callbacks,
        i = callbacks.length,
        splices;

    if(i){
      splices = projectArraySplices(this.array, changeRecords);

      while(i--) {
        callbacks[i](splices);
      }
    }

    if(this.lengthObserver){
      this.lengthObserver.call(this.array.length);
    }
  }
}
