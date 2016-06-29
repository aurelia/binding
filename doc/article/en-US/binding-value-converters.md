---
{
  "name": "Binding: Value Converters",
  "culture": "en-US",
  "description": "An overview of the Aurelia binding engine's value converter functionality. Value converters are used to transform data during the data-binding process, both to and from the view.",
  "engines" : { "aurelia-doc" : "^1.0.0" },
  "author": {
  	"name": "Jeremy Danyow",
  	"url": "http://danyow.net"
  },
  "contributors": [],
  "translators": [],
  "keywords": ["JavaScript", "Data Binding", "Value Converters"]
}
---
## [Introduction](aurelia-doc://section/1/version/1.0.0)

In Aurelia, user interface elements are composed of view and view-model pairs. The view is written with HTML and is rendered into the DOM. The view-model is written with JavaScript and provides data and behavior to the view. Aurelia's powerful data-binding links the two pieces together, allowing changes in your data to be reflected in the view and vice versa.

Here's a simple data-binding example using the **bind** (`.bind="expression"`) and **interpolation** (`\${expression}`) techniques:

<code-listing heading="simple-binding${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class Person {
      constructor() {
        this.name = 'Donald Draper';
      }
    }
  </source-code>
  <source-code lang="ES 2016">
    export class Person {
      name = 'Donald Draper';
    }
  </source-code>
  <source-code lang="TypeScript">
    export class Person {
      name: string = 'Donald Draper';
    }
  </source-code>
</code-listing>

<code-listing heading="simple-binding.html">
  <source-code lang="HTML">
    <template>
      <label for="name">Enter Name:</label>
      <input id="name" type="text" value.bind="name" />
      <p>Name is ${name}</p>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Simple Binding Demo">
  <source-code src="example/binding-value-converters/simple-binding/app.js"></source-code>
</au-demo>

Sometimes the raw data exposed by your view-model isn't in a format that's ideal for displaying in the UI. Rendering date and numeric values are common scenarios:

