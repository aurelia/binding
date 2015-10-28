import {bindingMode} from '../src/binding-mode';
import {
  createElement,
  fireEvent,
  checkDelay,
  createObserverLocator,
  getBinding
} from './shared';
import {initialize} from 'aurelia-pal-browser';
import {createScopeForTest} from '../src/scope';

describe('CheckedObserver', () => {
  var observerLocator;

  beforeAll(() => {
    initialize();
    observerLocator = createObserverLocator();
  });

  describe('checkbox - array of strings', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { selectedItems: [] };
      el = createElement('<input type="checkbox" value="A" />');
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

    it('responds to element change', done => {
      el.checked = false;
      fireEvent(el, 'change');
      setTimeout(() => {
        expect(obj.selectedItems.length).toBe(0);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetProperty.unbind).toHaveBeenCalled();
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

    it('responds to element change', done => {
      el.checked = false;
      fireEvent(el, 'change');
      setTimeout(() => {
        expect(obj.selectedItems.length).toBe(0);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetProperty.unbind).toHaveBeenCalled();
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
      fireEvent(el, 'change');
      setTimeout(() => {
        expect(obj.checked).toBe(false);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetProperty.unbind).toHaveBeenCalled();
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
      fireEvent(el, 'change');
      setTimeout(() => {
        expect(obj.selectedItems.length).toBe(1);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetProperty.unbind).toHaveBeenCalled();
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
      fireEvent(radios[2].view, 'change');
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
        spyOn(radios[i].targetProperty, 'unbind').and.callThrough();
        radios[i].binding.unbind();
        expect(radios[i].targetProperty.unbind).toHaveBeenCalled();
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
      fireEvent(radios[2].view, 'change');
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
        spyOn(radios[i].targetProperty, 'unbind').and.callThrough();
        radios[i].binding.unbind();
        expect(radios[i].targetProperty.unbind).toHaveBeenCalled();
      }
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });
});
