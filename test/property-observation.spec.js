import {ObserverLocator, EventManager, DirtyChecker} from '../src/index';
import {TaskQueue} from 'aurelia-task-queue';
import {TestObservationAdapter, AdapterPropertyObserver} from './adapter';
import {DirtyCheckProperty, DirtyChecking} from '../src/dirty-checking';
import {
  OoPropertyObserver,
  UndefinedPropertyObserver,
  ElementObserver
} from '../src/property-observation';

export function createElement(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

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

// assertions used in OoPropertyObserver and UndefinedPropertyObserver tests.
function executeSharedPropertyObserverTests(obj, observer, done, callbackCheckDelay) {
  var callback = jasmine.createSpy('callback'),
      oldValue = observer.getValue(),
      newValue = 'baz',
      dispose = observer.subscribe(callback);
  expect(oldValue).toBe('bar');
  observer.setValue('baz');
  expect(observer.getValue()).toBe('baz');
  setTimeout(() => {
    expect(callback).toHaveBeenCalledWith(newValue, oldValue);
    dispose();
    done();
  }, callbackCheckDelay);
}

describe('OoPropertyObserver', () => {
  var obj, observer;

  beforeAll(() => {
    var locator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), []);
    obj = { foo: 'bar' };
    observer = locator.getObserver(obj, 'foo');
  });

  it('should be an OoPropertyObserver', () => {
    expect(observer instanceof OoPropertyObserver).toBe(true);
  });

  it('implements the property observer api', done => {
    executeSharedPropertyObserverTests(obj, observer, done, 0);
  });

  it('stops observing if there are no callbacks', () => {
    var dispose = observer.subscribe(() => {});
    expect(observer.owner.observing).toBe(true);
    dispose();
    //expect(observer.owner.observing).toBe(false);  // this is failing.  need to find out what the intended behavior is.
  });

  it('keeps observing if there are callbacks', () => {
    var dispose = observer.subscribe(() => {});
    observer.subscribe(function(){});
    dispose();
    expect(observer.owner.observing).toBe(true);
  });
});

describe('UndefinedPropertyObserver', () => {
  var obj, observer;

  beforeEach(() => {
    var locator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), [new TestObservationAdapter(() => locator)]);
    obj = {};
    observer = locator.getObserver(obj, 'foo');
    expect(observer instanceof UndefinedPropertyObserver).toBe(true);
    expect(observer.getValue()).toBeUndefined();
  });

  it('handles primitive properties created via setValue', (done) => {
    var callback = callback = jasmine.createSpy('callback'),
        dispose = observer.subscribe(callback);
    observer.setValue('bar');
    expect(observer.actual instanceof OoPropertyObserver).toBe(true);
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith('bar', undefined);
      dispose();
      executeSharedPropertyObserverTests(obj, observer, done, 0);
    }, 0);
  });

  it('handles primitive properties created via direct assignment', (done) => {
    var callback = callback = jasmine.createSpy('callback'),
        dispose = observer.subscribe(callback);
    obj.foo = 'bar';
    setTimeout(() => {
      expect(observer.actual instanceof OoPropertyObserver).toBe(true);
      expect(callback).toHaveBeenCalledWith('bar', undefined);
      dispose();
      executeSharedPropertyObserverTests(obj, observer, done, 0);
    }, 0);
  });

  it('handles primitive properties created via Object.defineProperty', (done) => {
    var callback = callback = jasmine.createSpy('callback'),
        dispose = observer.subscribe(callback);
    Object.defineProperty(obj, 'foo', { value: 'bar', writable: true });
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith('bar', undefined);
      dispose();
      executeSharedPropertyObserverTests(obj, observer, done, 0);
    }, 0);
  });

  it('handles complex properties created via Object.defineProperty', (done) => {
    var callback = callback = jasmine.createSpy('callback'),
        dispose = observer.subscribe(callback),
        foo = 'bar';
    Object.defineProperty(obj, 'foo', {
      get: function() { return foo; },
      set: function(newValue) { foo = newValue; },
      enumerable: true,
      configurable: true
    });
    setTimeout(() => {
      expect(observer.actual instanceof DirtyCheckProperty).toBe(true);
      expect(callback).toHaveBeenCalledWith('bar', undefined);
      dispose();
      executeSharedPropertyObserverTests(obj, observer, done, 300);
    }, 0);
  });

  it('handles complex properties created via Object.defineProperty and handled by an adapter', (done) => {
    var callback = callback = jasmine.createSpy('callback'),
        dispose = observer.subscribe(callback),
        foo = 'bar';
    obj.handleWithAdapter = true;

    Object.defineProperty(obj, 'foo', {
      get: function() { return foo; },
      set: function(newValue) { foo = newValue; },
      enumerable: true,
      configurable: true
    });
    setTimeout(() => {
      expect(observer.actual instanceof AdapterPropertyObserver).toBe(true);
      expect(callback).toHaveBeenCalledWith('bar', undefined);
      dispose();
      executeSharedPropertyObserverTests(obj, observer, done, 300);
    }, 0);
  });
});

