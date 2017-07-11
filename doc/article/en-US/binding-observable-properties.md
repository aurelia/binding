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

Have you ever needed to perform an action when a property is changed? Well, that's when we use property observation. 

To observe a property, you just need to decorate it with the `@observable` decorator and define a method to be the change handler. This method can receive 2 parameters, the new value and the old value. You can put any business logic inside this method.

By convention, the change handler is a method whose its name is composed by the _property_name_ + 'Changed'. For example, if you decorate the property `color` with `@observable`, you have to define a method named `colorChanged()` to be the change handler. That's is how it should look:

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

      @observable
      color = 'blue';

      colorChanged(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import { observable } from 'aurelia-framework';

    export class Car {

      @observable
      color = 'blue';

      colorChanged(newValue, oldValue) {
        // this will fire whenever the 'color' property changes
      }
    }
  </source-code>
</code-listing>

Note that you do not have to check if `newValue` and `oldValue` are different. The change handler will not be called if you assign a value that the property already has.

If you do not want to use the conventions, you can define another name to change handler by setting the `changeHandler` property of the `@observable` decorator:

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

You can also put the `@observable` on classes. In this case, you have to pass the property name as an argument.

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
    
    @observable('color')
    export class Car {

      color = 'blue';

      colorChanged(newValue, oldValue) {
        // this will fire whenever the color property changes
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import { observable } from 'aurelia-framework';
    
    @observable('color')
    export class Car {

      color = 'blue';

      colorChanged(newValue, oldValue) {
        // this will fire whenever the color property changes
      }
    }
  </source-code>
</code-listing>  

If you want to define the change handler, you have to pass an object as an argument.

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
  </source-code lang="ES 2016">
    import { observable } from 'aurelia-framework';
  
    @observable({ name: 'color', changeHandler: 'myChangeHandler' })
    export class Car {

      color = 'blue';

      myChangeHandler(newValue, oldValue) {
        // this will fire whenever the color property changes
      }
    }
  </source-code>
  </source-code lang="TypeScript">
    import { observable } from 'aurelia-framework';
  
    @observable({ name: 'color', changeHandler: 'myChangeHandler' })
    export class Car {

      color = 'blue';

      myChangeHandler(newValue, oldValue) {
        // this will fire whenever the color property changes
      }
    }
  </source-code>
</code-listing>

