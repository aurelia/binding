---
{
  "name": "Binding: Computed Properties",
  "culture": "en-US",
  "description": "Data-binding computed properties with Aurelia.",
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

Sometimes it is desirable to return a dynamically computed value when accessing a property, or you may want to reflect the status of an internal variable without requiring the use of explicit method calls. In JavaScript, this can be accomplished with the use of a getter.

Here's an example `Person` class that exposes a `fullName` property that computes it's value using the `firstName` and `lastName` properties.

<code-listing heading="Computed Properties">
  <source-code lang="ES 2015">
    export class Person {
      firstName = 'John';
      lastName = 'Doe';

      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class Person {
      firstName = 'John';
      lastName = 'Doe';

      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    export class Person {
      firstName: string = 'John';
      lastName: string = 'Doe';

      get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
      }
    }
  </source-code>
</code-listing>

There isn't anything special you need to do to bind to a computed property like `fullName`. The binding system will examine the property's [descriptor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor), determine that the value of the property is computed by a function and choose the *dirty checking* observation strategy. *Dirty checking* means the binding system will periodically check the property's value for changes and update the view as-needed. This means your property's getter function will be executed many times, approximately once every 120 milliseconds. Most of the time this isn't an issue, however, if you're using a lot of computed properties or if your getter functions are sufficiently complex you may want to consider giving the binding system hints on what to observe so that it doesn't need to use dirty checking. This is where the `@computedFrom` decorator comes in:

<code-listing heading="Computed Properties">
  <source-code lang="ES 2015">
    import {declarePropertyDependencies} from 'aurelia-framework';

    export class Person {
      firstName = 'John';
      lastName = 'Doe';

      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    }

    declarePropertyDependencies(Person, 'fullName', ['firstName', 'lastName']);
  </source-code>
  <source-code lang="ES 2016">
    import {computedFrom} from 'aurelia-framework';

    export class Person {
      firstName = 'John';
      lastName = 'Doe';

      @computedFrom('firstName', 'lastName')
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {computedFrom} from 'aurelia-framework';

    export class Person {
      firstName: string = 'John';
      lastName: string = 'Doe';

      @computedFrom('firstName', 'lastName')
      get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
      }
    }
  </source-code>
</code-listing>

`@computedFrom` tells the binding system which expressions to observe. When those expressions change, the binding system will re-evaluate the property (execute the getter). This eliminates the need for dirty checking and can improve performance. The `@computedFrom` parameters can be simple property names as shown above or more complex expressions like `@computedFrom('event.startDate', 'event.endDate')`.
