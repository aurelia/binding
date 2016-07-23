---
{
  "name": "Binding: Class and Style",
  "culture": "en-US",
  "description": "Data-binding class and style attributes with Aurelia.",
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

## [Class](aurelia-doc://section/1/version/1.0.0)

You can bind an element's `class` attribute using string interpolation or with `.bind`/`.one-time`.

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

## [Style](aurelia-doc://section/2/version/1.0.0)

You can bind a css string or object to an element's `style` attribute. Use the `style` attribute's alias, `css` when doing string interpolation to ensure your application is compatible with Internet Explorer and Edge.

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
