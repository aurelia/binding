import './setup';
import {observable} from '../src/decorator-observable.js';
import {decorators} from 'aurelia-metadata';

describe('observable decorator', () => {
  const oldValue = 'old';
  const newValue = 'new';

  it('should call valueChanged when changing the property', () => {
    const instance = new class {
      @observable value = oldValue;
      valueChanged() { }
    };
    spyOn(instance, 'valueChanged');

    instance.value = newValue;
    expect(instance.valueChanged).toHaveBeenCalledWith(newValue, oldValue);
  });

  it('should call valueChanged when changing the undefined property', () => {
    const instance = new class {
      @observable value;
      valueChanged() { }
    };
    spyOn(instance, 'valueChanged');

    instance.value = newValue;
    expect(instance.valueChanged).toHaveBeenCalledWith(newValue, undefined);
  });

  it('should call customHandler when changing the property', () => {
    const instance = new class Test {
      @observable({ changeHandler: 'customHandler' }) value = oldValue;
      customHandler() { }
    };
    spyOn(instance, 'customHandler');

    instance.value = newValue;
    expect(instance.customHandler).toHaveBeenCalledWith(newValue, oldValue);
  });

  it('should call customHandler when changing the undefined property', () => {
    const instance = new class {
      @observable({ changeHandler: 'customHandler' }) value;
      customHandler() { }
    };
    spyOn(instance, 'customHandler');

    instance.value = newValue;
    expect(instance.customHandler).toHaveBeenCalledWith(newValue, undefined);
  });

  it('should work when valueChanged is undefined', () => {
    const instance = new class {
      @observable value = oldValue;
    };

    expect(instance.valueChanged).not.toBeDefined();
    instance.value = newValue;
    expect(instance.value).toEqual(newValue);
  });

  it('should work when valueChanged is undefined and property is undefined', () => {
    const instance = new class {
      @observable value;
    };

    expect(instance.valueChanged).not.toBeDefined();
    instance.value = newValue;
    expect(instance.value).toEqual(newValue);
  });

  it('should work with decorators function', () => {
    const instance = new (decorators(observable('value'))
      .on(class {
        constructor() {
          this.value = oldValue;
        }
        valueChanged() { }
      }));
    spyOn(instance, 'valueChanged');

    instance.value = newValue;
    expect(instance.valueChanged).toHaveBeenCalledWith(newValue, oldValue);
  });

  it('should work with decorators function when property is undefined', () => {
    const instance = new (decorators(observable('value'))
      .on(class {
        valueChanged() { }
      }));
    spyOn(instance, 'valueChanged');

    instance.value = newValue;
    expect(instance.valueChanged).toHaveBeenCalledWith(newValue, undefined);
  });

  it('should work with decorators function and config', () => {
    const instance = new (decorators(observable({ name: 'value', changeHandler: 'customHandler' }))
      .on(class {
        constructor() {
          this.value = oldValue;
        }
        customHandler() { }
      }));
    spyOn(instance, 'customHandler');

    instance.value = newValue;
    expect(instance.customHandler).toHaveBeenCalledWith(newValue, oldValue);
  });
});
