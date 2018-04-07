import './setup';
import { DOM } from 'aurelia-pal';
import { bindingMode } from '../src/binding-mode';
import { createElement, checkDelay, createObserverLocator, getBinding } from './shared';
import { createScopeForTest } from '../src/scope';

describe('SelectValueObserver', () => {
  var observerLocator;

  beforeAll(() => {
    observerLocator = createObserverLocator();
  });

  function getElementValue (element) {
    var options = element.options, option, i, ii, count = 0, value = [];

    for (i = 0, ii = options.length; i < ii; i++) {
      option = options.item(i);
      if (!option.selected) {
        continue;
      }
      value[count] = option.hasOwnProperty('model') ? option.model : option.value;
      count++;
    }

    if (!element.multiple) {
      if (count === 0) {
        value = null;
      } else {
        value = value[0];
      }
    }
    return value;
  }

  describe('single-select strings', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { selectedItem: 'B' };
      el = createElement(
        `<select>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>`);
      document.body.appendChild(el);
      binding = getBinding(observerLocator, obj, 'selectedItem', el, 'value', bindingMode.twoWay).binding;
    });

    it('binds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'bind').and.callThrough();
      binding.bind(createScopeForTest(obj));
      expect(targetObserver.bind).toHaveBeenCalled();
      expect(el.value).toBe(obj.selectedItem);
    });

    it('responds to model change', done => {
      obj.selectedItem = 'C';
      setTimeout(() => {
        expect(el.value).toBe(obj.selectedItem);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      el.value = 'A';
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(el.value).toBe(obj.selectedItem);
        done();
      }, 0);
    });

    it('responds to options change', done => {
      var option = document.createElement('option');
      option.value = option.text = 'D';
      obj.selectedItem = 'D';
      el.appendChild(option);
      setTimeout(() => {
        expect(el.value).toBe(obj.selectedItem);
        el.innerHTML =
          `<option value="X">X</option>
          <option value="Y">Y</option>
          <option value="Z">Z</option>`;
        setTimeout(() => {
          expect(el.value).toBe('X');
          expect(el.value).toBe(obj.selectedItem);
          done();
        });
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
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('multi-select strings', () => {
    var obj, el, binding, elementValueProperty;
    beforeAll(() => {
      var info;
      obj = { selectedItems: ['B', 'C'] };
      el = createElement(
        `<select multiple>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>`);
      document.body.appendChild(el);
      info = getBinding(observerLocator, obj, 'selectedItems', el, 'value', bindingMode.twoWay);
      binding = info.binding;
      elementValueProperty = info.targetObserver;
    });

    it('binds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'bind').and.callThrough();
      binding.bind(createScopeForTest(obj));
      expect(targetObserver.bind).toHaveBeenCalled();
      expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
      expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
    });

    it('responds to model change', done => {
      obj.selectedItems = ['A'];
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('responds to model mutate', done => {
      obj.selectedItems.pop();
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        obj.selectedItems.push('B');
        setTimeout(() => {
          expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
          expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
          done();
        }, 0);
      }, 0);
    });

    it('responds to element change', done => {
      el.options.item(1).selected = true;
      el.options.item(2).selected = true;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('responds to options change', done => {
      var option = document.createElement('option');
      option.value = option.text = 'D';
      obj.selectedItems = ['D'];
      el.appendChild(option);
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('single-select objects', () => {
    var obj, el, binding, elementValueProperty;
    beforeAll(() => {
      var option, info;
      el = createElement('<select></select>');
      option = document.createElement('option');
      option.text = 'A';
      option.model = { foo: 'A' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'B';
      option.model = { foo: 'B' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'C';
      option.model = { foo: 'C' };
      el.appendChild(option);
      document.body.appendChild(el);
      obj = { selectedItem: el.options.item(2).model };

      info = getBinding(observerLocator, obj, 'selectedItem', el, 'value', bindingMode.twoWay);
      binding = info.binding;
      elementValueProperty = info.targetObserver;
    });

    it('binds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'bind').and.callThrough();
      binding.bind(createScopeForTest(obj));
      expect(targetObserver.bind).toHaveBeenCalled();
      expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
      expect(getElementValue(el)).toEqual(obj.selectedItem);
    });

    it('responds to model change', done => {
      obj.selectedItem = el.options.item(0).model;
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      el.options.item(0).selected = false;
      el.options.item(1).selected = true;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('responds to options change', done => {
      var option = document.createElement('option');
      option.text = 'D';
      option.model = { foo: 'D' };
      obj.selectedItem = option.model;
      el.appendChild(option);
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('single-select objects with null', () => {
    var obj, el, binding, elementValueProperty;
    beforeAll(() => {
      var option, info;
      el = createElement('<select></select>');
      option = document.createElement('option');
      option.text = 'A';
      option.model = { foo: 'A' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'B';
      option.model = { foo: 'B' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'C';
      option.model = null;
      el.appendChild(option);
      document.body.appendChild(el);
      obj = { selectedItem: el.options.item(2).model };

      info = getBinding(observerLocator, obj, 'selectedItem', el, 'value', bindingMode.twoWay);
      binding = info.binding;
      elementValueProperty = info.targetObserver;
    });

    it('binds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'bind').and.callThrough();
      binding.bind(createScopeForTest(obj));
      expect(targetObserver.bind).toHaveBeenCalled();
      expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
      expect(getElementValue(el)).toEqual(obj.selectedItem);
    });

    it('responds to model change', done => {
      obj.selectedItem = el.options.item(0).model;
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      el.options.item(0).selected = false;
      el.options.item(1).selected = true;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('responds to options change', done => {
      var option = document.createElement('option');
      option.text = 'D';
      option.model = { foo: 'D' };
      obj.selectedItem = option.model;
      el.appendChild(option);
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('single-select objects with matcher', () => {
    var obj, el, binding, elementValueProperty;
    beforeAll(() => {
      var option, info;
      el = createElement('<select></select>');
      option = document.createElement('option');
      option.text = 'A';
      option.model = { foo: 'A' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'B';
      option.model = { foo: 'B' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'C';
      option.model = { foo: 'C' };
      el.appendChild(option);
      document.body.appendChild(el);
      obj = { selectedItem: { foo: 'B' } };

      info = getBinding(observerLocator, obj, 'selectedItem', el, 'value', bindingMode.twoWay);
      binding = info.binding;
      elementValueProperty = info.targetObserver;
    });

    it('binds', done => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'bind').and.callThrough();
      binding.bind(createScopeForTest(obj));
      expect(targetObserver.bind).toHaveBeenCalled();
      el.matcher = (a, b) => a.foo === b.foo;
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      });
    });

    it('responds to model change', done => {
      obj.selectedItem = { foo: 'A' };
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('responds to element change', done => {
      el.options.item(0).selected = false;
      el.options.item(1).selected = true;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('responds to options change', done => {
      var option = document.createElement('option');
      option.text = 'D';
      option.model = { foo: 'D' };
      obj.selectedItem = { foo: 'D' };
      el.appendChild(option);
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItem);
        expect(getElementValue(el)).toEqual(obj.selectedItem);
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('multi-select objects', () => {
    var obj, el, binding, elementValueProperty;
    beforeAll(() => {
      var option, info;
      el = createElement('<select multiple></select>');
      option = document.createElement('option');
      option.text = 'A';
      option.model = { foo: 'A' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'B';
      option.model = { foo: 'B' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'C';
      option.model = { foo: 'C' };
      el.appendChild(option);
      document.body.appendChild(el);
      obj = { selectedItems: [el.options.item(1).model, el.options.item(2).model] };

      info = getBinding(observerLocator, obj, 'selectedItems', el, 'value', bindingMode.twoWay);
      binding = info.binding;
      elementValueProperty = info.targetObserver;
    });

    it('binds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'bind').and.callThrough();
      binding.bind(createScopeForTest(obj));
      expect(targetObserver.bind).toHaveBeenCalled();
      expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
      expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
    });

    it('responds to model change', done => {
      obj.selectedItems = [el.options.item(0).model];
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('responds to model mutate', done => {
      while(obj.selectedItems.length) {
        obj.selectedItems.pop();
      }
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        obj.selectedItems.push(el.options.item(1).model);
        setTimeout(() => {
          expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
          expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
          done();
        }, 0);
      }, 0);
    });

    it('responds to element change', done => {
      el.options.item(0).selected = true;
      el.options.item(1).selected = false;
      el.options.item(2).selected = true;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('responds to options change', done => {
      var option = document.createElement('option');
      option.text = 'D';
      option.model = { foo: 'D' };
      obj.selectedItems = [option.model];
      el.appendChild(option);
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('multi-select objects with matcher', () => {
    var obj, el, binding, elementValueProperty;
    beforeAll(() => {
      var option, info;
      el = createElement('<select multiple></select>');
      option = document.createElement('option');
      option.text = 'A';
      option.model = { foo: 'A' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'B';
      option.model = { foo: 'B' };
      el.appendChild(option);
      option = document.createElement('option');
      option.text = 'C';
      option.model = { foo: 'C' };
      el.appendChild(option);
      document.body.appendChild(el);
      obj = { selectedItems: [{ foo: 'B'}, { foo: 'C' }] };

      info = getBinding(observerLocator, obj, 'selectedItems', el, 'value', bindingMode.twoWay);
      binding = info.binding;
      elementValueProperty = info.targetObserver;
    });

    it('binds', done => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'bind').and.callThrough();
      binding.bind(createScopeForTest(obj));
      expect(targetObserver.bind).toHaveBeenCalled();
      el.matcher = (a, b) => a.foo === b.foo;
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      });
    });

    it('responds to model change', done => {
      obj.selectedItems = [{ foo: 'A' }];
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('responds to model mutate', done => {
      while(obj.selectedItems.length) {
        obj.selectedItems.pop();
      }
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        obj.selectedItems.push({ foo: 'B' });
        setTimeout(() => {
          expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
          expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
          done();
        }, 0);
      }, 0);
    });

    it('responds to element change', done => {
      el.options.item(0).selected = true;
      el.options.item(1).selected = false;
      el.options.item(2).selected = true;
      el.dispatchEvent(DOM.createCustomEvent('change'));
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('responds to options change', done => {
      var option = document.createElement('option');
      option.text = 'D';
      option.model = { foo: 'D' };
      obj.selectedItems = [{ foo: 'D' }];
      el.appendChild(option);
      setTimeout(() => {
        expect(elementValueProperty.getValue()).toBe(obj.selectedItems);
        expect(getElementValue(el)).toEqual(obj.selectedItems.slice(0));
        done();
      }, 0);
    });

    it('unbinds', () => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      spyOn(targetObserver, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetObserver.unbind).toHaveBeenCalled();
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('option value bound after select value bound', () => {
    var obj, el, binding, binding2;

    beforeAll(() => {
      obj = { selectedItem: 'B', optionB: 'B' };
      el = createElement(
        `<select>
          <option value="A">Option A</option>
          <option          >Option B</option>
          <option value="C">Option C</option>
        </select>`);
      document.body.appendChild(el);
      binding = getBinding(observerLocator, obj, 'selectedItem', el, 'value', bindingMode.twoWay).binding;
      binding2 = getBinding(observerLocator, obj, 'optionB', el.options.item(1), 'value', bindingMode.toView).binding;
    });

    it('binds', done => {
      var targetObserver = observerLocator.getObserver(el, 'value');
      // select-value bind.
      binding.bind(createScopeForTest(obj));
      expect(el.options.item(1).selected).toBe(false);
      // now bind the option value.
      binding2.bind(createScopeForTest(obj));
      setTimeout(() => {
        expect(el.options.item(1).selected).toBe(true);
        done();
      }, 100);
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });

  describe('hierarchical select', () => {
    var obj;
    /**@type {HTMLSelectElement} */
    var select1;
    /**@type {HTMLSelectElement} */
    var select2;
    var binding1;
    var binding2;

    beforeEach(() => {
      class Car {
        constructor (name, models, selectedModelIndex) {
          this.name = name;
          this.models = models;
          this.selectedModelIndex = selectedModelIndex;
          this.selectedModel = this.models[selectedModelIndex];
        }
      }

      let cars = [
        new Car('Audi', ['Child11', 'Child12', 'Child13'], 2),
        new Car('BMW', ['Child21', 'Child22', 'Child23'], 1),
        new Car('Buick', ['Child31', 'Child32', 'Child33'], 2)
      ];
      obj = {
        cars: cars,
        selectedCar: cars[2]
      };
      select1 = createElement(
        `<select>
          <option>Audi</option>
          <option>BMW</option>
          <option>Buick</option>
        </select>`
      );
      select2 = createElement(
        `<select>
          <option>Child31</option>
          <option>Child32</option>
          <option>Child33</option>
        </select>`
      );
      document.body.appendChild(select1);
      document.body.appendChild(select2);

      for (let i = 0; i < select1.options.length; ++i) {
        observerLocator.getObserver(select1.options[i], 'model').setValue(cars[i]);
      }
      binding1 = getBinding(observerLocator, obj, 'selectedCar', select1, 'value', bindingMode.twoWay).binding;
      binding2 = getBinding(observerLocator, obj, 'selectedCar.selectedModel', select2, 'value', bindingMode.twoWay).binding;
    // binding2 = getBinding(observerLocator, obj, 'optionB', select1.options.item(1), 'value', bindingMode.toView).binding
    });

    it('binds', done => {
      var targetObserver = observerLocator.getObserver(select1, 'value');
      binding1.bind(createScopeForTest(obj));
      expect(select1.options.item(2).selected).toBe(true);
      binding2.bind(createScopeForTest(obj));
      setTimeout(() => {
        expect(select2.value).toBe('Child33');
        done();
      }, 80);
    });

    it('changes child select value correctly', done => {
      var targetObserver = observerLocator.getObserver(select1, 'value');
      binding1.bind(createScopeForTest(obj));
      expect(select1.options.item(2).selected).toBe(true);
      binding2.bind(createScopeForTest(obj));
      obj.selectedCar.selectedModel = obj.selectedCar.models[1];
      setTimeout(() => {
        expect(select2.value).toBe('Child32');
        obj.selectedCar = obj.cars[1];
        setTimeout(() => {
          expect(select1.options.item(1).selected).toBe(true);
          for (let i = 0, ii = select2.options.length; ii > i; ++i) {
            select2.options[i].textContent = obj.selectedCar.models[i];
          }
          setTimeout(() => {
            expect(select2.options.item(1).selected).toBe(true);
            done();
          }, 80);
        }, 80);
      }, 80);
    });

    afterEach(() => {
      binding1.unbind();
      binding2.unbind();
      document.body.removeChild(select1);
      document.body.removeChild(select2);
    });
  });
});
