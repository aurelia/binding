---
{
  "name": "Binding: Observable Properties",
  "culture": "en-US",
  "description": "Data-binding observable properties with Aurelia.",
  "engines" : { "aurelia-doc" : "^1.0.0" },
  "author": {
    "name": "Fabio Luz"
  },
  "contributors": [],
  "translators": [],
  "keywords": ["JavaScript", "Data Binding", "Observable"]
}
---

## [Introduction](aurelia-doc://section/1/version/1.0.0)

Have you ever needed to perform an action when a property is changed? If you have, that's a great use of property observation.

To observe a property, you need to decorate it with the `@observable` decorator and define a method as the change handler. This method can receive 2 parameters: the new value and the old value. You can put any business logic inside this method.

By convention, the change handler is a method whose name is composed of the _property_name_ and the literal value 'Changed'. For example, if you decorate the property `color` with `@observable`, you have to define a method named `colorChanged()` to be the change handler. Here's an example of that:

<code-listing heading="Observable Properties">
  <source-code lang="ES 2015">
    import { observable, decorators } from 'aurelia-framework';

    export const App = decorators(
      observable('color')
    ).on(class {
      color = 'blue';

      colorChanged(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }
    })
  </source-code>
  <source-code lang="ES 2016">
    import { observable } from 'aurelia-framework';

    export class Car {
      @observable color = 'blue';

      colorChanged(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import { observable } from 'aurelia-framework';

    export class Car {
      @observable color = 'blue';

      colorChanged(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }
    }
  </source-code>
</code-listing>

> Info
> You do not have to check if `newValue` and `oldValue` are different. The change handler will not be called if you assign a value that the property already has.

If you do not want to use the convention, you can define the callback name for the change handler by setting the `changeHandler` property of the `@observable` decorator:

<code-listing heading="Observable Properties">
  <source-code lang="ES 2015">
    import { observable, decorators } from 'aurelia-framework';

    export const Car = decorators(
      observable({ name: 'color', changeHandler: 'myChangeHandler' })
    ).on(class {
      color = 'blue';

      myChangeHandler(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }
    })
  </source-code>
  <source-code lang="ES 2016">
    import { observable } from 'aurelia-framework';

    export class Car {
      @observable({ changeHandler: 'myChangeHandler' })
      color = 'blue';

      myChangeHandler(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import { observable } from 'aurelia-framework';

    export class Car {
      @observable({ changeHandler: 'myChangeHandler' })
      color = 'blue';

      myChangeHandler(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }
    }
  </source-code>
</code-listing>

If you prefer, can also put the `@observable` on classes:

<code-listing heading="Observable Properties">
  <source-code lang="ES 2015">
    import { observable, decorators } from 'aurelia-framework';

    export const App = decorators(
      observable('color'),
      observable({ name: 'speed', changeHandler: 'speedChangeHandler' })
    ).on(class {
      color = 'blue';
      speed = 300;

      colorChanged(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }

      speedChangeHandler(newValue, oldValue) {
        // this will fire whenever the 'speed' property changes
      }
    })
  </source-code>
  <source-code lang="ES 2016">
    import { observable } from 'aurelia-framework';

    @observable('color')
    @observable({ name: 'speed', changeHandler: 'speedChangeHandler' })
    export class Car {
      color = 'blue';
      speed = 300;

      colorChanged(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }

      speedChangeHandler(newValue, oldValue) {
        // this will fire whenever the 'speed' property changes
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import { observable } from 'aurelia-framework';

    @observable('color')
    @observable({ name: 'speed', changeHandler: 'speedChangeHandler' })
    export class Car {

      color = 'blue';
      speed = 300;

      colorChanged(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }

      speedChangeHandler(newValue, oldValue) {
        // this will fire whenever the 'speed' property changes
      }
    }
  </source-code>
</code-listing>  

> Info
> The `@observable` _only_ tracks changes to the value of a property, _not_ changes _in_ the value itself. This means that if the property is an array, the change handler will not fire when adding, removing or editing items.
