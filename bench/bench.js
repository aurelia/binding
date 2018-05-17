const { Parser: ParserV2New } = require('../dist/commonjs/aurelia-binding');
const { Parser: ParserV2 } = require('./v2/aurelia-binding');
const { Parser: ParserV1 } = require('./v1/aurelia-binding');

const v2new = new ParserV2New();
const v2 = new ParserV2();
const v1 = new ParserV1();

const colors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m'
};
const widths = {
  executionTime: 12,
  weight: 8,
  diffPercent: 9,
  expression: 35
};
const columns = {
  0: { name: 'Weight', width: widths.weight },
  1: { name: 'Expression', width: widths.expression },
  2: { name: 'v1', width: widths.executionTime },
  3: { name: 'v2', width: widths.executionTime },
  4: { name: 'v1/v2', width: widths.diffPercent },
  5: { name: 'New', width: widths.executionTime },
  6: { name: 'v1/New', width: widths.diffPercent },
  7: { name: 'v2/New', width: widths.diffPercent }
};
function diffText(elapsed, iA, iB) {
  const col = iB === 1 ? 4 : iB === 2 ? iA === 0 ? 6 : 7 : 0; // eslint-disable-line no-nested-ternary
  const a = elapsed[iA];
  const b = elapsed[iB];
  if (!(a && b)) return padLeft('', columns[col].width);
  const percent = Math.round((Math.max(a, b) / Math.min(a, b) - 1) * 100);
  const color = a < b ? colors.FgRed : colors.FgGreen;
  return color + padLeft(`${percent} %`, columns[col].width) + colors.Reset;
}
function elapsedText(elapsedArr, idx, iterations) {
  const col = idx === 0 ? 2 : idx === 1 ? 3 : 5; // eslint-disable-line no-nested-ternary
  let elapsed = Math.round(elapsedArr[idx] / iterations);
  let symbol = 'ns';
  if (elapsed > 1000) { elapsed /= 1000; symbol = 'µs'; }
  if (elapsed > 1000) { elapsed /= 1000; symbol = 'ms'; }
  elapsed = (Math.round((elapsed + 0.00001) * 10) / 10).toString();
  if (elapsed.indexOf('.') === -1) elapsed += '.0';
  return padLeft(`${elapsed} ${symbol}`, columns[col].width);
}
function padLeft(str, desiredLength, ch) {
  while ((str = str.toString()).length < desiredLength) str = (ch ? ch : ' ') + str;
  return str;
}
function padRight(str, desiredLength, ch) {
  while ((str = str.toString()).length < desiredLength) str += ch ? ch : ' ';
  return str;
}
function log(str, colorBefore = colors.Reset, colorAfter = colors.Reset) {
  console.log(colorBefore, str, colorAfter);
}

const tests = [
  { weight: 5,  parsers: [v1, v2, v2new], expr: "'asdfasdfasdf'" },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'true' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'false' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'null' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'undefined' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: '1234' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: '1234.5678' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: '3.345e10' },
  { weight: 10, parsers: [v1, v2, v2new], expr: 'foo' },
  { weight: 10, parsers: [v1, v2, v2new], expr: 'foobar' },
  { weight: 10, parsers: [v1, v2, v2new], expr: 'foo.bar' },
  { weight: 10, parsers: [v1, v2, v2new], expr: 'foobar1234' },
  { weight: 10, parsers: [v1, v2, v2new], expr: 'foobar.foobar' },
  { weight: 5,  parsers: [v1, v2, v2new], expr: 'foo.bar.baz' },
  { weight: 5,  parsers: [v1, v2, v2new], expr: 'fooBarBazQux' },
  { weight: 5,  parsers: [v1, v2, v2new], expr: 'fooBarBazQux.fooBarBazQux' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'fooBar.fooBar.fooBar3' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: '!!foo && !!bar ? baz : qux' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'foo === null || foo === undefined' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'foo / 100 + (bar * -baz) % 2' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: "foobar & someThing:'test'" },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'foo.bar | baz & qux:42' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: "foo | bar:a:'foo' & baz:a:b.c" },
  { weight: 5,  parsers: [v1, v2, v2new], expr: 'foo.bar' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'foo.bar.foo.bar' },
  { weight: 5,  parsers: [v1, v2, v2new], expr: 'handleEvent($event)' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'handleEvent({e: $event})' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: '$this.foo($parent.bar[$index])' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: '$parent.foo(bar[$index])' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'doStuff(foo, bar, baz)' },
  { weight: 5,  parsers: [v1, v2, v2new], expr: 'arr[i]' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: '[[[]],[[]],[[]]]' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'x?x:x?x:x?x:x?x:x' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: '{x:{x:{}},x:{x:{}}}' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'x||x&&x==x!=x<x>x<=x>=x+x-x*x%x/!x' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'x|x:x|x:x&x:x&x:x' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'x(x(x())(x(x())))(x(x()))' },
  { weight: 1,  parsers: [v1, v2, v2new], expr: 'a(b({a:b,c:d})[c({})[d({})]])' },
  { weight: 1,  parsers: [null, null, v2new], expr: 'ØÙçĊĎďĢģĤŌŸŹźǈǉǊǋǌǍǱǲʃʄʅʆʇᵴᵷᵹᵺᵻᵼᶦᶧ' }
];

