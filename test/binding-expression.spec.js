import {
  ObserverLocator,
  EventManager,
  DirtyChecker,
  BindingExpression,
  ONE_WAY,
  TWO_WAY
} from '../src/index';
import {TaskQueue} from 'aurelia-task-queue';
import {AccessScope} from '../src/ast';

function createElement(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

function fireEvent(element, name) {
  var event;
  if (document.createEventObject) {
    event = document.createEventObject();
    return element.fireEvent('on' + name, event)
  } else {
    event = document.createEvent("HTMLEvents");
    event.initEvent(name, true, true ); // event type, bubbling, cancelable
    return !element.dispatchEvent(event);
  }
}

function getBinding(observerLocator, model, modelProperty, view, viewProperty, mode) {
  var targetProperty, sourceExpression, bindingExpression, binding;
  targetProperty = observerLocator.getObserver(view, viewProperty);
  sourceExpression = new AccessScope(modelProperty);
  bindingExpression = new BindingExpression(
    observerLocator,
    viewProperty,
    sourceExpression,
    mode,
    name => null,
    undefined);
  binding = bindingExpression.createBinding(view);

  return {
    targetProperty: targetProperty,
    sourceExpression: sourceExpression,
    bindingExpression: bindingExpression,
    binding: binding,
    view: view,
    model: model
  };
}

describe('select element value binding', () => {
  var observerLocator;

  beforeAll(() => {
    observerLocator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), []);
  });

  function getElementValue(element) {
    var options = element.options, option, i, ii, count = 0, value = [];

    for(i = 0, ii = options.length; i < ii; i++) {
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
      binding = getBinding(observerLocator, obj, 'selectedItem', el, 'value', TWO_WAY).binding;
    });

    it('binds', () => {
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'bind').and.callThrough();
      binding.bind(obj);
      expect(targetProperty.bind).toHaveBeenCalled();
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
      fireEvent(el, 'change');
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
      info = getBinding(observerLocator, obj, 'selectedItems', el, 'value', TWO_WAY);
      binding = info.binding;
      elementValueProperty = info.targetProperty;
    });

    it('binds', () => {
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'bind').and.callThrough();
      binding.bind(obj);
      expect(targetProperty.bind).toHaveBeenCalled();
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
      fireEvent(el, 'change');
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
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetProperty.unbind).toHaveBeenCalled();
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

      info = getBinding(observerLocator, obj, 'selectedItem', el, 'value', TWO_WAY);
      binding = info.binding;
      elementValueProperty = info.targetProperty;
    });

    it('binds', () => {
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'bind').and.callThrough();
      binding.bind(obj);
      expect(targetProperty.bind).toHaveBeenCalled();
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
      fireEvent(el, 'change');
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
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetProperty.unbind).toHaveBeenCalled();
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

      info = getBinding(observerLocator, obj, 'selectedItems', el, 'value', TWO_WAY);
      binding = info.binding;
      elementValueProperty = info.targetProperty;
    });

    it('binds', () => {
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'bind').and.callThrough();
      binding.bind(obj);
      expect(targetProperty.bind).toHaveBeenCalled();
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
      fireEvent(el, 'change');
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
      var targetProperty = binding.targetProperty;
      spyOn(targetProperty, 'unbind').and.callThrough();
      binding.unbind();
      expect(targetProperty.unbind).toHaveBeenCalled();
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
      binding = getBinding(observerLocator, obj, 'selectedItem', el, 'value', TWO_WAY).binding;
      binding2 = getBinding(observerLocator, obj, 'optionB', el.options.item(1), 'value', ONE_WAY).binding;
    });

    it('binds', done => {
      var targetProperty = binding.targetProperty;
      // select-value bind.
      binding.bind(obj);
      expect(el.options.item(1).selected).toBe(false);
      // now bind the option value.
      binding2.bind(obj);
      setTimeout(() => {
        expect(el.options.item(1).selected).toBe(true);
        done();
      }, 100);
    });

    afterAll(() => {
      document.body.removeChild(el);
    });
  });
});


describe('checked binding', () => {
  var observerLocator;

  beforeAll(() => {
    observerLocator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), []);
  });

  describe('checkbox - array of strings', () => {
    var obj, el, binding;

    beforeAll(() => {
      obj = { selectedItems: [] };
      el = createElement('<input type="checkbox" value="A" />');
      document.body.appendChild(el);
      binding = getBinding(observerLocator, obj, 'selectedItems', el, 'checked', TWO_WAY).binding;
    });

    it('binds', () => {
      binding.bind(obj);
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
      binding = getBinding(observerLocator, obj, 'selectedItems', el, 'checked', TWO_WAY).binding;
    });

    it('binds', () => {
      binding.bind(obj);
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
      binding = getBinding(observerLocator, obj, 'checked', el, 'checked', TWO_WAY).binding;
    });

    it('binds', () => {
      binding.bind(obj);
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
      binding = getBinding(observerLocator, obj, 'selectedItems', el, 'checked', TWO_WAY).binding;
      binding2 = getBinding(observerLocator, obj, 'value', el, 'value', ONE_WAY).binding;
    });

    it('binds', done => {
      binding.bind(obj);
      binding2.bind(obj);
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
        getBinding(observerLocator, obj, 'value', el.children.item(0), 'checked', TWO_WAY),
        getBinding(observerLocator, obj, 'value', el.children.item(1), 'checked', TWO_WAY),
        getBinding(observerLocator, obj, 'value', el.children.item(2), 'checked', TWO_WAY)];
    });

    it('binds', () => {
      radios[0].binding.bind(obj);
      radios[1].binding.bind(obj);
      radios[2].binding.bind(obj);
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
        getBinding(observerLocator, obj, 'value', el.children.item(0), 'checked', TWO_WAY),
        getBinding(observerLocator, obj, 'value', el.children.item(1), 'checked', TWO_WAY),
        getBinding(observerLocator, obj, 'value', el.children.item(2), 'checked', TWO_WAY)];
    });

    it('binds', () => {
      radios[0].binding.bind(obj);
      radios[1].binding.bind(obj);
      radios[2].binding.bind(obj);
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
