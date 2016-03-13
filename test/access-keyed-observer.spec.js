import './setup';
import {DOM} from 'aurelia-pal';
import {Container} from 'aurelia-dependency-injection';
import {bindingMode} from '../src/binding-mode';
import {createObserverLocator} from './shared';
import {createScopeForTest} from '../src/scope';
import {BindingEngine} from '../src/binding-engine';

describe('AccessKeyedObserver', () => {
  let engine, checkDelay;

  beforeAll(() => {
    let container = new Container();
    createObserverLocator(container);
    engine = container.get(BindingEngine);
    checkDelay = engine.observerLocator.dirtyChecker.checkDelay;
  });

  describe('object property, key property', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { record: { person: { first: 'John', last: 'Doe' } }, key: 'first' };
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', 'record.person[key]', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe(obj.record.person[obj.key]);
    });

    it('responds to property change', done => {
      obj.record.person[obj.key] = 'Jeremy';
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key]);
        done();
      }, checkDelay * 2);
    });

    it('responds to object change', done => {
      obj.record.person = { first: 'Johnny', last: 'Trejo' };
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key]);
        done();
      }, checkDelay * 2);
    });

    it('responds to path change', done => {
      obj.record = { person: { first: 'Donald', last: 'Draper' } };
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key]);
        done();
      }, checkDelay * 2);
    });

    it('responds to key change', done => {
      obj.key = 'last';
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key]);
        done();
      }, checkDelay * 2);
    });

    it('responds to element change', done => {
      el.value = 'Jake';
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key]);
        done();
      }, checkDelay * 2);
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('object property, key property 2', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { record: { person: { first: { value: 'John', lastUpdated: new Date() }, last: { value: 'Doe', lastUpdated: new Date() } } }, key: 'first' };
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', 'record.person[key].value', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe(obj.record.person[obj.key].value);
    });

    it('responds to property change', done => {
      obj.record.person[obj.key].value = 'Jeremy';
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key].value);
        done();
      }, checkDelay * 2);
    });

    it('responds to object change', done => {
      obj.record.person = { first: { value: 'Johnny', lastUpdated: new Date() }, last:{ value: 'Trejo', lastUpdated: new Date() } };
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key].value);
        done();
      }, checkDelay * 2);
    });

    it('responds to path change', done => {
      obj.record = { person: { first: { value: 'Vincent', lastUpdated: new Date() }, last:{ value: 'Chase', lastUpdated: new Date() } } };
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key].value);
        done();
      }, checkDelay * 2);
    });

    it('responds to key change', done => {
      obj.key = 'last';
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key].value);
        done();
      }, checkDelay * 2);
    });

    it('responds to element change', done => {
      el.value = 'Jake';
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(el.value).toBe(obj.record.person[obj.key].value);
        done();
      }, checkDelay * 2);
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('object literal, key property', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { key: 'first' };
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', '{ first: \'John\', last: \'Doe\' }[key]', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe('John');
    });

    it('responds to key change', done => {
      obj.key = 'last';
      setTimeout(() => {
        expect(el.value).toBe('Doe');
        done();
      }, checkDelay * 2);
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('object property, key literal', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { person: { first: 'John', last: 'Doe' } };
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', 'person[\'first\']', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe(obj.person['first']);
    });

    it('responds to property change', done => {
      obj.person[obj.key] = 'Jeremy';
      setTimeout(() => {
        expect(el.value).toBe(obj.person['first']);
        done();
        }, checkDelay * 2);
    });

    it('responds to object change', done => {
      obj.person = { first: 'Johnny', last: 'Trejo' };
      setTimeout(() => {
        expect(el.value).toBe(obj.person['first']);
        done();
        }, checkDelay * 2);
    });

    it('responds to element change', done => {
      el.value = 'Jake';
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(el.value).toBe(obj.person['first']);
        done();
        }, checkDelay * 2);
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('object literal, key literal', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = {};
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', '{ first: \'John\', last: \'Doe\' }[\'first\']', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe('John');
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('array property, numeric key property', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { array: ['a', 'b', 'c'], key: 1 };
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', 'array[key]', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe(obj.array[obj.key]);
    });

    it('does not respond to property change', done => {
      let original = el.value;
      obj.array[obj.key] = 'foo';
      setTimeout(() => {
        expect(el.value).toBe(original);
        done();
        }, checkDelay * 2);
    });

    it('responds to array change', done => {
      obj.array = ['x', 'y', 'z']
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('responds to key change', done => {
      obj.key = 2;
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('responds to out of bounds key change', done => {
      obj.key = 99;
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        obj.key = 1;
        done();
        }, checkDelay * 2);
    });

    it('responds to element change', done => {
      el.value = 'bar';
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('array property, string key property', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { array: ['a', 'b', 'c'], key: '1' };
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', 'array[key]', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe(obj.array[obj.key]);
    });

    it('responds to property change', done => {
      obj.array[obj.key] = 'foo';
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('responds to array change', done => {
      obj.array = ['x', 'y', 'z']
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('responds to key change', done => {
      obj.key = '2';
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('responds to out of bounds key change', done => {
      obj.key = '99';
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        obj.key = '1';
        done();
        }, checkDelay * 2);
    });

    it('responds to element change', done => {
      el.value = 'bar';
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('array property, numeric key literal', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { array: ['a', 'b', 'c'], key: 1 };
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', 'array[1]', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe(obj.array[obj.key]);
    });

    it('does not respond to property change', done => {
      let original = el.value;
      obj.array[obj.key] = 'foo';
      setTimeout(() => {
        expect(el.value).toBe(original);
        done();
        }, checkDelay * 2);
    });

    it('responds to array change', done => {
      obj.array = ['x', 'y', 'z']
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('responds to element change', done => {
      el.value = 'bar';
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(el.value).toBe(obj.array[obj.key]);
        done();
        }, checkDelay * 2);
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('array literal, numeric key property', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { key: 1 };
      el = DOM.createElement('input');
      document.body.appendChild(el);
      binding = engine.createBindingExpression('value', '[\'a\', \'b\', \'c\'][key]', bindingMode.twoWay).createBinding(el);
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.value).toBe('b');
    });

    it('responds to key change', done => {
      obj.key = 2;
      setTimeout(() => {
        expect(el.value).toBe('c');
        done();
        }, checkDelay * 2);
    });

    it('responds to out of bounds key change', done => {
      obj.key = 99;
      setTimeout(() => {
        expect(el.value).toBe('');
        obj.key = 1;
        done();
        }, checkDelay * 2);
    });

    it('unbinds', () => {
      binding.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });
});
