import {ModifyCollectionObserver} from './collection-observation';

let mapProto = Map.prototype;

export function getMapObserver(taskQueue, map) {
  return ModifyMapObserver.for(taskQueue, map);
}

class ModifyMapObserver extends ModifyCollectionObserver {
  constructor(taskQueue, map) {
    super(taskQueue, map);
  }

  /**
   * Searches for observer or creates a new one associated with given map instance
   * @param taskQueue
   * @param map instance for which observer is searched
   * @returns ModifyMapObserver always the same instance for any given map instance
   */
  static for(taskQueue, map) {
    if (!('__map_observer__' in map)) {
      Reflect.defineProperty(map, '__map_observer__', {
        value: ModifyMapObserver.create(taskQueue, map),
        enumerable: false, configurable: false
      });
    }
    return map.__map_observer__;
  }

  static create(taskQueue, map) {
    let observer = new ModifyMapObserver(taskQueue, map);

    let proto = mapProto;
    if (proto.set !== map.set || proto.delete !== map.delete || proto.clear !== map.clear) {
      proto = {
        set: map.set,
        delete: map.delete,
        clear: map.clear
      };
    }

    map.set = function() {
      let hasValue = map.has(arguments[0]);
      let type = hasValue ? 'update' : 'add';
      let oldValue = map.get(arguments[0]);
      let methodCallResult = proto.set.apply(map, arguments);
      if (!hasValue || oldValue !== map.get(arguments[0])) {
        observer.addChangeRecord({
          type: type,
          object: map,
          key: arguments[0],
          oldValue: oldValue
        });
      }
      return methodCallResult;
    };

    map.delete = function() {
      let hasValue = map.has(arguments[0]);
      let oldValue = map.get(arguments[0]);
      let methodCallResult = proto.delete.apply(map, arguments);
      if (hasValue) {
        observer.addChangeRecord({
          type: 'delete',
          object: map,
          key: arguments[0],
          oldValue: oldValue
        });
      }
      return methodCallResult;
    };

    map.clear = function() {
      let methodCallResult = proto.clear.apply(map, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: map
      });
      return methodCallResult;
    };

    return observer;
  }
}
