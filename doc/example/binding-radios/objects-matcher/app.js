export class App {
  selectedProduct = { id: 1, name: 'CPU' };

  productMatcher = (a, b) => a.id === b.id;
}
