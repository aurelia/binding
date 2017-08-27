import './setup';
import {observable} from '../src/decorator-observable.js';
import {decorators, metadata} from 'aurelia-metadata';
import {SetterObserver} from '../src/property-observation';
import {
  coerces,
  classCoerceMap,
  mapCoerceForClass
} from '../src/coerce'
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

  it('should not call valueChanged when property is assigned the same value', () => {
    const instance = new class {
      @observable value = oldValue;
      valueChanged() { }
    };
    spyOn(instance, 'valueChanged');

    instance.value = oldValue;
    expect(instance.valueChanged).not.toHaveBeenCalled();
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

  describe('coerce', () => {
    const baseNumberVal = 5;
    const baseStringVal = 'string';
    const baseDateVal = new Date();
    const baseBoolVal = false;

    it('should initialize value correctly', () => {

      const instance1 = new class MyClass {
        @observable({ coerce: 'string' }) num = baseNumberVal;
        @observable({ coerce: 'string' }) bool = baseBoolVal;
        @observable({ coerce: 'string' }) date = baseDateVal;
        @observable({ coerce: 'string' }) undef;
      }

      expect(instance1.num).toBe(baseNumberVal.toString());
      expect(instance1.bool).toBe(baseBoolVal.toString());
      expect(instance1.date).toBe(baseDateVal.toString());
      expect(instance1.undef).toBe(undefined);
    });

    it('should coerce value correctly when defined on class prototype', () => {
      const prop = 'value';

      @observable({ name: prop, coerce: 'number' })
      class MyClass {}

      const instance1 = new MyClass();
      instance1[prop] = '5';
      expect(instance1[`_${prop}`]).toBe(5);
      expect(instance1[prop]).toBe(5);
    });

    it('should coerce value correctly when defined on instance', () => {
      
      class MyClass {
        @observable({ coerce: 'number' }) value
      }

      const instance1 = new MyClass();
      instance1.value = '4';

      expect(instance1.value).toBe(4);
    });

    it('should coerce value correctly when defined on property with metadata', () => {
      class MyClass {
        @observable
        @Reflect.metadata(metadata.propertyType, Number)
        value

        @observable()
        @Reflect.metadata(metadata.propertyType, Date)
        date

        @observable({ coerce: 'boolean' })
        @Reflect.metadata(metadata.propertyType, Number)
        num
      }

      const date = new Date();
      const instance1 = new MyClass();
      instance1.value = '4';
      instance1.date = date.toJSON();
      instance1.num = '4';
      expect(instance1.value).toBe(4);
      expect(instance1.date.toJSON()).toBe(date.toJSON());
      expect(instance1.num).toBe(!!'4');
    });

    describe('fluent syntax', () => {

      it('should coerce value correctly when defined on field', () => {
        let instance = new class MyClass {
          @observable.number num
          @observable.boolean() bool
          @observable.string({ coerce: 'number' }) string
        }
  
        instance.num = '5';
        instance.bool = '';
        instance.string = 5;
        expect(instance.num).toBe(5);
        expect(instance.bool).toBe(false);
        expect(instance.string).toBe('5');
      });

      it('should coerce value corectly when defined on class', () => {
        let instance;
  
        instance = new @observable.number('num') class MyClass {}
        instance.num = '5';
        expect(instance.num).toBe(5);
  
        instance = new @observable.number({ name: 'num' }) class MyClass {}
        instance.num = '5';
        expect(instance.num).toBe(5);
      })
    });

  });
});
