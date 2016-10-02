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
    expect(instance.valueChanged).toHaveBeenCalledWith(newValue, oldValue, 'value');
  });

  it('should call valueChanged when changing the undefined property', () => {
    const instance = new class {
      @observable value;
      valueChanged() { }
    };
    spyOn(instance, 'valueChanged');

    instance.value = newValue;
    expect(instance.valueChanged).toHaveBeenCalledWith(newValue, undefined, 'value');
  });

  it('should call customHandler when changing the property', () => {
    const instance = new class Test {
      @observable({ changeHandler: 'customHandler' }) value = oldValue;
      customHandler() { }
    };
    spyOn(instance, 'customHandler');

    instance.value = newValue;
    expect(instance.customHandler).toHaveBeenCalledWith(newValue, oldValue, 'value');
  });

  it('should call customHandler when changing the undefined property', () => {
    const instance = new class {
      @observable({ changeHandler: 'customHandler' }) value;
      customHandler() { }
    };
    spyOn(instance, 'customHandler');

    instance.value = newValue;
    expect(instance.customHandler).toHaveBeenCalledWith(newValue, undefined, 'value');
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

  describe('es2015 with decorators function', () => {
    it('should work when decorating property', () => {
      class MyClass {
        constructor() {
          this.value = oldValue;
        }
        valueChanged() { }
      }
      decorators(observable).on(MyClass.prototype, 'value');
      const instance = new MyClass();
      spyOn(instance, 'valueChanged');

      instance.value = newValue;
      expect(instance.valueChanged).toHaveBeenCalledWith(newValue, oldValue, 'value');
    });

    it('should work when decorating class', () => {
      class MyClass {
        constructor() {
          this.value = oldValue;
        }
        valueChanged() { }
      }
      decorators(observable('value')).on(MyClass);
      const instance = new MyClass();
      spyOn(instance, 'valueChanged');

      instance.value = newValue;
      expect(instance.valueChanged).toHaveBeenCalledWith(newValue, oldValue, 'value');
    });

    it('should work when property is undefined', () => {
      class MyClass {
        valueChanged() { }
      }
      decorators(observable).on(MyClass.prototype, 'value');
      const instance = new MyClass();
      spyOn(instance, 'valueChanged');

      instance.value = newValue;
      expect(instance.valueChanged).toHaveBeenCalledWith(newValue, undefined, 'value');
    });

    it('should work with customHandler', () => {
      class MyClass {
        constructor() {
          this.value = oldValue;
        }
        customHandler() { }
      }
      decorators(observable({ changeHandler: 'customHandler' })).on(MyClass.prototype, 'value');
      const instance = new MyClass();
      spyOn(instance, 'customHandler');

      instance.value = newValue;
      expect(instance.customHandler).toHaveBeenCalledWith(newValue, oldValue, 'value');
    });
  });

  it('should return a valid descriptor', () => {
    const target = class { };
    const descriptor = observable(target, 'value');

    expect(typeof descriptor.value).toBe('undefined');
    expect(typeof descriptor.writable).toBe('undefined');
    expect(typeof descriptor.get).toBe('function');
    expect(typeof descriptor.set).toBe('function');
    expect(Reflect.defineProperty(target, 'value', descriptor)).toBe(true);
  });

  it('should create an enumerable accessor', () => {
    const instance = new class {
      @observable value;
    };
    const keys = [];
    for (let p in instance) {
      keys.push(p);
    }
    expect(keys).toContain('value');
  });
});
