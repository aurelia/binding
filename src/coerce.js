import * as LogManager from 'aurelia-logging';

const numCons = Number;
const dateCons = Date;
const _isFinite = isFinite;
const _isNaN = isNaN;

export const coerces = {
  none(a) {
    return a;
  },
  number(a) {
    var val = numCons(a);
    return !_isNaN(val) && _isFinite(val) ? val : 0;
  },
  string(a) {
    return '' + a;
  },
  boolean(a) {
    return !!a;
  },
  date(a) {
    return new dateCons(a);
  }
};

/**@type {Map<Function, string>} */
export const classCoerceMap = new Map([
  [Number, 'number'],
  [String, 'string'],
  [Boolean, 'boolean'],
  [Date, 'date']
]);

/**
 * Map a class to a string for typescript property coerce
 * @param Class {Function} the property class to register
 * @param strType {string} the string that represents class in the lookup
 * @param converter {function(val)} coerce function tobe registered with @param strType
 */
export function mapCoerceForClass(Class, strType, coerce) {
  coerce = coerce || Class.coerce;

  if (typeof strType !== 'string' || typeof coerce !== 'function') {
    LogManager
      .getLogger('behavior-property-observer')
      .warn(`Bad attempt at mapping coerce for class: ${Class.name} to type: ${strType}`);
    return;
  }

  coerces[strType] = coerce;
  coerceClassMap.set(Class, strType);
}
