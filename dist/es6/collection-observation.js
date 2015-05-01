import {calcSplices, projectArraySplices} from './array-change-records';
import {getChangeRecords} from './map-change-records';

export class ModifyCollectionObserver {

  constructor(taskQueue, collection){
    this.taskQueue = taskQueue;
    this.queued = false;
    this.callbacks = [];
    this.changeRecords = [];
    this.oldCollection = null;
    this.collection = collection;
    this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);
    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  addChangeRecord(changeRecord){
    if(this.callbacks.length === 0 && !this.lengthObserver){
      return;
    }

    this.changeRecords.push(changeRecord);

    if(!this.queued){
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  reset(oldCollection){
    if(!this.callbacks.length){
      return;
    }

    this.oldCollection = oldCollection;

    if(!this.queued){
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  getLengthObserver(){
    return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection));
  }

  call(){
    var callbacks = this.callbacks,
      i = callbacks.length,
      changeRecords = this.changeRecords,
      oldCollection = this.oldCollection,
      records;

    this.queued = false;
    this.changeRecords = [];
    this.oldCollection = null;

    if(i){
      if(oldCollection){
        // TODO (martingust) we might want to refactor this to a common, independent of collection type, way of getting the records
        if(this.collection instanceof Map){
          records = getChangeRecords(oldCollection);
        }else {
          //we might need to combine this with existing change records....
          records = calcSplices(this.collection, 0, this.collection.length, oldCollection, 0, oldCollection.length);
        }
      }else{
        if(this.collection instanceof Map){
          records = changeRecords;
        }else {
          records = projectArraySplices(this.collection, changeRecords);
        }
      }

      while(i--) {
        callbacks[i](records);
      }
    }

    if(this.lengthObserver){
      this.lengthObserver.call(this.collection[this.lengthPropertyName]);
    }
  }
}

export class CollectionLengthObserver {
  constructor(collection){
    this.collection = collection;
    this.callbacks = [];
    this.lengthPropertyName = collection instanceof Map ? 'size' : 'length';
    this.currentValue = collection[this.lengthPropertyName];
  }

  getValue(){
    return this.collection[this.lengthPropertyName];
  }

  setValue(newValue){
    this.collection[this.lengthPropertyName] = newValue;
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);
    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  call(newValue){
    var callbacks = this.callbacks,
      i = callbacks.length,
      oldValue = this.currentValue;

    while(i--) {
      callbacks[i](newValue, oldValue);
    }

    this.currentValue = newValue;
  }
}
