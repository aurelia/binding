import './setup';
import {observable} from '../src/decorator-observable.js';
import {mapCoerceFunction, coerceFunctionMap} from '../src/coerce-functions';
import {decorators} from 'aurelia-metadata';
import {SetterObserver} from '../src/property-observation';
import {Logger} from 'aurelia-logging';
import {metadata} from 'aurelia-metadata';

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
    it('initializes value correctly', () => {
      class MyClass {
        @observable({ coerce: 'string' }) value = 5
      }
      expect(new MyClass()._value).toBe('5');
    });

    it('coerces value correctly', () => {
      @observable({ name: 'value1', coerce: 'boolean' })
      class MyClass {
        @observable({ coerce: 'number' }) value2
      }
      const instance = new MyClass();
      instance.value1 = 0;
      expect(instance.value1).toBe(false);
      instance.value2 = '123';
      expect(instance.value2).toBe(123);
    });

    it('warns when using unknown coerce', () => {
      spyOn(Logger.prototype, 'warn');
      class MyClass {
        @observable({ coerce: 'name' }) prop
      }
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });

    describe('with built in fluent syntax', () => {
      const cases = [
        { type: 'number', baseValue: '123', satisfy: val => val === 123 },
        { type: 'boolean', baseValue: 1, satisfy: val => val === true },
        { type: 'date', baseValue: '2017-09-26', satisfy: val => val instanceof Date && val.getDate() === 26 && val.getMonth() === 8 && val.getFullYear() === 2017 },
        { type: 'string', baseValue: 123, satisfy: val => val === '123' }
      ];

      it('initializes value correctly', () => {
        cases.forEach(test => {
          class MyClass {
            @observable[test.type] prop = test.baseValue
          }
          expect(test.satisfy(new MyClass()._prop)).toBe(true);
        });
      });

      it('sets value correctly', () => {
        cases.forEach(test => {
          class MyClass {
            @observable[test.type] prop
          }

          const instance = new MyClass();
          instance.prop = test.baseValue;

          expect(test.satisfy(instance.prop)).toBe(true);
        });
      });

      it('works with inheritance', () => {
        cases.forEach(test => {
          const deco = observable[test.type];
          class MyClassBase {
            @deco prop
          }

          class MyClass extends MyClassBase {}
          
          const instance = new MyClass();
          instance.prop = test.baseValue;

          expect(test.satisfy(instance.prop)).toBe(true);
        });
      });
    });

    describe('with property type via metadata', () => {
      const cases = [
        { propType: Number, baseValue: '123', satisfy: val => val === 123 },
        { propType: Boolean, baseValue: 1, satisfy: val => val === true },
        { propType: Date, baseValue: '2017-09-26', satisfy: val => val instanceof Date && val.getDate() === 26 && val.getMonth() === 8 && val.getFullYear() === 2017 },
        { propType: String, baseValue: 123, satisfy: val => val === '123' }
      ];

      it('respects the property type flag to intialize value correctly', () => {
        observable.usePropType(true);
        cases.forEach(test => {
          class MyClass {
            @observable
            @Reflect.metadata(metadata.propertyType, test.propType)
            prop = test.baseValue
          }
          expect(test.satisfy(new MyClass()._prop)).toBe(true);
        });

        observable.usePropType(false);
        cases.forEach(test => {
          class MyClass {
            @observable
            @Reflect.metadata(metadata.propertyType, test.propType)
            prop = test.baseValue
          }
          expect(test.satisfy(new MyClass()._prop)).toBe(false);
        });
      });

      it('respects the property type flag to set value correctly', () => {
        observable.usePropType(true);
        cases.forEach(test => {
          class MyClass {
            @observable
            @Reflect.metadata(metadata.propertyType, test.propType)
            prop
          }

          const instance = new MyClass();
          instance.prop = test.baseValue;

          expect(test.satisfy(instance.prop)).toBe(true);
        });

        observable.usePropType(false);
        cases.forEach(test => {
          class MyClass {
            @observable
            @Reflect.metadata(metadata.propertyType, test.propType)
            prop
          }

          const instance = new MyClass();
          instance.prop = test.baseValue;

          expect(test.satisfy(instance.prop)).toBe(false);
        });
      });

      it('should warn when using unknown property type', () => {
        observable.usePropType(true);
        spyOn(Logger.prototype, 'warn');

        class MyClass {
          @observable
          @Reflect.metadata(metadata.propertyType, class PropertyType {})
          prop
        }
        expect(Logger.prototype.warn).toHaveBeenCalled();
      });

      it('should not warn when using registered property type', () => {
        class PropertyType {}
        coerceFunctionMap.set(PropertyType, 'string');

        observable.usePropType(true);
        spyOn(Logger.prototype, 'warn');

        class MyClass {
          @observable
          @Reflect.metadata(metadata.propertyType, PropertyType)
          prop
        }
        expect(Logger.prototype.warn).not.toHaveBeenCalled();
      });

      it('works with inheritance when using property type', () => {
        cases.forEach(test => {
          observable.usePropType(true);
          class MyClassBase {
            @observable
            @Reflect.metadata(metadata.propertyType, test.propType)
            prop
          }

          class MyClass extends MyClassBase {}
          
          const instance = new MyClass();
          instance.prop = test.baseValue;

          expect(test.satisfy(instance.prop)).toBe(true);
        });
      });
    });
  });
});
