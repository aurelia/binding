---
name: "Binding: Class and Style"
description: Data-binding class and style attributes with Aurelia.
author: Jeremy Danyow (http://danyow.net)
---

## Class

You can bind an element's `class` attribute using string interpolation or with `.bind`/`.to-view`.

<code-listing heading="Class Binding">
  <source-code lang="HTML">
    <template>
      <div class="foo ${isActive ? 'active' : ''} bar"></div>
      <div class.bind="isActive ? 'active' : ''"></div>
      <div class.one-time="isActive ? 'active' : ''"></div>
    </template>
  </source-code>
</code-listing>

To ensure maximum interoperability with other JavaScript libraries, the binding system will only add or remove classes specified in the binding expression. This ensures classes added by other code (eg via `classList.add(...)`) are preserved. This "safe by default" behavior comes at a small cost but can be noticeable in benchmarks or other performance critical situations like repeats with lots of elements. You can opt out of the default behavior by binding directly to the element's [`className`](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) property using `class-name.bind="...."` or `class-name.one-time="..."`. This will be marginally faster but can add up over a lot of bindings.

## Style

You can bind a css string or object to an element's `style` attribute. Use `css` custom attribute when doing string interpolation in your view to ensure your application is compatible with Internet Explorer and Edge.
If you don't use interpolation in `css` - it won't get processed, so if you are just using inline style - use the proper style attribute of HTMLElement.

<code-listing heading="Style Binding Data">
  <source-code lang="ES 2015/2016">
    export class StyleData {
      constructor() {
        this.styleString = 'color: red; background-color: blue';

        this.styleObject = {
          color: 'red',
          'background-color': 'blue'
        };
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    export class StyleData {
      styleString: string;
      styleObject: any;

      constructor() {
        this.styleString = 'color: red; background-color: blue';

        this.styleObject = {
          color: 'red',
          'background-color': 'blue'
        };
      }
    }
  </source-code>
</code-listing>

<code-listing heading="Style Binding View">
  <source-code lang="HTML">
    <template>
      <div style.bind="styleString"></div>
      <div style.bind="styleObject"></div>
    </template>
  </source-code>
</code-listing>

<code-listing heading="Illegal Style Interpolation">
  <source-code lang="HTML">
    <template>
      <div style="width: ${width}px; height: ${height}px;"></div>
    </template>
  </source-code>
</code-listing>

<code-listing heading="Legal Style Interpolation">
  <source-code lang="HTML">
    <template>
      <div css="width: ${width}px; height: ${height}px;"></div>
    </template>
  </source-code>
</code-listing>

<code-listing heading="Won't Work Without Interpolation">
  <source-code lang="HTML">
    <template>
      <div css="width: 100px; height: 100px;"></div>
    </template>
  </source-code>
</code-listing>
