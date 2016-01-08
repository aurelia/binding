export class SortValueConverter {
  toView(array, config) {
    let factor = (config.direction || 'ascending') === 'ascending' ? 1 : -1;
    return array.sort((a, b) => {
      return (a[config.propertyName] - b[config.propertyName]) * factor;
    });
  }
}
