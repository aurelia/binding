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

    let methods = ['add', 'delete', 'clear'];
    if (methods.find(m => setProto[m] !== set[m])) {
      setProto = {};
      methods.forEach(m => setProto[m] = set[m]);
    }

    set['add'] = function () {
      let type = 'add';
      let oldSize = set.size;
      let methodCallResult = setProto['add'].apply(set, arguments);
      let hasValue = set.size === oldSize;
      if (!hasValue) {
        observer.addChangeRecord({
          type: type,
          object: set,
          value: Array.from(set).pop()
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