const totalWidth = widths.weight + widths.expression + widths.executionTime * 3 + widths.diffPercent * 3;
const hr = padRight('', totalWidth, '-');
const header = hr + '\n '
  + padLeft('Execution time per parse', totalWidth) + '\n\n '
  + padRight(columns[0].name, widths.weight)
  + padRight(columns[1].name, widths.expression)
  + padLeft(columns[2].name, columns[2].width)
  + padLeft(columns[3].name, columns[3].width)
  + padLeft(columns[4].name, columns[4].width)
  + padLeft(columns[5].name, columns[5].width)
  + padLeft(columns[6].name, columns[6].width)
  + padLeft(columns[7].name, columns[7].width)
  + '\n ' + hr;

function run(iterations) {
  log(header);

  let parses = 0;
  const totalElapsed = new Uint32Array(3);
  for (let i = 0; i < tests.length; i++) {
    const { expr, parsers, weight } = tests[i];
    msg = weight > 1 ? colors.Bright : '';
    msg += padRight(weight, widths.weight);
    msg += padRight(expr, widths.expression) + colors.Reset;

    const elapsed = new Uint32Array(3);
    for (let j = 0; j < 3; j++) {
      const parser = parsers[j];
      if (!parser) {
        msg += padLeft('-', widths.executionTime);
        if (j === 1) msg += padLeft('', widths.diffPercent);
        continue;
      }

      const count = iterations * weight;
      let k = count;
      const start = process.hrtime();
      while (k--) {
        parser.parse(expr);
        parser.cache[expr] = null;
      }
      const end = process.hrtime(start);
      elapsed[j] = end[0] * 10e8 + end[1];
      if (j === 2 && elapsed[0] && elapsed[1] && elapsed[2]) {
        parses += count;
        totalElapsed[0] += elapsed[0];
        totalElapsed[1] += elapsed[1];
        totalElapsed[2] += elapsed[2];
      }
      msg += elapsedText(elapsed, j, count);

      if (j === 1) {
        msg += diffText(elapsed, 0, 1);
      } else if (j === 2) {
        msg += diffText(elapsed, 0, 2);
        msg += diffText(elapsed, 1, 2);
      }
    }

    log(msg);
  }
  log(hr);

  msg = colors.Bright + padRight(`Total execution time (${parses} parses)`, widths.weight + widths.expression);
  msg += elapsedText(totalElapsed, 0, 1);
  msg += elapsedText(totalElapsed, 1, 1);
  msg += diffText(totalElapsed, 0, 1);
  msg += colors.Bright + elapsedText(totalElapsed, 2, 1);
  msg += diffText(totalElapsed, 0, 2);
  msg += colors.Bright + diffText(totalElapsed, 1, 2);
  log(msg);
  log(hr);
}

run(10);