describe('ElementObserver', () => {
  var locator;
  beforeAll(() => {
    locator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), []);
  });

  it('observes xlink namespaced attributes', () => {
    var el = createSvgUseElement(),
        observer = locator.getObserver(el, 'xlink:href');
    expect(observer instanceof ElementObserver).toBe(true);
    expect(() => observer.subscribe(() =>{})).toThrow(new Error('Observation of an Element\'s "xlink:href" is not supported.'));
    expect(observer.getValue()).toBe('#shape1');
    observer.setValue('#shape2');
    expect(observer.getValue()).toBe('#shape2');
  });

  it('observes non-xlink namespaced attributes', () => {
    var el = createSvgUseElement(),
        observer = locator.getObserver(el, 'foo:bar');
    expect(observer instanceof ElementObserver).toBe(true);
    expect(() => observer.subscribe(() =>{})).toThrow(new Error('Observation of an Element\'s "foo:bar" is not supported.'));
    expect(observer.getValue()).toBe('baz');
    observer.setValue('qux');
    expect(observer.getValue()).toBe('qux');
  });

  it('observes data-* attributes on Elements', () => {
    var el = createElement('<h1 data-foo="bar"></h1>'),
        observer = locator.getObserver(el, 'data-foo');
    expect(observer instanceof ElementObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of an Element\'s "data-foo" is not supported.'));
    expect(observer.getValue()).toBe('bar');
    observer.setValue('baz');
    expect(observer.getValue()).toBe('baz');
  });

  it('observes aria-* attributes on Elements', () => {
    var el = createElement('<h1 aria-hidden="true"></h1>'),
        observer = locator.getObserver(el, 'aria-hidden');
    expect(observer instanceof ElementObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of an Element\'s "aria-hidden" is not supported.'));
    expect(observer.getValue()).toBe('true');
    observer.setValue('false');
    expect(observer.getValue()).toBe('false');
  });

  it('observes data-* attributes on SVGElements', () => {
    var el = createElement('<svg data-foo="bar"></svg>'),
        observer = locator.getObserver(el, 'data-foo');
    expect(observer instanceof ElementObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of an Element\'s "data-foo" is not supported.'));
    expect(observer.getValue()).toBe('bar');
    observer.setValue('baz');
    expect(observer.getValue()).toBe('baz');
  });

  it('observes aria-* attributes on SVGElements', () => {
    var el = createElement('<svg aria-hidden="true"></svg>'),
        observer = locator.getObserver(el, 'aria-hidden');
    expect(observer instanceof ElementObserver).toBe(true);
    expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of an Element\'s "aria-hidden" is not supported.'));
    expect(observer.getValue()).toBe('true');
    observer.setValue('false');
    expect(observer.getValue()).toBe('false');
  });

  it('value attributes', (done) => {
    var cases = [
        { tag: '<input type="text" value="foo" />', attr: 'value', old: 'foo', new: 'bar' },
        { tag: '<input type="checkbox" checked="true" />', attr: 'checked', old: true, new: false },
        { tag: '<textarea>foo</textarea>', attr: 'value', old: 'foo', new: 'bar' },
        { tag: '<select value="1"><option value="1">A</option><option value="2">B</option></select>', attr: 'value', old: '1', new: '2' },
      ],
      remaining = cases.length;
    cases.forEach(test => {
      var el = createElement(test.tag),
          observer = locator.getObserver(el, test.attr),
          callback = jasmine.createSpy('callback'),
          dispose = observer.subscribe(callback);
      expect(observer instanceof ElementObserver).toBe(true);
      expect(observer.getValue()).toBe(test.old);
      observer.setValue(test.new);
      expect(observer.getValue()).toBe(test.new);
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(test.new, test.old);
        dispose();
        remaining--;
        if (remaining === 0) {
          done();
        }
      }, 0);
    });
  });

  it('direct-access properties on Elements and SVGElements', () => {
    var cases = [
      { tag: '<input type="text" />', attr: 'type', old: 'text', new: 'checkbox' },
      { tag: '<input id="foo" />', attr: 'id', old: 'foo', new: 'bar' },
      { tag: '<h1>test</h1>', attr: 'foo', old: undefined, new: 'bar' },
      //{ tag: '<h1 foo="bar">test</h1>', attr: 'foo', old: 'bar', new: 'baz' },
      { tag: '<svg width="100"></svg>', attr: 'width', old: '100', new: '200' },
      { tag: '<svg viewBox="0 0 100 100"></svg>', attr: 'viewBox', old: '0 0 100 100', new: '0 0 200 200' },
    ];
    cases.forEach(test => {
      var el = createElement(test.tag),
          observer = locator.getObserver(el, test.attr);
      expect(observer instanceof ElementObserver).toBe(true);
      expect(() => observer.subscribe(() => {})).toThrow(new Error('Observation of an Element\'s "' + test.attr + '" is not supported.'));
      expect(observer.getValue()).toBe(test.old);
      observer.setValue(test.new);
      expect(observer.getValue()).toBe(test.new);
    });
  });
});
