function newRecord(type, object, key, oldValue){
  return {
    type: type,
    object: object,
    key: key,
    oldValue: oldValue
  };
}

export function getChangeRecords(map){
  let entries = [];
  for (let key of map.keys()) {
    entries.push(newRecord('added', map, key));
  }
  return entries;
}
