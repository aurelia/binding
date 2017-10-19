import * as LogManager from 'aurelia-logging';

export const coerceFunctions = {
  none(a) {
    return a;
  },
  number(a) {
    const val = Number(a);
    return !isNaN(val) && isFinite(val) ? val : 0;
  },
  string(a) {
    return '' + a;
  },
  boolean(a) {
    return !!a;
  },
  date(val) {
    // Invalid date instances are quite problematic
    // so we need to deal with it properly by default
    if (val === null || val === undefined) {
      return null;
    }
    const d = new Date(val);
    const t = d.getTime(); // to deal with invalid date
    return t === t ? d : null;
  }
};

export const coerceFunctionMap: Map<{new(): any}, string> = new Map([
  [Number, 'number'],
  [String, 'string'],
  [Boolean, 'boolean'],
  [Date, 'date']
]);

/**
 * Map a class to a string for typescript property coerce
 * @param type the property class to register
 * @param strType the string that represents class in the lookup
 * @param coerceFunction coerce function to register with param strType
 */
export function mapCoerceFunction(type: {new(): any, coerce?: (val: any) => any}, strType: string, coerceFunction: (val: any) => any) {
  coerceFunction = coerceFunction || type.coerce;
  if (typeof strType !== 'string' || typeof coerceFunction !== 'function') {
    LogManager
      .getLogger('map-coerce-function')
      .warn(`Bad attempt at mapping coerce function for type: ${type.name} to: ${strType}`);
    return;
  }
  coerceFunctions[strType] = coerceFunction;
  coerceFunctionMap.set(type, strType);
}