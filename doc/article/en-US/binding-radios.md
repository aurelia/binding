---
{
  "name": "Binding: Radios",
  "culture": "en-US",
  "description": "Data-binding radio inputs with Aurelia.",
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

A group of radio inputs is a type of "single select" interface. Aurelia supports two-way binding any type of property to a group of radio inputs. The examples below illustrate binding number, object, string and boolean properties to sets of radio inputs. In each of the examples there's a common set of steps:

1. Group the radios via the `name` property. Radio buttons that have the same value for the name attribute are in the same "radio button group"; only one radio button in a group can be selected at a time.
2. Define each radio's value using the `model` property.
3. Two-way bind each radio's `checked` attribute to a "selected item" property on the view-model.

## [Numbers](aurelia-doc://section/2/version/1.0.0)

Let's start with an example that uses a numeric "selected item" property. In this example each radio input will be assigned a number value via the model property. Selecting a radio will cause it's model value to be assigned to the `selectedProductId` property.

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
      <form>
        <h4>Products</h4>
        <label repeat.for="product of products">
          <input type="radio" name="group1"
                 model.bind="product.id" checked.bind="selectedProductId">
          ${product.id} - ${product.name}
        </label>
        <br />
        Selected product ID: ${selectedProductId}
      </form>
    </template>
  </source-code>
</code-listing>


<au-demo heading="Number demo">
  <source-code src="example/binding-radios/numbers/app.js"></source-code>
</au-demo>

## [Objects](aurelia-doc://section/3/version/1.0.0)

The binding system supports binding all types to radios, including objects. Here's an example that binds a group of radios to a `selectedProduct` object property.

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        products = [
          { id: 0, name: 'Motherboard' },
          { id: 1, name: 'CPU' },
          { id: 2, name: 'Memory' },
        ];

        selectedProduct = null;
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
      <form>
        <h4>Products</h4>
        <label repeat.for="product of products">
          <input type="radio" name="group2"
                 model.bind="product" checked.bind="selectedProduct">
          ${product.id} - ${product.name}
        </label>

        Selected product: ${selectedProduct.id} - ${selectedProduct.name}
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Object demo">
  <source-code src="example/binding-radios/objects/app.js"></source-code>
</au-demo>

## [Objects with Matcher](aurelia-doc://section/4/version/1.0.0)

You may run into situations where the object your input element's model is bound to does not have reference equality to any of the object in your checked attribute is bound to. The objects might match by id, but they may not be the same object instance. To support this scenario you can override Aurelia's default "matcher" which is a equality comparison function that looks like this: `(a, b) => a === b`. You can substitute a function of your choosing that has the right logic to compare your objects.

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.selectedProduct = { id: 1, name: 'CPU' };

        this.productMatcher = (a, b) => a.id === b.id;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      selectedProduct = { id: 1, name: 'CPU' };

      productMatcher = (a, b) => a.id === b.id;
    }
  </source-code>
  <source-code lang="TypeScript">
    export interface IProduct {
       id: number;
       name: string;
    }

    export class App {
      selectedProduct: IProduct = { id: 1, name: 'CPU' };

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
          <input type="radio" name="group3"
                 model.bind="{ id: 0, name: 'Motherboard' }"
                 matcher.bind="productMatcher"
                 checked.bind="selectedProduct">
          Motherboard
        </label>
        <label>
          <input type="radio" name="group3"
                 model.bind="{ id: 1, name: 'CPU' }"
                 matcher.bind="productMatcher"
                 checked.bind="selectedProduct">
          CPU
        </label>
        <label>
          <input type="radio" name="group3"
                 model.bind="{ id: 2, name: 'Memory' }"
                 matcher.bind="productMatcher"
                 checked.bind="selectedProduct">
          Memory
        </label>

        Selected product: ${selectedProduct.id} - ${selectedProduct.name}
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Object matcher demo">
  <source-code src="example/binding-radios/objects-matcher/app.js"></source-code>
</au-demo>

## [Booleans](aurelia-doc://section/5/version/1.0.0)

In this example each radio input is assigned one of three literal values: `null`, `true` and `false`. Selecting one of the radios will assign it's value to the `likesCake` property.

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.likesCake = null;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      likesCake = null;
    }
  </source-code>
  <source-code lang="TypeScript">
    export class App {
      likesCake = null;
    }
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <form>
        <h4>Do you like cake?</h4>
        <label>
          <input type="radio" name="group3"
                 model.bind="null" checked.bind="likesCake">
          Don't Know
        </label>
        <label>
          <input type="radio" name="group3"
                 model.bind="true" checked.bind="likesCake">
          Yes
        </label>
        <label>
          <input type="radio" name="group3"
                 model.bind="false" checked.bind="likesCake">
          No
        </label>

        likesCake = ${likesCake}
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Boolean demo">
  <source-code src="example/binding-radios/booleans/app.js"></source-code>
</au-demo>

## [Strings](aurelia-doc://section/6/version/1.0.0)

Finally, here's an example using strings. This is example is unique because it does not use `model.bind` to assign each radio's value. Instead the input's standard `value` attribute is used. Normally we cannot use the standard `value` attribute in conjunction with checked binding because it coerces anything it's assigned to a string.

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class App {
      constructor() {
        this.products = ['Motherboard', 'CPU', 'Memory'];
        this.selectedProduct = null;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class App {
      products = ['Motherboard', 'CPU', 'Memory'];
      selectedProduct = null;
    }
  </source-code>
  <source-code lang="TypeScript">
    export class App {
      products: string[] = ['Motherboard', 'CPU', 'Memory'];
      selectedProduct = null;
    }
  </source-code>
</code-listing>

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <form>
        <h4>Products</h4>
        <label repeat.for="product of products">
          <input type="radio" name="group4"
                 value.bind="product" checked.bind="selectedProduct">
          ${product}
        </label>
        <br />
        Selected product: ${selectedProduct}
      </form>
    </template>
  </source-code>
</code-listing>

<au-demo heading="String demo">
  <source-code src="example/binding-radios/strings/app.js"></source-code>
</au-demo>
