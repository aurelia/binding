export class TakeValueConverter {
  toView(array, count) {
    return array.slice(0, count);
  }
}
