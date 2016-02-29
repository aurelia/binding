import './setup';
import {observable} from '../src/decorator-observable.js';

describe('observable decorator', () => {
  it('valueChanged should be called when changing the decorated property - no initializer', () => {
    class Test {
      @observable value;
      valueChanged() {
        this.test = this.value;
      }
    };

    var test = new Test();

    expect(test.test).not.toBeDefined();
    test.value = 'hello';
    expect(test.test).toBeDefined();
    expect(test.test).toEqual('hello');

    test.value = 'world';
    expect(test.test).toEqual('world');
  });

  it('customHandler should be called when changing the decorated property - no initializer', () => {
    class Test {
      @observable({ changeHandler: 'customHandler' }) value;
      valueChanged() {
        this.test = 'fail';
      }
      customHandler() {
        this.test = this.value + ' world';
      }
    };

    var test = new Test();

    expect(test.test).not.toBeDefined();
    test.value = 'hello';
    expect(test.test).toBeDefined();
    expect(test.test).toEqual('hello world');
  });

  it('valueChanged does not exist - no initializer', () => {
    class Test {
      @observable value = 'old';
    };

    var test = new Test();

    expect(test.valueChanged).not.toBeDefined();
    test.value = 'new';
    expect(test.value).toEqual('new');
  });

  it('valueChanged should be called when changing the decorated property - with initializer', () => {
    class Test {
      @observable value;
      valueChanged() {
        this.test = this.value;
      }
    };

    var test = new Test();

    expect(test.test).not.toBeDefined();
    test.value = 'hello';
    expect(test.test).toBeDefined();
    expect(test.test).toEqual('hello');

    test.value = 'world';
    expect(test.test).toEqual('world');
  });

  it('customHandler should be called when changing the decorated property - with initializer', () => {
    class Test {
      @observable({ changeHandler: 'customHandler' }) value = '';
      valueChanged() {
        this.test = 'fail';
      }
      customHandler() {
        this.test = this.value + ' world';
      }
    };

    var test = new Test();

    expect(test.test).not.toBeDefined();
    test.value = 'hello';
    expect(test.test).toBeDefined();
    expect(test.test).toEqual('hello world');
  });

  it('valueChanged does not exist - with initializer', () => {
    class Test {
      @observable value = 'old';
    };

    var test = new Test();

    expect(test.valueChanged).not.toBeDefined();
    test.value = 'new';
    expect(test.value).toEqual('new');
  });

});