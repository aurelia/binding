---
name: "Binding: Observables"
description: Using observables with Aurelia.
authors: Fabio Luz, Jonathan Eckman
---

## Observable Properties

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


## Observing Collections

To observe changes to a collection, such as an array or Map, use the Collection Observer. The subscription is created by simply providing the collection to observe and a callback function.

<code-listing heading="Configuring a Collection Observer">
  <source-code lang="ES 2015">
  </source-code>
  <source-code lang="ES 2016">
  </source-code>
  <source-code lang="TypeScript">
    import {BindingEngine, autoinject, ICollectionObserverSplice} from 'aurelia-framework';

    @autoinject
    export class App {

      myCollection: Array<string> = ["foo"];

      constructor(private bindingEngine: BindingEngine) {
        let subscription = this.bindingEngine.collectionObserver(this.myCollection)
          .subscribe(this.collectionChanged.bind(this));
      }

      collectionChanged(splices: Array<ICollectionObserverSplice<string>>) {
          // This will fire any time the collection is modified. 
      }
    }
  </source-code>
</code-listing>  

The Collection Observer provides an array of ICollectionObserverSplice to the callback function which you may use to determine exactly what was changed in the collection. Lets update the example above to write to the console what items were added or removed from the collection.

<code-listing heading="Using Splices">
  <source-code lang="ES 2015">
  </source-code>
  <source-code lang="ES 2016">
  </source-code>
  <source-code lang="TypeScript">
    collectionChanged(splices: Array<ICollectionObserverSplice<string>>) {
        for (var i = 0; i < splices.length; i++) {
          var splice: ICollectionObserverSplice<string> = splices[i];

          // Output the values that were added.
          var valuesAdded = this.myCollection.slice(splice.index, splice.index + splice.addedCount);
          console.log(valuesAdded);

          // Output the values that were removed.
          console.log(splice.removed);
        }
    }
  </source-code>
</code-listing>

If we now push two items into the array, in the console we would see an array that contained 2 values, then a second empty array because no removed items were detected.

<code-listing heading="Using Splices">
  <source-code lang="ES 2015">
  </source-code>
  <source-code lang="ES 2016">
  </source-code>
  <source-code lang="TypeScript">
    this.myCollection.push("hello", "world");
    // (2) ["hello", "world"]
    // []
  </source-code>
</code-listing>

If we remove two items, we would see first an empty array because we added no items, then an array that contained the two items that were removed.

<code-listing heading="Using Splices">
  <source-code lang="ES 2015">
  </source-code>
  <source-code lang="ES 2016">
  </source-code>
  <source-code lang="TypeScript">
    this.myCollection.splice(1, 2);
    // []
    // (2) ["hello", "world"]
  </source-code>
</code-listing>


- TODO: Link to ICollectionObserverSplice
- TODO: Using it with Set and Map
