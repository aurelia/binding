import 'core-js';
import {getChangeRecords} from './map-change-records';
import {ModifyCollectionObserver} from './collection-observation';

let setProto = Set.prototype;

export function getSetObserver(taskQueue, set){
  return ModifySetObserver.create(taskQueue, set);
}

class ModifySetObserver extends ModifyCollectionObserver {
  constructor(taskQueue, set){
    super(taskQueue, set);
  }

  static create(taskQueue, set) {
    let observer = new ModifySetObserver(taskQueue, set);

    set['add'] = function () {
      let type = 'add';
      let hasValue = set.has(arguments[0]);
      let methodCallResult = setProto['add'].apply(set, arguments);
      if (!hasValue) {
        observer.addChangeRecord({
          type: type,
          object: set,
          value: arguments[0]
        });
      }
      return methodCallResult;
    }

    set['delete'] = function () {
      let hasValue = set.has(arguments[0]);
      let methodCallResult = setProto['delete'].apply(set, arguments);
      if (hasValue) {
        observer.addChangeRecord({
          type: 'delete',
          object: set,
          value: arguments[0]
        });
      }
      return methodCallResult;
    }

    set['clear'] = function () {
      let methodCallResult = setProto['clear'].apply(set, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: set
      });
      return methodCallResult;
    }

    return observer;
  }
}