<code-listing heading="date-and-number${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class NetWorth {
      constructor() {
        this.update();
        setInterval(() => this.update(), 1000);
      }

      update() {
        this.currentDate = new Date();
        this.netWorth = Math.random() * 1000000000;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    export class NetWorth {
      currentDate: Date;
      netWorth: number;

      constructor() {
        this.update();
        setInterval(() => this.update(), 1000);
      }

      update() {
        this.currentDate = new Date();
        this.netWorth = Math.random() * 1000000000;
      }
    }
  </source-code>
</code-listing>

<code-listing heading="date-and-number.html">
  <source-code lang="HTML">
    <template>
      ${currentDate} <br/>
      ${netWorth}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Date/Number Binding Demo">
  <source-code src="example/binding-value-converters/date-and-number/app.js"></source-code>
</au-demo>

Ideally, the date would be in a more readable format and the amount would be formatted as currency. One solution to this problem would be to compute the formatted values and expose them as properties of the view-model. This is certainly a valid approach; however, defining extra properties and methods in your models can get messy, especially when you need to keep the formatted values in sync when the original property value change. Fortunately, Aurelia has a feature that makes solving this problem quite easy.

## [Value Converters](aurelia-doc://section/2/version/1.0.0)

> A value converter is a class whose responsibility is to convert view-model values into values that are appropriate to display in the view *and visa-versa*.

Most commonly you'll be creating value converters that translate model data to a format suitable for the view; however, there are situations where you'll need to convert data from the view to a format expected by the view-model, typically when using two-way binding with input elements.

If you've used value converters in other languages such as Xaml, you'll find Aurelia value converters are quite similar, although with a few notable improvements:

1. The Aurelia ValueConverter interface uses `toView` and `fromView` methods, which make it quite clear which direction the data is flowing.  This is in contrast to Xaml's `IValueConverter`, which uses `Convert` and `ConvertBack`.
2. In Aurelia, converter parameters can be data-bound.  This is something that was missing in Xaml and enables more advanced binding scenarios.
3. Aurelia value converter methods can accept multiple parameters.
4. Multiple value converters can be composed using pipes (`|`).

## [Simple Converters](aurelia-doc://section/3/version/1.0.0)

Before we get too far into the details, let's rework the previous example to use a couple of basic value converters.  Aurelia and the popular [Moment](http://momentjs.com/) and [Numeral](http://numeraljs.com/) libraries will take care of the heavy lifting, we just need to wire things up...

<code-listing heading="currency-format${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    import numeral from 'numeral';

    export class CurrencyFormatValueConverter {
      toView(value) {
        return numeral(value).format('($0,0.00)');
      }
    }
  </source-code>
</code-listing>

<code-listing heading="date-format${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    import moment from 'moment';

    export class DateFormatValueConverter {
      toView(value) {
        return moment(value).format('M/D/YYYY h:mm:ss a');
      }
    }
  </source-code>
</code-listing>

<code-listing heading="simple-converter${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class NetWorth {
      constructor() {
        this.update();
        setInterval(() => this.update(), 1000);
      }

      update() {
        this.currentDate = new Date();
        this.netWorth = Math.random() * 1000000000;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    export class NetWorth {
      currentDate: Date;
      netWorth: number;

      constructor() {
        this.update();
        setInterval(() => this.update(), 1000);
      }

      update() {
        this.currentDate = new Date();
        this.netWorth = Math.random() * 1000000000;
      }
    }
  </source-code>
</code-listing>

<code-listing heading="simple-converter.html">
  <source-code lang="HTML">
    <template>
      <require from="./date-format"></require>
      <require from="./currency-format"></require>

      ${currentDate | dateFormat} <br/>
      ${netWorth | currencyFormat}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Simple Converter Demo">
  <source-code src="example/binding-value-converters/simple-converter/app.js"></source-code>
</au-demo>

OK, the result looks much better, but how did this all work?

Well, first we created a couple of value converters:  `DateFormatValueConverter` and `CurrencyFormatValueConverter`.  Each has a `toView` method that the Aurelia framework will apply to model values before displaying them in the view. Our converters use the MomentJS and NumeralJS libraries to format the data.

Next, we updated the view to `require` the converters so they can be used in the view.  When requiring a resource such as a value converter, you supply the path to the resource in the require element's `from` attribute.

<code-listing heading="Requiring Resources">
  <source-code lang="HTML">
    <require from="./date-format"></require>
    <require from="./currency-format"></require>
  </source-code>
</code-listing>

When Aurelia processes the resource, it examines the class's metadata to determine the resource type (custom element, custom attribute, value converter, etc). Metadata isn't required, and in fact our value converters didn't expose any. Instead, we relied on one of Aurelia's simple conventions:  export names ending with *ValueConverter* are assumed to be value converters.  **The convention registers the converter using the export name, camel-cased, with the *ValueConverter* portion stripped from the end.**

* `DateFormatValueConverter` registers as `dateFormat`
* `CurrencyFormatValueConverter` registers as `currencyFormat`

Finally, we applied the converter in the binding using the pipe `|` syntax:

<code-listing heading="Converter Syntax">
  <source-code lang="HTML">
    ${currentDate | dateFormat} <br/>
    ${netWorth | currencyFormat}
  </source-code>
</code-listing>

> Info: Conventional Names
> The name that a resource is referenced by in a view derives from its export name. For Value Converters and Binding Behaviors, the export name is converted to camel case (think of it as a variable name). For Custom Elements and Custom Attributes the export name is lower-cased and hyphenated (to comply with HTML element and attribute specifications).

## [Converter Parameters](aurelia-doc://section/4/version/1.0.0)

The converters in the previous example worked great, but what if we needed to display dates and numbers in multiple formats?  It would be quite repetitive to define a converter for each format we needed to display.  A better approach would be to modify the converters to accept a `format` parameter.  Then we'd be able to specify the format in the binding and get maximum reuse out of our format converters.

<code-listing heading="number-format${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    import numeral from 'numeral';

    export class NumberFormatValueConverter {
      toView(value, format) {
        return numeral(value).format(format);
      }
    }
  </source-code>
</code-listing>

<code-listing heading="date-format${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    import moment from 'moment';

    export class DateFormatValueConverter {
      toView(value, format) {
        return moment(value).format(format);
      }
    }
  </source-code>
</code-listing>

<code-listing heading="converter-parameters${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class NetWorth {
      constructor() {
        this.update();
        setInterval(() => this.update(), 1000);
      }

      update() {
        this.currentDate = new Date();
        this.netWorth = Math.random() * 1000000000;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    export class NetWorth {
      currentDate: Date;
      netWorth: number;

      constructor() {
        this.update();
        setInterval(() => this.update(), 1000);
      }

      update() {
        this.currentDate = new Date();
        this.netWorth = Math.random() * 1000000000;
      }
    }
  </source-code>
</code-listing>

<code-listing heading="converter-parameters.html">
  <source-code lang="HTML">
    <template>
      <require from="./date-format"></require>
      <require from="./number-format"></require>

      ${currentDate | dateFormat:'M/D/YYYY h:mm:ss a'} <br/>
      ${currentDate | dateFormat:'MMMM Mo YYYY'} <br/>
      ${currentDate | dateFormat:'h:mm:ss a'} <br/>
      ${netWorth | numberFormat:'$0,0.00'} <br/>
      ${netWorth | numberFormat:'$0.0a'} <br/>
      ${netWorth | numberFormat:'0.00000)'}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Converter Parameters Demo">
  <source-code src="example/binding-value-converters/converter-parameters/app.js"></source-code>
</au-demo>

With the `format` parameter added to the `toView` methods, we are able to specify the format in the binding using the `[expression] | [converterName]:[parameterExpression]` syntax:

<code-listing heading="Converter Parameter Syntax">
  <source-code lang="HTML">
    ${currentDate | dateFormat:'MMMM Mo YYYY'} <br/>
    ${netWorth | numberFormat:'$0.0a'} <br/>
  </source-code>
</code-listing>

## [Binding Converter Parameters](aurelia-doc://section/5/version/1.0.0)

Converter parameters needn't be literal values.  You can bind parameter values to achieve dynamic results:

<code-listing heading="number-format${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    import numeral from 'numeral';

    export class NumberFormatValueConverter {
      toView(value, format) {
        return numeral(value).format(format);
      }
    }
  </source-code>
</code-listing>

<code-listing heading="binding-converter-parameters${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class NetWorth {
      constructor() {
        this.update();
        setInterval(() => this.update(), 1000);
      }

      update() {
        this.netWorth = Math.random() * 1000000000;
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    export class NetWorth {
      netWorth: number;

      constructor() {
        this.update();
        setInterval(() => this.update(), 1000);
      }

      update() {
        this.netWorth = Math.random() * 1000000000;
      }
    }
  </source-code>
</code-listing>

<code-listing heading="binding-converter-parameters.html">
  <source-code lang="HTML">
    <template>
      <require from="./number-format"></require>

      <label for="formatSelect">Select Format:</label>
      <select id="formatSelect" ref="formatSelect">
        <option value="$0,0.00">$0,0.00</option>
        <option value="$0.0a">$0.0a</option>
        <option value="0.00000">0.00000</option>
      </select>

      ${netWorth | numberFormat:formatSelect.value}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Binding Converter Parameters Demo">
  <source-code src="example/binding-value-converters/binding-converter-parameters/app.js"></source-code>
</au-demo>

## [Multiple Parameters / Composing Converters](aurelia-doc://section/6/version/1.0.0)

Value converters can accept multiple parameters and multiple converters can be composed in the same binding expression, providing a lot of flexibility and opportunity for reuse.

In the following example, we have a view-model exposing an array of Aurelia repos. The view uses a repeat binding to list the repos in a table. A `SortValueConverter` is used to sort the array based on two arguments: `propertyName` and `direction`.  A second converter, `TakeValueConverter` accepting a `count` argument is applied to limit the number of repositories listed:

<code-listing heading="Multiple Parameters and Converters">
  <source-code lang="HTML">
    <template>
      <tr repeat.for="repo of repos | sort:column.value:direction.value | take:10">
        ...
      </tr>
    </template>
  </source-code>
</code-listing>

Here's the full example:

<code-listing heading="sort${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    export class SortValueConverter {
      toView(array, propertyName, direction) {
        let factor = direction === 'ascending' ? 1 : -1;
        return array.sort((a, b) => {
          return (a[propertyName] - b[propertyName]) * factor;
        });
      }
    }
  </source-code>
</code-listing>

<code-listing heading="take${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    export class TakeValueConverter {
      toView(array, count) {
        return array.slice(0, count);
      }
    }
  </source-code>
</code-listing>

<code-listing heading="multiple-parameters-and-converters${context.language.fileExtension}">
  <source-code lang="ES 2015">
    import {HttpClient} from 'aurelia-http-client';

    export class AureliaRepositories {
      constructor() {
        this.repos = [];
      }

      activate() {
        return new HttpClient()
          .get('https://api.github.com/orgs/aurelia/repos')
          .then(response => this.repos = response.content);
      }
    }
  </source-code>
  <source-code lang="ES 2016/TypeScript">
    import {HttpClient} from 'aurelia-http-client';

    export class AureliaRepositories {
      repos = [];

      activate() {
        return new HttpClient()
          .get('https://api.github.com/orgs/aurelia/repos')
          .then(response => this.repos = response.content);
      }
    }
  </source-code>
</code-listing>

<code-listing heading="multiple-parameters-and-converters.html">
  <source-code lang="HTML">
    <template>
      <require from="./sort"></require>
      <require from="./take"></require>

      <label for="column">Sort By:</label>
      <select id="column" ref="column">
        <option value="stargazers_count">Stars</option>
        <option value="forks_count">Forks</option>
        <option value="open_issues">Issues</option>
      </select>

      <select ref="direction">
        <option value="descending">Descending</option>
        <option value="ascending">Ascending</option>
      </select>

      <table class="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Stars</th>
            <th>Forks</th>
            <th>Issues</th>
          </tr>
        </thead>
        <tbody>
          <tr repeat.for="repo of repos | sort:column.value:direction.value | take:10">
            <td>${repo.name}</td>
            <td>${repo.stargazers_count}</td>
            <td>${repo.forks_count}</td>
            <td>${repo.open_issues}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Multiple Parameters and Converters Demo">
  <source-code src="example/binding-value-converters/multiple-parameters-and-converters/app.js"></source-code>
</au-demo>

## [Object Parameters](aurelia-doc://section/7/version/1.0.0)

Aurelia supports object converter parameters. An alternate implementation of the `SortValueConverter` using a single `config` parameter would look like this:

<code-listing heading="sort${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    export class SortValueConverter {
      toView(array, config) {
        let factor = (config.direction || 'ascending') === 'ascending' ? 1 : -1;
        return array.sort((a, b) => {
          return (a[config.propertyName] - b[config.propertyName]) * factor;
        });
      }
    }
  </source-code>
</code-listing>

<code-listing heading="object-parameters${context.language.fileExtension}">
  <source-code lang="ES 2015">
    import {HttpClient} from 'aurelia-http-client';

    export class AureliaRepositories {
      constructor() {
        this.repos = [];
      }

      activate() {
        return new HttpClient()
          .get('https://api.github.com/orgs/aurelia/repos')
          .then(response => this.repos = response.content);
      }
    }
  </source-code>
  <source-code lang="ES 2016/TypeScript">
    import {HttpClient} from 'aurelia-http-client';

    export class AureliaRepositories {
      repos = [];

      activate() {
        return new HttpClient()
          .get('https://api.github.com/orgs/aurelia/repos')
          .then(response => this.repos = response.content);
      }
    }
  </source-code>
</code-listing>

<code-listing heading="object-parameters.html">
  <source-code lang="HTML">
    <template>
      <require from="./sort"></require>

      <div class="row">
        <div class="col-sm-3"
             repeat.for="repo of repos | sort: { propertyName: 'open_issues', direction: 'descending' }">
          <a href="${repo.html_url}/issues" target="_blank">
            ${repo.name} (${repo.open_issues})
          </a>
        </div>
      </div>
    </template>
  </source-code>
</code-listing>

<au-demo heading="Object Parameters Demo">
  <source-code src="example/binding-value-converters/object-parameters/app.js"></source-code>
</au-demo>

There are a couple of advantages to this approach: you don't need to remember the order of the converter parameter arguments, and anyone reading the markup can easily tell what each converter parameter represents.

## [Bi-directional Value Converters](aurelia-doc://section/8/version/1.0.0)

So far we've been using converters with one-way bindings. The data flows in a single direction, from the model to the view.  When using a converter in an input element's `value` binding, we need a way to convert the user's data entry to the format expected by the view-model. This is where the value converter's `fromView` method comes into play, taking the element's value and converting it to the format expected by the view-model.

In the example below, we have a view-model that exposes colors in an object format, with properties for the red, green and blue components. In the view, we want to bind this color object to an HTML5 color input. The color input expects hex format text, so we'll use an `RgbToHexValueConverter` to facilitate the binding.

<code-listing heading="rgb-to-hex${context.language.fileExtension}">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    export class RgbToHexValueConverter {
      toView(rgb) {
        return "#" + (
          (1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b
        ).toString(16).slice(1);
      }

      fromView(hex) {
        let exp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
            result = exp.exec(hex);
        return {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        };
      }
    }
  </source-code>
</code-listing>

<code-listing heading="bi-directional-value-converters${context.language.fileExtension}">
  <source-code lang="ES 2015">
    export class Color {
      constructor() {
        this.rgb = { r: 146, g: 39, b: 143 };
      }
    }
  </source-code>
  <source-code lang="ES 2016/TypeScript">
    export class Color {
      rgb = { r: 146, g: 39, b: 143 };
    }
  </source-code>
</code-listing>

<code-listing heading="object-parameters.html">
  <source-code lang="HTML">
    <template>
      <require from="./rgb-to-hex"></require>

      <label for="color">Select Color:</label>
      <input id="color" type="color" value.bind="rgb | rgbToHex" />
      <br/> r: ${rgb.r}, g:${rgb.g}, b:${rgb.b}
    </template>
  </source-code>
</code-listing>

<au-demo heading="Bi-directional Value Converters Demo">
  <source-code src="example/binding-value-converters/bi-directional-value-converters/app.js"></source-code>
</au-demo>

## [Globally Accessible Value Converters](aurelia-doc://section/9/version/1.0.0)

In all of our examples, we've been using the `require` element to import converters we need into our view.  There's an easier way.  If you have some commonly used value converters that you'd like to make globally available, use Aurelia's `globalResources` function to register them.  This will eliminate the need for `require` elements at the top of every view.
