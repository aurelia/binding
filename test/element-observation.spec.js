import './setup';
import {SetterObserver} from '../src/property-observation';
import {DirtyCheckProperty} from '../src/dirty-checking';
import {
  ValueAttributeObserver,
  XLinkAttributeObserver,
  DataAttributeObserver,
  StyleObserver
} from '../src/element-observation';
import {
  createElement,
  checkDelay,
  createObserverLocator,
  executeSharedPropertyObserverTests
} from './shared';

function createSvgUseElement() {
  var html = [
    '<svg>',
    '  <defs>',
    '    <g id="shape1">',
    '      <rect x="50" y="50" width="50" height="50" />',
    '    </g>',
    '    <g id="shape2">',
    '      <circle cx="50" cy="50" r="50" />',
    '    </g>',
    '  </defs>',
    '  <use xlink:href="#shape1" x="50" y="50" foo:bar="baz" />',
    '</svg>'].join('\n');
  return createElement(html).lastElementChild;
}

describe('element observation', () => {
  var locator;
  beforeAll(() => {
    locator = createObserverLocator();
  });

  it('observes xlink namespaced attributes', () => {
    var el = createSvgUseElement(),
        observer = locator.getObserver(el, 'xlink:href');
    expect(observer instanceof XLinkAttributeObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of a "use" element\'s "xlink:href" property is not supported.'));
    expect(observer.getValue()).toBe('#shape1');
    observer.setValue('#shape2');
    expect(observer.getValue()).toBe('#shape2');
  });

  it('observes non-xlink namespaced attributes', () => {
    var el = createSvgUseElement(),
        observer = locator.getObserver(el, 'foo:bar');
    expect(observer instanceof DataAttributeObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of a "use" element\'s "foo:bar" property is not supported.'));
    expect(observer.getValue()).toBe('baz');
    observer.setValue('qux');
    expect(observer.getValue()).toBe('qux');
  });

  it('observes data-* attributes on Elements', () => {
    var el = createElement('<h1 data-foo="bar"></h1>'),
        observer = locator.getObserver(el, 'data-foo');
    expect(observer instanceof DataAttributeObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of a "H1" element\'s "data-foo" property is not supported.'));
    expect(observer.getValue()).toBe('bar');
    observer.setValue('baz');
    expect(observer.getValue()).toBe('baz');
  });

  it('observes aria-* attributes on Elements', () => {
    var el = createElement('<h1 aria-hidden="true"></h1>'),
        observer = locator.getObserver(el, 'aria-hidden');
    expect(observer instanceof DataAttributeObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of a "H1" element\'s "aria-hidden" property is not supported.'));
    expect(observer.getValue()).toBe('true');
    observer.setValue('false');
    expect(observer.getValue()).toBe('false');
  });

  it('observes data-* attributes on SVGElements', () => {
    var el = createElement('<svg data-foo="bar"></svg>'),
        observer = locator.getObserver(el, 'data-foo');
    expect(observer instanceof DataAttributeObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of a "svg" element\'s "data-foo" property is not supported.'));
    expect(observer.getValue()).toBe('bar');
    observer.setValue('baz');
    expect(observer.getValue()).toBe('baz');
  });

  it('observes aria-* attributes on SVGElements', () => {
    var el = createElement('<svg aria-hidden="true"></svg>'),
        observer = locator.getObserver(el, 'aria-hidden');
    expect(observer instanceof DataAttributeObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of a "svg" element\'s "aria-hidden" property is not supported.'));
    expect(observer.getValue()).toBe('true');
    observer.setValue('false');
    expect(observer.getValue()).toBe('false');
  });

  it('value attributes', (done) => {
    var cases = [
        { tag: '<input type="text" value="foo" />', attr: 'value', old: 'foo', new: 'bar' },
        { tag: '<input type="text" value="foo" />', attr: 'value', old: 'foo', new: undefined, expected: '' },
        { tag: '<input type="text" value="foo" />', attr: 'value', old: 'foo', new: null, expected: '' },

        { tag: '<textarea>foo</textarea>', attr: 'value', old: 'foo', new: 'bar' },
        { tag: '<textarea>foo</textarea>', attr: 'value', old: 'foo', new: undefined, expected: '' },
        { tag: '<textarea>foo</textarea>', attr: 'value', old: 'foo', new: null, expected: '' },
      ],
      remaining = cases.length;
    cases.forEach(test => {
      var el = createElement(test.tag),
          observer = locator.getObserver(el, test.attr),
          callback = jasmine.createSpy('callback'),
          expected = test.hasOwnProperty('expected') ? test.expected : test.new;
      observer.subscribe(callback);
      expect(observer instanceof ValueAttributeObserver).toBe(true);
      expect(observer.getValue()).toBe(test.old);
      observer.setValue(test.new);
      expect(observer.getValue()).toBe(expected);
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(expected, test.old);
        observer.unsubscribe(callback);
        remaining--;
        if (remaining === 0) {
          done();
        }
      }, 0);
    });
  });

  it('native properties of Elements and SVGElements', () => {
    var cases = [
      { tag: '<input type="text" />', attr: 'type', old: 'text', new: 'checkbox' },
      { tag: '<input id="foo" />', attr: 'id', old: 'foo', new: 'bar' },
      { tag: '<svg width="100"></svg>', attr: 'width', old: '100', new: '200' },
      { tag: '<svg viewBox="0 0 100 100"></svg>', attr: 'viewBox', old: '0 0 100 100', new: '0 0 200 200' },
    ];
    cases.forEach(test => {
      var el = createElement(test.tag),
          observer = locator.getObserver(el, test.attr);
      expect(observer instanceof DirtyCheckProperty || observer instanceof DataAttributeObserver).toBe(true);
      expect(observer.getValue()).toBe(test.old);
      observer.setValue(test.new);
      expect(observer.getValue()).toBe(test.new);
    });
  });

  it('style attribute', () => {
    var el = createElement('<div></div>'),
        attrs = ['style', 'css'],
        i, observer;

    for(i = 0; i < attrs.length; i++) {
      observer = locator.getObserver(el, attrs[i]);
      expect(observer instanceof StyleObserver).toBe(true);
      expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of a "DIV" element\'s "' + attrs[i] + '" property is not supported.'));

      observer.setValue(' 	  width : 30px;height:20px; background-color	: red;background-image: url("http://aurelia.io/test.png"); 	 ');
      expect(observer.getValue()).toBe('width: 30px; height: 20px; background-image: url("http://aurelia.io/test.png"); background-color: red;');
      expect(el.style.height).toBe('20px');
      expect(el.style.width).toBe('30px');
      expect(el.style.backgroundColor).toBe('red');
      expect(el.style.backgroundImage).toBe('url("http://aurelia.io/test.png")');

      observer.setValue('');
      expect(el.style.height).toBe('');
      expect(el.style.width).toBe('');
      expect(el.style.backgroundColor).toBe('');
      expect(el.style.backgroundImage).toBe('');

      observer.setValue({ width: '50px', height: '40px', 'background-color': 'blue', 'background-image': 'url("http://aurelia.io/test2.png")' });
      expect(observer.getValue()).toBe('width: 50px; height: 40px; background-image: url("http://aurelia.io/test2.png"); background-color: blue;');
      expect(el.style.height).toBe('40px');
      expect(el.style.width).toBe('50px');
      expect(el.style.backgroundColor).toBe('blue');
      expect(el.style.backgroundImage).toBe('url("http://aurelia.io/test2.png")')

      observer.setValue({});
      expect(el.style.height).toBe('');
      expect(el.style.width).toBe('');
      expect(el.style.backgroundColor).toBe('');
      expect(el.style.backgroundImage).toBe('');
    }
  });

  describe('ad-hoc properites on Elements', () => {
    var obj, observer;

    beforeAll(() => {
      var locator = createObserverLocator();
      obj = createElement('<foobar></foobar>');
      obj.foo = 'bar';
      observer = locator.getObserver(obj, 'foo');
    });

    it('should be a SetterObserver', () => {
      expect(observer instanceof SetterObserver).toBe(true);
    });

    it('implements the property observer api', done => {
      executeSharedPropertyObserverTests(obj, observer, done);
    });
  });
});
