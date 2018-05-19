import {Container} from 'aurelia-dependency-injection';
import {Parser} from '../src/parser';

describe('Unparser', () => {
  let parser;

  beforeAll(() => {
    let container = new Container();
    parser = container.get(Parser);
  });

  describe('should unparse', () => {
    const expressions = [
      'foo|bar:a|baz:b:c&bap:d&bop:e:f',
      'foo&bar:baz',
      'foo|bar:baz',
      'foo()',
      'foo(bar,baz)',
      'foo.bar.baz',
      `{'a':b,'c':d,'e':f}`,
      '[a,b,c]',
      'true',
      'false',
      'null',
      'undefined',
      '1234',
      '1234.5678',
      'foo.bar',
      '(!(!foo))&&(!(!bar))?baz:qux',
      'foo===null||foo===undefined',
      //'foo/100+(bar*-baz)%2', todo: this one fails with "Expected 'foo/100+bar*0-baz%2' to be 'foo/100+(bar*-baz)%2'"
      'foo($parent.bar[$index])',
      '$parent.foo(bar[$index])',
      '[[[]],[[]],[[]]]',
      '{\'x\':{\'x\':{}},\'x\':{\'x\':{}}}',
      'x(x(x())(x(x())))(x(x()))',
      'a(b({\'a\':b,\'c\':d})[c({})[d({})]])',
      'ØÙçĊĎďĢģĤŌŸŹźǈǉǊǋǌǍǱǲʃʄʅʆʇᵴᵷᵹᵺᵻᵼᶦᶧ',
      '(typeof foo)',
      '(void foo)',
      'foo in bar',
      'foo instanceof bar'
    ];

    for (const expr of expressions) {
      it(expr, () => {
        expect(parser.parse(expr).toString()).toBe(expr);
      });
    }
  });
});
