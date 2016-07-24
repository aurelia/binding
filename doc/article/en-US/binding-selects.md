---
{
  "name": "Binding: Selects",
  "culture": "en-US",
  "description": "Data-binding select elements with Aurelia.",
  "engines" : { "aurelia-doc" : "^1.0.0" },
  "author": {
    "name": "Jeremy Danyow",
  	"url": "http://danyow.net"
  },
  "contributors": [],
  "translators": [],
  "keywords": ["JavaScript", "Data Binding"]
}
---

## [Introduction](aurelia-doc://section/1/version/1.0.0)

A `<select>` element can serve as a single-select or multiple-select "picker" depending on whether the `multiple` attribute is present. The binding system supports both use cases. The samples below demonstrate a variety scenarios, all use a common series of steps to configure the select element:

1. Add a `<select>` element to the template and decide whether the `multiple` attribute should be applied.
2. Bind the select element's `value` attribute to a property. In "multiple" mode, the property should be an array. In singular mode it can be any type.
3. Define the select element's `<option>` elements. You can use the `repeat` or add each option element manually.
4. Specify each option's value via the `model` property:
  `<option model.bind="product.id">${product.name}</option>`
   *You can use the standard `value` attribute instead of `model`, just remember- it will coerce anything it's assigned to a string.*

## [Select Number](aurelia-doc://section/2/version/1.0.0)

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.products = [
          { id: 0, name: 'Motherboard' },
          { id: 1, name: 'CPU' },
          { id: 2, name: 'Memory' },
        ];

        this.selectedProductId = null;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      products = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      selectedProductId = null;
    }
  </source-code>
  <source-code lang="TypeScript">
    export interface IProduct {
       id: number;
       name: string;
    }

    export class App {
      products: IProduct[] = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      selectedProductId: number = null;
    }
  </source-code>
</code-listing>
<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <label>
        Select product:<br/>
        <select value.bind="selectedProductId">
          <option model.bind="null">Choose...</option>
          <option repeat.for="product of products"
                  model.bind="product.id">
            ${product.id} - ${product.name}
          </option>
        </select>
      </label>
      Selected product ID: ${selectedProductId}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Select number demo">
  <source-code src="example/binding-selects/single/numbers/app.js"></source-code>
</au-demo>

## [Select Object](aurelia-doc://section/3/version/1.0.0)

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.products = [
          { id: 0, name: 'Motherboard' },
          { id: 1, name: 'CPU' },
          { id: 2, name: 'Memory' },
        ];

        this.selectedProduct = null;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      products = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      selectedProduct = null;
    }
  </source-code>
  <source-code lang="TypeScript">
    export interface IProduct {
       id: number;
       name: string;
    }

    export class App {
      products: IProduct[] = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      selectedProduct: IProduct = null;
    }
  </source-code>
</code-listing>
<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <label>
        Select product:<br/>
        <select value.bind="selectedProduct">
          <option model.bind="null">Choose...</option>
          <option repeat.for="product of products"
                  model.bind="product">
            ${product.id} - ${product.name}
          </option>
        </select>
      </label>

      Selected product: ${selectedProduct.id} - ${selectedProduct.name}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Select object demo">
  <source-code src="example/binding-selects/single/objects/app.js"></source-code>
</au-demo>

## [Select Object with Matcher](aurelia-doc://section/4/version/1.0.0)

You may run into situations where the object your select element's value is bound does not have reference equality with any of the objects your option element model properties are bound to. The select's value object might "match" one of the option objects by id, but they may not be the same object instance. To support this scenario you can override Aurelia's default "matcher" which is a equality comparison function that looks like this: `(a, b) => a === b`. You can substitute a function of your choosing that has the right logic to compare your objects.

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.products = [
          { id: 0, name: 'Motherboard' },
          { id: 1, name: 'CPU' },
          { id: 2, name: 'Memory' },
        ];

        this.productMatcher = (a, b) => a.id === b.id;

        this.selectedProduct = { id: 1, name: 'CPU' };
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      products = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      productMatcher = (a, b) => a.id === b.id;

      selectedProduct = { id: 1, name: 'CPU' };
    }
  </source-code>
  <source-code lang="TypeScript">
    export interface IProduct {
       id: number;
       name: string;
    }

    export class App {
      products: IProduct[] = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      productMatcher = (a, b) => a.id === b.id;

      selectedProduct: IProduct = { id: 1, name: 'CPU' };
    }
  </source-code>
