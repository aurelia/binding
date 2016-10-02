import './setup';
import {observable} from '../src/decorator-observable.js';
import {decorators} from 'aurelia-metadata';
import {SetterObserver} from '../src/property-observation';
import {Logger} from 'aurelia-logging';

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
    expect(instance.valueChanged).toHaveBeenCalledWith(newValue, oldValue, 'value');
  });

  it('should work with decorators function when property is undefined', () => {
    const instance = new (decorators(observable('value'))
      .on(class {
        valueChanged() { }
      }));
    spyOn(instance, 'valueChanged');

    instance.value = newValue;
    expect(instance.valueChanged).toHaveBeenCalledWith(newValue, undefined, 'value');
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
    expect(instance.customHandler).toHaveBeenCalledWith(newValue, oldValue, 'value');
  });
  
  it('should create an enumerable accessor', () => {
    const instance = new class {
      @observable value;
    };
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(instance), 'value');

    expect(descriptor.enumerable).toBe(true);
    expect(typeof descriptor.set).toBe('function');
    expect(typeof descriptor.get).toBe('function');
  });

  describe('private property', () => {
    describe(`when public property's value is not changed`, () => {
      const instance = new class {
        @observable value;
      };
      const prototype = Object.getPrototypeOf(instance);

      it('should exist on the prototype', () => {
        expect(prototype.hasOwnProperty('_value')).toBe(true);
      });

      it('should be nonenumerable', () => {
        expect(prototype.propertyIsEnumerable('_value')).toBe(false);
      });

      describe('observation', () => {
        const observer = new SetterObserver(null, prototype, '_value');

        it('should convert to accessors without warning', () => {
          spyOn(Logger.prototype, 'warn');
          observer.convertProperty();
          expect(Logger.prototype.warn).not.toHaveBeenCalled();
        });

        it('should exist', () => {
          const descriptor = Object.getOwnPropertyDescriptor(prototype, '_value');
          expect(typeof descriptor.get).toBe('function');
          expect(typeof descriptor.set).toBe('function');
        });

        it('should be nonenumerable', () => {
          expect(prototype.propertyIsEnumerable('_value')).toBe(false);
        });
      });
    });

    describe(`when public property's value is changed`, () => {
      const instance = new class {
        @observable value;
      };
      instance.value = newValue;

      it('should exist on the instance', () => {
        expect(instance.hasOwnProperty('_value')).toBe(true);
      });

      it('should be nonenumerable', () => {
        expect(instance.propertyIsEnumerable('_value')).toBe(false);
      });

      describe('observation', () => {
        const observer = new SetterObserver(null, instance, '_value');

        it('should convert to accessors without warning', () => {
          spyOn(Logger.prototype, 'warn');
          observer.convertProperty();
          expect(Logger.prototype.warn).not.toHaveBeenCalled();
        });

        it('should exist', () => {
          const descriptor = Object.getOwnPropertyDescriptor(instance, '_value');
          expect(typeof descriptor.get).toBe('function');
          expect(typeof descriptor.set).toBe('function');
        });

        it('should be nonenumerable', () => {
          expect(instance.propertyIsEnumerable('_value')).toBe(false);
        });
      });
    });

    it('should have distinct values between instances', () => {
      class MyClass {
        @observable value = oldValue;
      }

      const instance1 = new MyClass();
      const instance2 = new MyClass();

      instance1.value = newValue;
      expect(instance2.value).toBe(oldValue);
    });
  });
});
