const map = Object.create(null);

export function camelCase(name) {
  if (name in map) {
    return map[name];
  }
  const result = name.charAt(0).toLowerCase()
    + name.slice(1).replace(/[_.-](\w|$)/g, (_, x) => x.toUpperCase());
  map[name] = result;
  return result;
}
