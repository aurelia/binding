---
{
  "name": "Binding: Delegate vs Trigger",
  "culture": "en-US",
  "description": "When to use delegate and when to use trigger.",
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

## [Delegate vs Trigger](aurelia-doc://section/1/version/1.0.0)

A couple frequently asked questions are:

* *What's the difference between delegate and trigger?*
* *When should I use delegate and when should I use trigger?*

The short answer is: **Use `delegate` except when you cannot use `delegate`.**

Event delegation is a technique used to improve application performance. It drastically reduces the number of event subscriptions by leveraging the "bubbling" characteristic of most DOM events. With event delegation, handlers are not attached to individual elements. Instead, a single event handler is attached to a top-level node such as the body element. When an event bubbles up to this shared top-level handler the event delegation logic calls the appropriate handler based on the event's [target](https://developer.mozilla.org/en-US/docs/Web/API/Event/target).

To find out if [event delegation](https://davidwalsh.name/event-delegate) can be used with a particular event, google *`mdn [event name] event`*. In fact, preceding any web platform related google search with `mdn` often returns a high quality result from the Mozilla Developer Network. Once you're on the event's MDN page, check whether the event `bubbles`. Only events that bubble can be used with Aurelia's `delegate` binding command. **The `blur`, `focus`, `load` and `unload` events do not bubble so you'll need to use the `trigger` binding command to subscribe to these events.**

Here's the [MDN page for blur](https://developer.mozilla.org/en-US/docs/Web/Events/blur). It has further info on event delegation techniques for the blur and focus events.

### Exceptions to the general guidance above:

#### Use `trigger` on buttons when the following conditions are met:
1. You need to disable the button.
2. The button's content is made up of other elements (as opposed to just text).

This will ensure clicks on disabled button's children won't bubble up to the delegate event handler.  More info [here](https://github.com/aurelia/binding/issues/163).

#### Use `trigger` for `click` in certain iOS use-cases:
iOS does not bubble click events on elements other than `a`, `button`, `input` and `select`. If you're subscribing to `click` on a non-input element like a `div` and are targeting iOS, use the `trigger` binding command.
More info [here](http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html) and [here](https://github.com/aurelia/binding/issues/263).
