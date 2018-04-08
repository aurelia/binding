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

Use the Collection Observer to observe changes to a collection. Collection types that can be observed are [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), and [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set). Create a subscription by providing the collection to observe and a callback function.

<code-listing heading="Configuring a Collection Observer">
  <source-code lang="ES 2015">
  </source-code>
  <source-code lang="ES 2016">
    import {BindingEngine, autoinject} from 'aurelia-framework';

    @inject(BindingEngine)
    export class App {

      myCollection = ["foo"];

      constructor(private bindingEngine) {
        let subscription = this.bindingEngine.collectionObserver(this.myCollection)
          .subscribe(this.collectionChanged.bind(this));
      }

      collectionChanged(splices) {
          // This will fire any time the collection is modified. 
      }
    }
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

The callback will receive an array of splices which provides information about the change that was detcted. The properties of the splice may vary depending on the type of collection being observed. Here you can see example callback functions used to observe each of the different collection types.

<code-listing heading="Array Splice">
  <source-code lang="ES 2015">
  </source-code>
  <source-code lang="ES 2016">
    collectionChanged(splices) {
      for (var i = 0; i < splices.length; i++) {
        var splice = splices[i];

        var valuesAdded = this.myCollection.slice(splice.index, splice.index + splice.addedCount);
        if (valuesAdded.length > 0) {
          console.log(`The following values were inserted at ${splice.index}: ${JSON.stringify(valuesAdded)}`);
        }

        if (splice.removed.length > 0) {
          console.log(`The following values were removed from ${splice.index}: ${JSON.stringify(splice.removed)}`);
        }
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    collectionChanged(splices: Array<ICollectionObserverSplice<string>>) {
      for (var i = 0; i < splices.length; i++) {
        var splice: ICollectionObserverSplice<string> = splices[i];

        var valuesAdded = this.myCollection.slice(splice.index, splice.index + splice.addedCount);
        if (valuesAdded.length > 0) {
          console.log(`The following values were inserted at ${splice.index}: ${JSON.stringify(valuesAdded)}`);
        }

        if (splice.removed.length > 0) {
          console.log(`The following values were removed from ${splice.index}: ${JSON.stringify(splice.removed)}`);
        }
      }
    }
  </source-code>
</code-listing>

<code-listing heading="Map Splice">
  <source-code lang="ES 2015">
  </source-code>
  <source-code lang="ES 2016">
    collectionChanged(splices) {
      for (var i = 0; i < splices.length; i++) {
        var splice = splices[i];

        if(splice.type == "add"){
          var valuesAdded = this.myCollection.get(splice.key);
          console.log(`'${valuesAdded}' was added to position ${splice.key}`);
        }
        
        if(splice.type == "update"){
          var newValue = splice.object.get(splice.key);
          console.log(`Position ${splice.key} changed from '${splice.oldValue}' to '${newValue}'`);
        }

        if(splice.type == "delete"){
          console.log(`'${splice.oldValue}' was deleted from position ${splice.key}`);
        }
      
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    collectionChanged(splices: Array<ICollectionObserverSplice<Map<number, string>>>) {
      for (var i = 0; i < splices.length; i++) {
        var splice: ICollectionObserverSplice<Map<number, string>> = splices[i];

        if(splice.type == "add"){
          var valuesAdded = this.myCollection.get(splice.key);
          console.log(`'${valuesAdded}' was added to position ${splice.key}`);
        }
        
        if(splice.type == "update"){
          var newValue = splice.object.get(splice.key);
          console.log(`Position ${splice.key} changed from '${splice.oldValue}' to '${newValue}'`);
        }

        if(splice.type == "delete"){
          console.log(`'${splice.oldValue}' was deleted from position ${splice.key}`);
        }
      
      }
    }
  </source-code>
</code-listing>

<code-listing heading="Set Splice">
  <source-code lang="ES 2015">
  </source-code>
  <source-code lang="ES 2016">
    collectionChanged(splices) {
      for (var i = 0; i < splices.length; i++) {
        var splice = splices[i];

        if(splice.type == "add"){
          console.log(`'${splice.value}' was added to the set`);
        }

        if(splice.type == "delete"){
          console.log(`'${splice.value}' was removed from the set`);
        }
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    collectionChanged(splices: Array<ICollectionObserverSplice<Set<number>>>) {
      for (var i = 0; i < splices.length; i++) {
        var splice: ICollectionObserverSplice<Set<number>> = splices[i];

        if(splice.type == "add"){
          console.log(`'${splice.value}' was added to the set`);
        }

        if(splice.type == "delete"){
          console.log(`'${splice.value}' was removed from the set`);
        }
      }
    }
  </source-code>
</code-listing>

> Warning
> If you were to overwrite the value of the collection after the subscription has been created, changes wil no longer be detected. For example, running `this.myCollection = []` after `this.bindingEngine.collectionObserver(this.myCollection)` will fail to observe changes to `myCollection`.
