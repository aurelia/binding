---
{
  "name": "Binding: Checkboxes",
  "culture": "en-US",
  "description": "Data-binding checkbox inputs with Aurelia.",
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

Aurelia supports two-way binding a variety of data-types to checkbox input elements.

## [Booleans](aurelia-doc://section/2/version/1.0.0)

Bind a boolean property to an input element's `checked` attribute using `checked.bind="myBooleanProperty"`.

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.motherboard = false;
        this.cpu = false;
        this.memory = false;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      motherboard = false;
      cpu = false;
      memory = false;
    }
  </source-code>
  <source-code lang="TypeScript">
    export class App {
      motherboard = false;
      cpu = false;
      memory = false;
    }
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <form>
        <h4>Products</h4>
        <label><input type="checkbox" checked.bind="motherboard">  Motherboard</label>
        <label><input type="checkbox" checked.bind="cpu"> CPU</label>
        <label><input type="checkbox" checked.bind="memory"> Memory</label>

        motherboard = ${motherboard}<br/>
        cpu = ${cpu}<br/>
        memory = ${memory}<br/>
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Boolean checkboxes demo">
  <source-code src="example/binding-checkboxes/booleans/app.js"></source-code>
</au-demo>

## [Array of Numbers](aurelia-doc://section/3/version/1.0.0)

A set of checkbox elements is a multiple selection interface. If you have an array that serves as the "selected items" list, you can bind the array to each input's `checked` attribute. The binding system will track the input's checked status, adding the input's value to the array when the input is checked and removing the input's value from the array when the input is unchecked.

To define the input's "value", bind the input's `model` attribute: `model.bind="product.id"`.

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
      <form>
        <h4>Products</h4>
        <label repeat.for="product of products">
          <input type="checkbox" model.bind="product.id" checked.bind="selectedProductIds">
          ${product.id} - ${product.name}
        </label>
        <br />
        Selected product IDs: ${selectedProductIds}
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Number array demo">
  <source-code src="example/binding-checkboxes/numbers/app.js"></source-code>
</au-demo>

## [Array of Objects](aurelia-doc://section/4/version/1.0.0)

Numbers aren't the only type of value you can store in a "selected items" array. The binding system supports all types, including objects.  Here's an example that adds and removes "product" objects from a `selectedProducts` array using the checkbox data-binding.

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.products = [
          { id: 0, name: 'Motherboard' },
          { id: 1, name: 'CPU' },
          { id: 2, name: 'Memory' },
        ];

        this.selectedProducts = [];
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
      <form>
        <h4>Products</h4>
        <label repeat.for="product of products">
          <input type="checkbox" model.bind="product" checked.bind="selectedProducts">
          ${product.id} - ${product.name}
        </label>

        Selected products:
        <ul>
          <li repeat.for="product of selectedProducts">${product.id} - ${product.name}</li>
        </ul>
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Object array demo">
  <source-code src="example/binding-checkboxes/objects/app.js"></source-code>
</au-demo>

## [Array of Objects with Matcher](aurelia-doc://section/5/version/1.0.0)

You may run into situations where the object your input element's model is bound to does not have reference equality to any of the objects in your checked array. The objects might match by id, but they may not be the same object instance. To support this scenario you can override Aurelia's default "matcher" which is a equality comparison function that looks like this: `(a, b) => a === b`. You can substitute a function of your choosing that has the right logic to compare your objects.

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.selectedProducts = [
          { id: 1, name: 'CPU' },
          { id: 2, name: 'Memory' }
        ];

        this.productMatcher = (a, b) => a.id === b.id;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      selectedProducts = [
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' }
      ];

      productMatcher = (a, b) => a.id === b.id;
    }
  </source-code>
  <source-code lang="TypeScript">
    export interface IProduct {
       id: number;
       name: string;
    }

    export class App {
      selectedProducts: IProduct[] = [
        { id: 1, name: 'CPU' },
        { id: 2, name: 'Memory' }
      ];

      productMatcher = (a, b) => a.id === b.id;
    }
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <form>
        <h4>Products</h4>
        <label>
          <input type="checkbox" model.bind="{ id: 0, name: 'Motherboard' }"
                 matcher.bind="productMatcher"
                 checked.bind="selectedProducts">
          Motherboard
        </label>
        <label>
          <input type="checkbox" model.bind="{ id: 1, name: 'CPU' }"
                 matcher.bind="productMatcher"
                 checked.bind="selectedProducts">
          CPU
        </label>
        <label>
          <input type="checkbox" model.bind="{ id: 2, name: 'Memory' }"
                 matcher.bind="productMatcher"
                 checked.bind="selectedProducts">
          Memory
        </label>

        Selected products:
        <ul>
          <li repeat.for="product of selectedProducts">${product.id} - ${product.name}</li>
        </ul>
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Object array matcher demo">
  <source-code src="example/binding-checkboxes/objects-matcher/app.js"></source-code>
</au-demo>

## [Array of Strings](aurelia-doc://section/6/version/1.0.0)

Finally, here's an example that adds and removes strings from a `selectedProducts` array using the checkbox data-binding. This is example is unique because it does not use `model.bind` to assign each checkbox's value. Instead the input's standard `value` attribute is used. Normally we cannot use the standard `value` attribute in conjunction with checked binding because it coerces anything it's assigned to a string. This example uses an array of strings so everything works just fine.

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
      <form>
        <h4>Products</h4>
        <label repeat.for="product of products">
          <input type="checkbox" value.bind="product" checked.bind="selectedProducts">
          ${product}
        </label>
        <br />
        Selected products: ${selectedProducts}
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="String array demo">
  <source-code src="example/binding-checkboxes/strings/app.js"></source-code>
</au-demo>
