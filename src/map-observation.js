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

    let methods = ['set', 'delete', 'clear'];
    if (methods.find(m => mapProto[m] !== map[m])) {
      mapProto = {};
      methods.forEach(m => mapProto[m] = map[m]);
    }

    map['set'] = function () {
      let hasValue = map.has(arguments[0]);
      let type = hasValue ? 'update' : 'add';
      let oldValue = map.get(arguments[0]);
      let methodCallResult = mapProto['set'].apply(map, arguments);
      if (!hasValue || oldValue !== map.get(arguments[0])) {
        observer.addChangeRecord({
          type: type,
          object: map,
          key: arguments[0],
          oldValue: oldValue
        });
      }
      return methodCallResult;
    }

    map['delete'] = function () {
      let hasValue = map.has(arguments[0]);
      let oldValue = map.get(arguments[0]);
      let methodCallResult = mapProto['delete'].apply(map, arguments);
      if (hasValue) {
        observer.addChangeRecord({
          type: 'delete',
          object: map,
          key: arguments[0],
          oldValue: oldValue
        });
      }
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
