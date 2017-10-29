export class FlightTimeValueConverter {
  signals = ['locale-changed'];

  toView(val) {
    let newVal = val instanceof Date ? val.toLocaleString(window.currentLocale) : val === null ? '' : val; // eslint-disable-line
    return newVal;
  }
}
