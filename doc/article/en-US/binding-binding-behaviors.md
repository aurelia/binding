---
{
  "name": "Binding: Binding Behaviors",
  "culture": "en-US",
  "description": "An overview of the Aurelia binding engine's binding behavior functionality. Binding Behaviors are used to plug into a binding instance's lifecycle and change the way it operates.",
  "engines" : { "aurelia-doc" : "^1.0.0" },
  "author": {
  	"name": "Jeremy Danyow",
  	"url": "http://danyow.net"
  },
  "contributors": [],
  "translators": [],
  "keywords": ["JavaScript", "Data Binding", "Binding Behaviors"]
}
---
## [Introduction](aurelia-doc://section/1/version/1.0.0)

Binding behaviors are a category of view resource, just like value converters, custom attributes and custom elements.  Binding behaviors are most like [value converters](http://www.danyow.net/aurelia-value-converters/) in that you use them declaratively in binding expressions to affect the binding.

The primary difference between a binding behavior and a value converter is *binding behaviors have full access to the binding instance, throughout it's lifecycle*. Contrast this with a value converter which only has the ability to intercept values passing from the model to the view and visa versa.

The additional "access" afforded to binding behaviors gives them the ability to change the behavior of the binding, enabling a lot of interesting scenarios which you'll see below.

## [throttle](aurelia-doc://section/2/version/1.0.0)

Aurelia ships with a handful of behaviors out of the box to enable common scenarios.  The first is the throttle binding behavior which limits the rate at which the view-model is updated in two-way bindings or the rate at which the view is updated in to-view binding scenarios.

By default `throttle` will only allow updates every 200ms. You can customize the rate of course.  Here are a few examples.

<code-listing heading="Updating a property, at most, every 200ms">
  <source-code lang="HTML">
    <input type="text" value.bind="query & throttle">
  </source-code>
</code-listing>

The first thing you probably noticed in the example above is the `&` symbol, which is used to declare binding behavior expressions. Binding behavior expressions use the same syntax pattern as value converter expressions:

* Binding behaviors can accept arguments: `firstName & myBehavior:arg1:arg2:arg3`
* A binding expression can contain multiple binding behaviors: `firstName & behavior1 & behavior2:arg1`.
* Binding expressions can also include a combination of value converters and binding behaviors: `\${foo | upperCase | truncate:3 & throttle & anotherBehavior:arg1:arg2}`.

Here's another example using `throttle`, demonstrating the ability to pass arguments to the binding behavior:

<code-listing heading="Updating a property, at most, every 850ms">
  <source-code lang="HTML">
    <input type="text" value.bind="query & throttle:850">
  </source-code>
</code-listing>

The throttle behavior is particularly useful when binding events to methods on your view-model.  Here's an example with the `mousemove` event:

<code-listing heading="Handling an event, at most, every 200ms">
  <source-code lang="HTML">
    <div mousemove.delegate="mouseMove($event) & throttle"></div>
  </source-code>
</code-listing>

<au-demo heading="Throttle Demo">
  <source-code src="example/binding-binding-behaviors/throttle/app.js"></source-code>
</au-demo>

## [debounce](aurelia-doc://section/3/version/1.0.0)

The debounce binding behavior is another rate limiting binding behavior. Debounce prevents the binding from being updated until a specified interval has passed without any changes.

A common use case is a search input that triggers searching automatically.  You wouldn't want to make a search API on every change (every keystroke).  It's more efficient to wait until the user has paused typing to invoke the search logic.

<code-listing heading="Update after typing stopped for 200ms">
  <source-code lang="HTML">
    <input type="text" value.bind="query & debounce">
  </source-code>
</code-listing>

<code-listing heading="Update after typing stopped for 850ms">
  <source-code lang="HTML">
    <input type="text" value.bind="query & debounce:850">
  </source-code>
</code-listing>

Like throttle, the `debounce` binding behavior really shines in event binding. Here's another example with the `mousemove` event:

<code-listing heading="Call mouseMove after mouse stopped moving for 500ms">
  <source-code lang="HTML">
    <div mousemove.delegate="mouseMove($event) & debounce:500"></div>
  </source-code>
</code-listing>

<au-demo heading="Debounce Demo">
  <source-code src="example/binding-binding-behaviors/debounce/app.js"></source-code>
</au-demo>

## [updateTrigger](aurelia-doc://section/4/version/1.0.0)

Update trigger allows you to override the input events that cause the element's value to be written to the view-model. The default events are `change` and `input`.

Here's how you would tell the binding to only update the model on `blur`:

<code-listing heading="Update on blur">
  <source-code lang="HTML">
    <input value.bind="firstName & updateTrigger:'blur'>
  </source-code>
</code-listing>

Multiple events are supported:

<code-listing heading="Update with multiple events">
  <source-code lang="HTML">
    <input value.bind="firstName & updateTrigger:'blur':'paste'>
  </source-code>
</code-listing>

<au-demo heading="Update Trigger Demo">
  <source-code src="example/binding-binding-behaviors/update-trigger/app.js"></source-code>
</au-demo>

## [signal](aurelia-doc://section/5/version/1.0.0)

The signal binding behavior enables you to "signal" the binding to refresh. This is especially useful when a binding result is impacted by global changes that are outside of the observation path.

For example, if you have a "translate" value converter that converts a key to a localized string- eg `\${'greeting-key' | translate}` and your site allows users to change the current language, how would you refresh the bindings when that happens?

Another example is a value converter that uses the current time to convert a record's datetime to a "time ago" value:  `posted \${postDateTime | timeAgo}`. The moment this binding expression is evaluated it will correctly result in `posted a minute ago`.  As time passes, it will eventually become inaccurate. How can we refresh this binding periodically so that it correctly displays `5 minutes ago`, then `15 minutes ago`, `an hour ago`, etc?

Here's how you would accomplish this using the `signal` binding behavior:

<code-listing heading="Using a Signal">
  <source-code lang="HTML">
    posted ${postDateTime | timeAgo & signal:'my-signal'}
  </source-code>
</code-listing>

In the binding expression above we're using the `signal` binding behavior *to assign the binding a "signal name" of `my-signal`.* Signal names are arbitrary, you can give multiple bindings the same signal name if you want to signal multiple bindings at the same time.

Here's how we can use the `BindingSignaler` to signal the bindings periodically:

<code-listing heading="Signaling Bindings">
  <source-code lang="ES 2015">
    import {BindingSignaler} from 'aurelia-templating-resources';

    export class App {
      static inject() { return [BindingSignaler] };

      constructor(signaler) {
        setInterval(() => signaler.signal('my-signal'), 5000);
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    import {BindingSignaler} from 'aurelia-templating-resources';
    import {inject} from 'aurelia-framework';

    @inject(BindingSignaler)
    export class App {
      constructor(signaler) {
        setInterval(() => signaler.signal('my-signal'), 5000);
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {BindingSignaler} from 'aurelia-templating-resources';
    import {autoinject} from 'aurelia-framework';

    @autoinject
    export class App {
      constructor(signaler: BindingSignaler) {
        setInterval(() => signaler.signal('my-signal'), 5000);
      }
    }
  </source-code>
</code-listing>

<au-demo heading="Signal Demo">
  <source-code src="example/binding-binding-behaviors/signal/app.js"></source-code>
</au-demo>

## [oneTime](aurelia-doc://section/6/version/1.0.0)

With the `oneTime` binding behavior you can specify that string interpolated bindings should happen once. Simply write:

<code-listing heading="One-time String Interpolation">
  <source-code lang="HTML">
    <span>${foo & oneTime}</span>
  </source-code>
</code-listing>

This is an important feature to expose. One-time bindings are the most efficient type of binding because they don't incur any property observation overhead.

There are also binding behaviors for `toView` and `twoWay` which you could use like this:

<code-listing heading="To-view and two-way binding behaviours">
  <source-code lang="HTML">
    <input value.bind="foo & toView">
    <input value.to-view="foo">

    <input value.bind="foo & twoWay">
    <input value.two-way="foo">
  </source-code>
</code-listing>

> Warning: Binding Mode Casing
> The casing for binding modes is different depending on whether they appear as a **binding command** or as a **binding behavior**. Because HTML is case-insensitive, binding commands cannot use capitals. Thus, the binding modes, when specified in this place, use lowercase, dashed names. However, when used within a binding expression as a binding behavior, they must not use a dash because that is not a valid symbol for variable names in JavaScript. So, in this case, camel casing is used.

## [self](aurelia-doc://section/7/version/1.0.0)

With the `self` binding behavior, you can specify that event handler will only response to the target where listener was attached to, not its descendants.

For example, in the following markup

<code-listing heading="Self binding behavior">
  <source-code lang="HTML">
    <panel>
      <header mousedown.delegate='onMouseDown($event)' ref='header'>
        <button>Settings</button>
        <button>Close</button>
      </header>
    </panel>
  </source-code>
</code-listing>

`onMouseDown` is your event handler and it will be called not only when user `mousedown` on header element, but also all
elements inside it, which in this case are the buttons `settings` and `close`. However, this is not always desired behavior.
Sometimes you want the component to only react when user click on the header itself, not the buttons. In order to achieve this, `onMouseDown` method needs
some modification:

<code-listing heading="Handler without self binding behavior">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    // inside component's view model class
    onMouseDown(event) {
      // if mousedown on the header's descendants. Do nothing
      if (event.target !== header) return;
      // mousedown on header, start listening for mousemove to drag the panel
      // ...
    }
  </source-code>
</code-listing>

This works, but now business/ component logic are mixed up with DOM event handling, which are not necessary. Using `self` binding behavior can help
you achieve the same goal without filling up your methods with unnecessary code:

<code-listing heading="Using self binding behavior">
  <source-code lang="HTML">
    <panel>
      <header mousedown.delegate='onMouseDown($event) & self'>
        <button class='settings'></button>
        <button class='close'></button>
      </header>
    </panel>
  </source-code>
</code-listing>

<code-listing heading="Using self binding behavior">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    // inside component's view model class
    onMouseDown(event) {
      // No need to perform check, as the binding behavior will ensure check
      // if (event.target !== header) return;
      // mousedown on header, start listening for mousemove to drag the panel
      // ...
    }
  </source-code>
</code-listing>

## [Custom binding behaviors](aurelia-doc://section/8/version/1.0.0)

You can build custom binding behaviors just like you can build value converters. Instead of `toView` and `fromView` methods you'll create `bind(binding, scope, [...args])` and `unbind(binding, scope)` methods. In the bind method you'll add your behavior to the binding and in the unbind method you should cleanup whatever you did in the bind method to restore the binding instance to it's original state. The `binding` argument is the binding instance whose behavior you want to change. It's an implementation of the `Binding` interface. The `scope` argument is the binding's data-context. It provides access to the model the binding will be bound to via it's `bindingContext` and `overrideContext` properties.

Here's a custom binding behavior that calls a method on your view model each time the binding's `updateSource` / `updateTarget` and `callSource` methods are invoked.

<code-listing heading="Creating a Custom Binding Behavior">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    const interceptMethods = ['updateTarget', 'updateSource', 'callSource'];

    export class InterceptBindingBehavior {
      bind(binding, scope, interceptor) {
        let i = interceptMethods.length;
        while (i--) {
          let method = interceptMethods[i];
          if (!binding[method]) {
            continue;
          }
          binding[`intercepted-${method}`] = binding[method];
          let update = binding[method].bind(binding);
          binding[method] = interceptor.bind(binding, method, update);
        }
      }

      unbind(binding, scope) {
        let i = interceptMethods.length;
        while (i--) {
          let method = interceptMethods[i];
          if (!binding[method]) {
            continue;
          }
          binding[method] = binding[`intercepted-${method}`];
          binding[`intercepted-${method}`] = null;
        }
      }
    }
  </source-code>
</code-listing>

<code-listing heading="Using a Custom Binding Behavior">
  <source-code lang="HTML">
    <template>
      <require from="./intercept-binding-behavior"></require>

      <div mousemove.delegate="mouseMove($event) & intercept:myFunc"></div>

      <input value.bind="foo & intercept:myFunc">
    </template>
  </source-code>
</code-listing>

<au-demo heading="Custom Binding Behavior Demo">
  <source-code src="example/binding-binding-behaviors/custom/app.js"></source-code>
</au-demo>
