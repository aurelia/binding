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

describe('select element value binding', () => {
  var observerLocator,
      valueConverterLookupFunction = name => null;

  beforeAll(() => {
    observerLocator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker(), []);
  });

  function getElementValue(element) {
    var selectedOptions = element.selectedOptions,
        count = selectedOptions.length,
        option, i, value;

    if (element.multiple) {
      value = [];
      for(i = 0; i < count; i++) {
        option = selectedOptions.item(i);
        value[i] = option.hasOwnProperty('model') ? option.model : option.value;
      }
    } else if (count === 0) {
      value = null;
    } else {
      option = selectedOptions.item(0);
      value = option.hasOwnProperty('model') ? option.model : option.value;
    }
    return value;
  }

  describe('single-select strings', () => {
    var obj, el, binding;

    beforeAll(() => {
      var targetProperty, sourceExpression, bindingExpression;
      obj = { selectedItem: 'B' };
      el = createElement(
        `<select>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>`);
      document.body.appendChild(el);
      targetProperty = observerLocator.getObserver(el, 'value');
      sourceExpression = new AccessScope('selectedItem');
      bindingExpression = new BindingExpression(
        observerLocator,
        'value',
        sourceExpression,
        TWO_WAY,
        valueConverterLookupFunction,
        undefined);
      binding = bindingExpression.createBinding(el);
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

  describe('multi-select strings', () => {
    var obj, el, binding, elementValueProperty;
    beforeAll(() => {
      var targetProperty, sourceExpression, bindingExpression;
      obj = { selectedItems: ['B', 'C'] };
      el = createElement(
        `<select multiple>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>`);
      document.body.appendChild(el);
      targetProperty = observerLocator.getObserver(el, 'value');
      sourceExpression = new AccessScope('selectedItems');
      bindingExpression = new BindingExpression(
        observerLocator,
        'value',
        sourceExpression,
        TWO_WAY,
        valueConverterLookupFunction,
        undefined);
      binding = bindingExpression.createBinding(el);
      elementValueProperty = observerLocator.getObserver(el, 'value');
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
      var targetProperty, sourceExpression, bindingExpression, option;
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
      targetProperty = observerLocator.getObserver(el, 'value');
      sourceExpression = new AccessScope('selectedItem');
      bindingExpression = new BindingExpression(
        observerLocator,
        'value',
        sourceExpression,
        TWO_WAY,
        valueConverterLookupFunction,
        undefined);
      binding = bindingExpression.createBinding(el);
      elementValueProperty = observerLocator.getObserver(el, 'value');
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
      var targetProperty, sourceExpression, bindingExpression, option;
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
      targetProperty = observerLocator.getObserver(el, 'value');
      sourceExpression = new AccessScope('selectedItems');
      bindingExpression = new BindingExpression(
        observerLocator,
        'value',
        sourceExpression,
        TWO_WAY,
        valueConverterLookupFunction,
        undefined);
      binding = bindingExpression.createBinding(el);
      elementValueProperty = observerLocator.getObserver(el, 'value');
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
});
