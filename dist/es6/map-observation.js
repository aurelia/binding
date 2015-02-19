import {getEntries, getChangeRecords} from './map-change-records';

var mapProto = Map.prototype;

export function getMapObserver(taskQueue, map){
  return ModifyMapObserver.create(taskQueue, map);
}

class ModifyMapObserver {
  constructor(taskQueue, map){
    this.taskQueue = taskQueue;
    this.callbacks = [];
    this.changeRecords = [];
    this.queued = false;
    this.map = map;
    this.oldMap = null;
  }

  subscribe(callback){
    var callbacks = this.callbacks;
    callbacks.push(callback);
    return function(){
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
  }

  addChangeRecord(changeRecord){
    if(this.callbacks.length === 0){
      return;
    }

    this.changeRecords.push(changeRecord);

    if(!this.queued){
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  reset(){
    if(!this.callbacks.length){
      return;
    }

    this.oldMap = this.map;

    if(!this.queued){
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  getObserver(propertyName){
    if(propertyName == 'size'){
      return this.lengthObserver || (this.lengthObserver = new MapLengthObserver(this.map));
    }else{
      throw new Error(`You cannot observe the ${propertyName} property of a map.`);
    }
  }

  call(){
    var callbacks = this.callbacks,
      i = callbacks.length,
      changeRecords = this.changeRecords,
      oldMap = this.oldMap,
      records;

    this.queued = false;
    this.changeRecords = [];

    if (i) {
      if (oldMap) {
        records = getChangeRecords(oldMap);
      }else{
        records = changeRecords;
      }

      while (i--) {
        callbacks[i](records);
      }
    }

    if(this.lengthObserver){
      this.lengthObserver(this.map.size);
    }
  }

  static create(taskQueue, map) {
    var observer = new ModifyMapObserver(taskQueue, map);

    map['set'] = function () {
      var oldValue = map.get(arguments[0]);
      var type = oldValue ? 'update' : 'add';
      var methodCallResult = mapProto['set'].apply(map, arguments);
      observer.addChangeRecord({
        type: type,
        object: map,
        key: arguments[0],
        oldValue: oldValue
      });
      return methodCallResult;
    }

    map['delete'] = function () {
      var oldValue = map.get(arguments[0]);
      var methodCallResult = mapProto['delete'].apply(map, arguments);
      observer.addChangeRecord({
        type: 'delete',
        object: map,
        key: arguments[0],
        oldValue: oldValue
      });
      return methodCallResult;
    }

    map['clear'] = function () {
      var methodCallResult = mapProto['clear'].apply(map, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: map
      });
      return methodCallResult;
    }

    return observer;
  }
}

class MapLengthObserver {
  constructor(map){
    this.map = map;
    this.callbacks = [];
    this.currentValue = map.size;
  }

  getValue(){
    return this.map.size;
  }

  setValue(newValue){
    this.map.size = newValue;
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
