import './setup';
import {DOM} from 'aurelia-pal';
import {bindingMode} from '../src/binding-mode';
import {
  createElement,
  checkDelay,
  createObserverLocator,
  getBinding
} from './shared';
import {createScopeForTest} from '../src/scope';

describe('CheckedObserver', () => {
  var observerLocator;

  beforeAll(() => {
    observerLocator = createObserverLocator();
  });

  describe('checkbox - array of strings', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { selectedItems: [] };
      el = createElement('<input type="checkbox" value="A" />');
      observerLocator.getObserver(el, 'value');
      document.body.appendChild(el);
      binding = getBinding(observerLocator, obj, 'selectedItems', el, 'checked', bindingMode.twoWay).binding;
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.checked).toBe(false);
    });

    it('responds to model change', done => {
      obj.selectedItems.push('A');
      setTimeout(() => {
        expect(el.checked).toBe(true);
        done();
      }, 0);
    });

    it('responds to element value change', done => {
      expect(el.checked).toBe(true);
      el.__observers__.value.setValue('ZZZZ');
      setTimeout(() => {
        expect(el.checked).toBe(false);
        el.__observers__.value.setValue('A');
        setTimeout(() => {
          expect(el.checked).toBe(true);
          done();
        });
      }, 0);
    });

    it('responds to element change', done => {
      el.checked = false;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(obj.selectedItems.length).toBe(0);
        done();
      }, 0);
    });

    it('notifies', () => {
      let targetObserver = binding.targetObserver;
      let spy = jasmine.createSpy('callback');
      let oldValue = binding.targetObserver.getValue();
      let newValue = [];
      targetObserver.subscribe(spy);
      targetObserver.setValue(newValue);
      expect(spy).toHaveBeenCalledWith(newValue, oldValue);
    });

    it('unbinds', () => {
      var targetObserver = binding.targetObserver;
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('checkbox - array of objects', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { selectedItems: [], itemA: {} };
      el = createElement('<input type="checkbox" />');
      el.model = obj.itemA;
      observerLocator.getObserver(el, 'model');
      document.body.appendChild(el);
      binding = getBinding(observerLocator, obj, 'selectedItems', el, 'checked', bindingMode.twoWay).binding;
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.checked).toBe(false);
    });

    it('responds to model change', done => {
      obj.selectedItems.push(obj.itemA);
      setTimeout(() => {
        expect(el.checked).toBe(true);
        done();
      }, 0);
    });

    it('responds to element value change', done => {
      expect(el.checked).toBe(true);
      el.__observers__.model.setValue({});
      setTimeout(() => {
        expect(el.checked).toBe(false);
        el.__observers__.model.setValue(obj.itemA);
        setTimeout(() => {
          expect(el.checked).toBe(true);
          done();
        });
      }, 0);
    });

    it('responds to element change', done => {
      el.checked = false;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(obj.selectedItems.length).toBe(0);
        done();
      }, 0);
    });

    it('notifies', () => {
      let targetObserver = binding.targetObserver;
      let spy = jasmine.createSpy('callback');
      let oldValue = binding.targetObserver.getValue();
      let newValue = [];
      targetObserver.subscribe(spy);
      targetObserver.setValue(newValue);
      expect(spy).toHaveBeenCalledWith(newValue, oldValue);
    });

    it('unbinds', () => {
      var targetObserver = binding.targetObserver;
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('checkbox - array of objects with matcher', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { selectedItems: [], itemA: { foo: 'A' } };
      el = createElement('<input type="checkbox" />');
      el.model = obj.itemA;
      document.body.appendChild(el);
      binding = getBinding(observerLocator, obj, 'selectedItems', el, 'checked', bindingMode.twoWay).binding;
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      el.matcher = (a, b) => a.foo === b.foo;
      expect(el.checked).toBe(false);
    });

    it('responds to model change', done => {
      obj.selectedItems.push({ foo: 'A' });
      setTimeout(() => {
        expect(el.checked).toBe(true);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      el.checked = false;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(obj.selectedItems.length).toBe(0);
        done();
      }, 0);
    });

    it('notifies', () => {
      let targetObserver = binding.targetObserver;
      let spy = jasmine.createSpy('callback');
      let oldValue = binding.targetObserver.getValue();
      let newValue = [];
      targetObserver.subscribe(spy);
      targetObserver.setValue(newValue);
      expect(spy).toHaveBeenCalledWith(newValue, oldValue);
    });

    it('unbinds', () => {
      var targetObserver = binding.targetObserver;
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('checkbox - boolean', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { checked: false };
      el = createElement('<input type="checkbox" />');
      document.body.appendChild(el);
      binding = getBinding(observerLocator, obj, 'checked', el, 'checked', bindingMode.twoWay).binding;
    });

    it('binds', () => {
      binding.bind(createScopeForTest(obj));
      expect(el.checked).toBe(false);
    });

    it('responds to model change', done => {
      obj.checked = true;
      setTimeout(() => {
        expect(el.checked).toBe(true);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      el.checked = false;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(obj.checked).toBe(false);
        done();
      }, 0);
    });

    it('notifies', () => {
      let targetObserver = binding.targetObserver;
      let spy = jasmine.createSpy('callback');
      let oldValue = binding.targetObserver.getValue();
      let newValue = true;
      targetObserver.subscribe(spy);
      targetObserver.setValue(newValue);
      expect(spy).toHaveBeenCalledWith(newValue, oldValue);
    });

    it('unbinds', () => {
      var targetObserver = binding.targetObserver;
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('checkbox - late-bound value', () => {
    var obj, el, binding, binding2;

    beforeAll(() => {
      obj = { selectedItems: ['A'], value: 'A' };
      el = createElement('<input type="checkbox" />');
      document.body.appendChild(el);
      binding = getBinding(observerLocator, obj, 'selectedItems', el, 'checked', bindingMode.twoWay).binding;
      binding2 = getBinding(observerLocator, obj, 'value', el, 'value', bindingMode.oneWay).binding;
    });

    it('binds', done => {
      binding.bind(createScopeForTest(obj));
      binding2.bind(createScopeForTest(obj));
      expect(el.checked).toBe(false);
      setTimeout(() => {
        expect(el.checked).toBe(true);
        done();
      }, 100)
    });

    it('responds to model change', done => {
      obj.selectedItems.pop();
      setTimeout(() => {
        expect(el.checked).toBe(false);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      el.checked = true;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(obj.selectedItems.length).toBe(1);
        done();
      }, 0);
    });

    it('notifies', () => {
      let targetObserver = binding.targetObserver;
      let spy = jasmine.createSpy('callback');
      let oldValue = binding.targetObserver.getValue();
      let newValue = [];
      targetObserver.subscribe(spy);
      targetObserver.setValue(newValue);
      expect(spy).toHaveBeenCalledWith(newValue, oldValue);
    });

    it('unbinds', () => {
      var targetObserver = binding.targetObserver;
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
      binding2.unbind();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('radio - string', () => {
    var obj, radios, el;

    beforeAll(() => {
      obj = { value: 'B' };
      el = createElement(
        `<div>
          <input name="test" type="radio" value="A" />
          <input name="test" type="radio" value="B" />
          <input name="test" type="radio" value="C" />
        </div>`);
      document.body.appendChild(el);
      radios = [
        getBinding(observerLocator, obj, 'value', el.children.item(0), 'checked', bindingMode.twoWay),
        getBinding(observerLocator, obj, 'value', el.children.item(1), 'checked', bindingMode.twoWay),
        getBinding(observerLocator, obj, 'value', el.children.item(2), 'checked', bindingMode.twoWay)];
    });

    it('binds', () => {
      radios[0].binding.bind(createScopeForTest(obj));
      radios[1].binding.bind(createScopeForTest(obj));
      radios[2].binding.bind(createScopeForTest(obj));
      expect(radios[0].view.checked).toBe(false);
      expect(radios[1].view.checked).toBe(true);
      expect(radios[2].view.checked).toBe(false);
    });

    it('responds to model change', done => {
      obj.value = 'A'
      setTimeout(() => {
        expect(radios[0].view.checked).toBe(true);
        expect(radios[1].view.checked).toBe(false);
        expect(radios[2].view.checked).toBe(false);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      radios[2].view.checked = true;
      radios[2].view.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(radios[0].view.checked).toBe(false);
        expect(radios[1].view.checked).toBe(false);
        expect(radios[2].view.checked).toBe(true);
        expect(obj.value).toBe('C');
        done();
      }, 0);
    });

    it('unbinds', () => {
      var i = radios.length;
      while(i--) {
        spyOn(radios[i].targetObserver, 'unbind').and.callThrough();
        radios[i].binding.unbind();
        expect(radios[i].targetObserver.unbind).toHaveBeenCalled();
      }
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('radio - non-string', () => {
    var obj, radios, el;

    beforeAll(() => {
      obj = { value: false };
      el = createElement(
        `<div>
          <input name="test" type="radio" />
          <input name="test" type="radio" />
          <input name="test" type="radio" />
        </div>`);
      document.body.appendChild(el);
      el.children.item(0).model = null;
      el.children.item(1).model = false;
      el.children.item(2).model = true;
      radios = [
        getBinding(observerLocator, obj, 'value', el.children.item(0), 'checked', bindingMode.twoWay),
        getBinding(observerLocator, obj, 'value', el.children.item(1), 'checked', bindingMode.twoWay),
        getBinding(observerLocator, obj, 'value', el.children.item(2), 'checked', bindingMode.twoWay)];
    });

    it('binds', () => {
      radios[0].binding.bind(createScopeForTest(obj));
      radios[1].binding.bind(createScopeForTest(obj));
      radios[2].binding.bind(createScopeForTest(obj));
      expect(radios[0].view.checked).toBe(false);
      expect(radios[1].view.checked).toBe(true);
      expect(radios[2].view.checked).toBe(false);
    });

    it('responds to model change', done => {
      obj.value = null;
      setTimeout(() => {
        expect(radios[0].view.checked).toBe(true);
        expect(radios[1].view.checked).toBe(false);
        expect(radios[2].view.checked).toBe(false);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      radios[2].view.checked = true;
      radios[2].view.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(radios[0].view.checked).toBe(false);
        expect(radios[1].view.checked).toBe(false);
        expect(radios[2].view.checked).toBe(true);
        expect(obj.value).toBe(true);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var i = radios.length;
      while(i--) {
        spyOn(radios[i].targetObserver, 'unbind').and.callThrough();
        radios[i].binding.unbind();
        expect(radios[i].targetObserver.unbind).toHaveBeenCalled();
      }
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('radio - objects with matcher', () => {
    var obj, radios, el;

    beforeAll(() => {
      obj = { value: { foo: 'B' } };
      el = createElement(
        `<div>
          <input name="test" type="radio" />
          <input name="test" type="radio" />
          <input name="test" type="radio" />
        </div>`);
      document.body.appendChild(el);
      el.children.item(0).model = { foo: 'A' };
      el.children.item(1).model = { foo: 'B' };
      el.children.item(2).model = { foo: 'C' };
      radios = [
        getBinding(observerLocator, obj, 'value', el.children.item(0), 'checked', bindingMode.twoWay),
        getBinding(observerLocator, obj, 'value', el.children.item(1), 'checked', bindingMode.twoWay),
        getBinding(observerLocator, obj, 'value', el.children.item(2), 'checked', bindingMode.twoWay)];
    });

    it('binds', done => {
      radios[0].binding.bind(createScopeForTest(obj));
      radios[1].binding.bind(createScopeForTest(obj));
      radios[2].binding.bind(createScopeForTest(obj));
      let matcher = (a, b) => a.foo === b.foo;
      el.children.item(0).matcher = matcher;
      el.children.item(1).matcher = matcher;
      el.children.item(2).matcher = matcher;
      setTimeout(() => {
        expect(radios[0].view.checked).toBe(false);
        expect(radios[1].view.checked).toBe(true);
        expect(radios[2].view.checked).toBe(false);
        done();
      });
    });

    it('responds to model change', done => {
      obj.value = { foo: 'A' };
      setTimeout(() => {
        expect(radios[0].view.checked).toBe(true);
        expect(radios[1].view.checked).toBe(false);
        expect(radios[2].view.checked).toBe(false);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      radios[2].view.checked = true;
      radios[2].view.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(radios[0].view.checked).toBe(false);
        expect(radios[1].view.checked).toBe(false);
        expect(radios[2].view.checked).toBe(true);
        expect(obj.value).toBe(radios[2].view.model);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var i = radios.length;
      while(i--) {
        spyOn(radios[i].targetObserver, 'unbind').and.callThrough();
        radios[i].binding.unbind();
        expect(radios[i].targetObserver.unbind).toHaveBeenCalled();
      }
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });
});