</code-listing>
<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <label>
        Select product:<br/>
        <select value.bind="selectedProduct" matcher.bind="productMatcher">
          <option model.bind="null">Choose...</option>
          <option repeat.for="product of products"
                  model.bind="product">
            ${product.id} - ${product.name}
          </option>
        </select>
      </label>

      Selected product: ${selectedProduct.id} - ${selectedProduct.name}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Select object matcher demo">
  <source-code src="example/binding-selects/single/objects-matcher/app.js"></source-code>
</au-demo>


## [Select Boolean](aurelia-doc://section/5/version/1.0.0)

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        likesTacos = null;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      likesTacos = null;
    }
  </source-code>
  <source-code lang="TypeScript">
    export class App {
      likesTacos = null;
    }
  </source-code>
</code-listing>
<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <label>
        Do you like tacos?:
        <select value.bind="likesTacos">
          <option model.bind="null">Choose...</option>
          <option model.bind="true">Yes</option>
          <option model.bind="false">No</option>
        </select>
      </label>
      likesTacos: ${likesTacos}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Select boolean demo">
  <source-code src="example/binding-selects/single/booleans/app.js"></source-code>
</au-demo>

## [Select String](aurelia-doc://section/6/version/1.0.0)

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.products = ['Motherboard', 'CPU', 'Memory'];
        this.selectedProduct = '';
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      products = ['Motherboard', 'CPU', 'Memory'];
      selectedProduct = '';
    }
  </source-code>
  <source-code lang="TypeScript">
    export class App {
      products: string[] = ['Motherboard', 'CPU', 'Memory'];
      selectedProduct: string = '';
    }
  </source-code>
</code-listing>
<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <label>
        Select product:<br/>
        <select value.bind="selectedProduct">
          <option value="">Choose...</option>
          <option repeat.for="product of products"
                  value.bind="product">
            ${product}
          </option>
        </select>
      </label>
      Selected product: ${selectedProduct}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Select string demo">
  <source-code src="example/binding-selects/single/strings/app.js"></source-code>
</au-demo>

## [Multiple Select Numbers](aurelia-doc://section/7/version/1.0.0)

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.products = [
          { id: 0, name: 'Motherboard' },
          { id: 1, name: 'CPU' },
          { id: 2, name: 'Memory' },
        ];

        this.selectedProductIds = [];
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      products = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      selectedProductIds = [];
    }
  </source-code>
  <source-code lang="TypeScript">
    export interface IProduct {
       id: number;
       name: string;
    }

    export class App {
      products: IProduct[] = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      selectedProductIds: number[] = [];
    }
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <label>
        Select products:
        <select multiple value.bind="selectedProductIds">
          <option repeat.for="product of products"
                  model.bind="product.id">
            ${product.id} - ${product.name}
          </option>
        </select>
      </label>
      Selected product IDs: ${selectedProductIds}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Select multiple numbers demo">
  <source-code src="example/binding-selects/multiple/numbers/app.js"></source-code>
</au-demo>

## [Multiple Select Objects](aurelia-doc://section/8/version/1.0.0)

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        products = [
          { id: 0, name: 'Motherboard' },
          { id: 1, name: 'CPU' },
          { id: 2, name: 'Memory' },
        ];

        selectedProducts = [];
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      products = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      selectedProducts = [];
    }
  </source-code>
  <source-code lang="TypeScript">
    export interface IProduct {
       id: number;
       name: string;
    }

    export class App {
      products: IProduct[] = [
        { id: 0, name: 'Motherboard' },
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' },
      ];

      selectedProducts: IProduct[] = [];
    }
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <label>
        Select products:
        <select multiple value.bind="selectedProducts">
          <option repeat.for="product of products"
                  model.bind="product">
            ${product.id} - ${product.name}
          </option>
        </select>
      </label>

      Selected products:
      <ul>
        <li repeat.for="product of selectedProducts">${product.id} - ${product.name}</li>
      </ul>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Select multiple objects demo">
  <source-code src="example/binding-selects/multiple/objects/app.js"></source-code>
</au-demo>

## [Multiple Select Strings](aurelia-doc://section/9/version/1.0.0)

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.products = ['Motherboard', 'CPU', 'Memory'];
        this.selectedProducts = [];
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      products = ['Motherboard', 'CPU', 'Memory'];
      selectedProducts = [];
    }
  </source-code>
  <source-code lang="TypeScript">
    export class App {
      products: string[] = ['Motherboard', 'CPU', 'Memory'];
      selectedProducts: string[] = [];
    }
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <label>
        Select products:
        <select multiple value.bind="selectedProducts">
          <option repeat.for="product of products"
                  value.bind="product">
            ${product}
          </option>
        </select>
      </label>
      Selected products: ${selectedProducts}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Select multiple strings demo">
  <source-code src="example/binding-selects/multiple/strings/app.js"></source-code>
</au-demo>
