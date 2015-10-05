import 'core-js';
import {getChangeRecords} from './map-change-records';
import {ModifyCollectionObserver} from './collection-observation';

let mapProto = Map.prototype;

export function getMapObserver(taskQueue, map){
  return ModifyMapObserver.create(taskQueue, map);
}

class ModifyMapObserver extends ModifyCollectionObserver {
  constructor(taskQueue, map){
    super(taskQueue, map);
  }

  static create(taskQueue, map) {
    let observer = new ModifyMapObserver(taskQueue, map);

    map['set'] = function () {
      let oldValue = map.get(arguments[0]);
      let type = typeof oldValue !== 'undefined' ? 'update' : 'add';
      let methodCallResult = mapProto['set'].apply(map, arguments);
      observer.addChangeRecord({
        type: type,
        object: map,
        key: arguments[0],
        oldValue: oldValue
      });
      return methodCallResult;
    }

    map['delete'] = function () {
      let oldValue = map.get(arguments[0]);
      let methodCallResult = mapProto['delete'].apply(map, arguments);
      observer.addChangeRecord({
        type: 'delete',
        object: map,
        key: arguments[0],
        oldValue: oldValue
      });
      return methodCallResult;
    }

    map['clear'] = function () {
      let methodCallResult = mapProto['clear'].apply(map, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: map
      });
      return methodCallResult;
    }

    return observer;
  }
}
