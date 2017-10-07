import {Container} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';
import {bindingMode} from '../src/binding-mode';
import {BindingEngine} from '../src/binding-engine';
import {checkDelay} from './shared';
import {createScopeForTest} from '../src/scope';
import {sourceContext} from '../src/connectable-binding';
import {signalBindings} from '../src/signals';

describe('BindingExpression', () => {
  let bindingEngine;

  beforeAll(() => {
    bindingEngine = new Container().get(BindingEngine);
    bindingEngine.observerLocator.dirtyChecker.checkDelay = checkDelay;
  });

  it('handles AccessMember in twoWay mode', done => {
    let source = { foo: { bar: 'baz'} };
    let target = document.createElement('input');
    let bindingExpression = bindingEngine.createBindingExpression('value', 'foo.bar', bindingMode.twoWay);
    let binding = bindingExpression.createBinding(target);
    binding.bind(createScopeForTest(source));
    expect(target.value).toBe(source.foo.bar);
    let sourceObserver = bindingEngine.observerLocator.getObserver(source.foo, 'bar');
    expect(sourceObserver.hasSubscribers()).toBe(true);
    source.foo.bar = 'xup';
    setTimeout(() => {
      expect(target.value).toBe(source.foo.bar);
      binding.unbind();
      expect(sourceObserver.hasSubscribers()).toBe(false);
      source.foo.bar = 'test';
      setTimeout(() => {
        expect(target.value).toBe('xup');
        done();
      }, checkDelay * 2);
    }, checkDelay * 2);
  });

  it('handles AccessMember in fromView mode', done => {
    let source = { foo: { bar: 'baz'} };
    let target = document.createElement('input');
    let bindingExpression = bindingEngine.createBindingExpression('value', 'foo.bar', bindingMode.fromView);
    let binding = bindingExpression.createBinding(target);

    binding.bind(createScopeForTest(source));
    expect(target.value).toBe('');

    let sourceObserver = bindingEngine.observerLocator.getObserver(source.foo, 'bar');
    expect(sourceObserver.hasSubscribers()).toBe(false);

    expect(binding.targetObserver.hasSubscribers()).toBe(true);
    expect(binding.targetObserver.hasSubscriber(sourceContext, sourceObserver)).toBe(false);

    source.foo.bar = 'xup';
    setTimeout(() => {
      expect(target.value).toBe('');
      target.value = 'xup';
      target.dispatchEvent(new CustomEvent('input'));

      setTimeout(() => {
        expect(source.foo.bar).toBe('xup');
        binding.unbind();
        expect(binding.targetObserver.hasSubscribers()).toBe(false);
        done();
      }, checkDelay * 2);
    }, checkDelay * 2);
  });

  describe('ValueConverter', () => {
    it('handles ValueConverter without signals', done => {
      let valueConverters = {
        numberToString: { toView: value => value.toString(), fromView: value => parseInt(value, 10) },
        multiply: { toView: (value, arg) => value * arg, fromView: (value, arg) => value / arg }
      };
      spyOn(valueConverters.numberToString, 'toView').and.callThrough();
      spyOn(valueConverters.numberToString, 'fromView').and.callThrough();
      spyOn(valueConverters.multiply, 'toView').and.callThrough();
      spyOn(valueConverters.multiply, 'fromView').and.callThrough();
      let lookupFunctions = { valueConverters: name => valueConverters[name] };
      let source = { foo: { bar: 1 }, arg: 2 };
      let target = document.createElement('input');
      let bindingExpression = bindingEngine.createBindingExpression('value', 'foo.bar | multiply:arg | numberToString', bindingMode.twoWay, lookupFunctions);
      let binding = bindingExpression.createBinding(target);
      binding.bind(createScopeForTest(source));
      expect(target.value).toBe('2');
      expect(valueConverters.numberToString.toView).toHaveBeenCalledWith(2);
      expect(valueConverters.multiply.toView).toHaveBeenCalledWith(1, 2);
      let sourceObserver = bindingEngine.observerLocator.getObserver(source.foo, 'bar');
      expect(sourceObserver.hasSubscribers()).toBe(true);
      let argObserver = bindingEngine.observerLocator.getObserver(source, 'arg');
      expect(argObserver.hasSubscribers()).toBe(true);
      expect(binding.targetObserver.hasSubscribers()).toBe(true);
      source.foo.bar = 2;
      setTimeout(() => {
        expect(target.value).toBe('4');
        expect(valueConverters.numberToString.toView).toHaveBeenCalledWith(4);
        expect(valueConverters.multiply.toView).toHaveBeenCalledWith(2, 2);
        valueConverters.numberToString.toView.calls.reset();
        valueConverters.numberToString.fromView.calls.reset();
        valueConverters.multiply.toView.calls.reset();
        valueConverters.multiply.fromView.calls.reset();
        source.arg = 4;
        setTimeout(() => {
          expect(target.value).toBe('8');
          expect(valueConverters.numberToString.toView).toHaveBeenCalledWith(8);
          expect(valueConverters.numberToString.fromView).not.toHaveBeenCalled();
          expect(valueConverters.multiply.toView).toHaveBeenCalledWith(2, 4);
          expect(valueConverters.multiply.fromView).not.toHaveBeenCalled();
          valueConverters.numberToString.toView.calls.reset();
          valueConverters.numberToString.fromView.calls.reset();
          valueConverters.multiply.toView.calls.reset();
          valueConverters.multiply.fromView.calls.reset();
          target.value = '24';
          target.dispatchEvent(DOM.createCustomEvent('change'));
          setTimeout(() => {
            expect(valueConverters.numberToString.toView).toHaveBeenCalledWith(24);
            expect(valueConverters.numberToString.fromView).toHaveBeenCalledWith('24');
            expect(valueConverters.multiply.toView).toHaveBeenCalledWith(6, 4);
            expect(valueConverters.multiply.fromView).toHaveBeenCalledWith(24, 4);
            valueConverters.numberToString.toView.calls.reset();
            valueConverters.numberToString.fromView.calls.reset();
            valueConverters.multiply.toView.calls.reset();
            valueConverters.multiply.fromView.calls.reset();
            expect(source.foo.bar).toBe(6);
            binding.unbind();
            expect(sourceObserver.hasSubscribers()).toBe(false);
            expect(argObserver.hasSubscribers()).toBe(false);
            expect(binding.targetObserver.hasSubscribers()).toBe(false);
            source.foo.bar = 4;
            setTimeout(() => {
              expect(valueConverters.numberToString.toView).not.toHaveBeenCalled();
              expect(valueConverters.numberToString.fromView).not.toHaveBeenCalled();
              expect(valueConverters.multiply.toView).not.toHaveBeenCalled();
              expect(valueConverters.multiply.fromView).not.toHaveBeenCalled();
              expect(target.value).toBe('24');
              done();
            }, checkDelay * 2);
          }, checkDelay * 2);
        }, checkDelay * 2);
      }, checkDelay * 2);
    });

    it('handles ValueConverter with signals', done => {
      let prefix = '_';
      let valueConverters = {
        withSingleSignals: {
          signals: ['hello'],
          toView: val => prefix + val
        },
        withMultipleSignals: {
          signals: ['hello', 'world'],
          toView: val => prefix + val
        }
      };
      let lookupFunctions = { valueConverters: name => valueConverters[name] };
      let source = { foo: { bar: 1 }, arg: 2 };
      let target1 = document.createElement('input');
      let bindingExpression1 = bindingEngine.createBindingExpression(
        'value',
        'foo.bar | withSingleSignals',
        bindingMode.oneWay,
        lookupFunctions
      );
      let binding1 = bindingExpression1.createBinding(target1);
      let target2 = document.createElement('input');
      let bindingExpression2 = bindingEngine.createBindingExpression(
        'value',
        'foo.bar | withMultipleSignals',
        bindingMode.oneWay,
        lookupFunctions
      );
      let binding2 = bindingExpression2.createBinding(target2);
      let scope = createScopeForTest(source);
      binding1.bind(scope);
      binding2.bind(scope);
      expect(target1.value).toBe('_1');
      expect(target2.value).toBe('_1');
      prefix = '';
      signalBindings('hello');
      setTimeout(() => {
        expect(target1.value).toBe('1');
        expect(target2.value).toBe('1');
        prefix = '_';
        signalBindings('world');
        setTimeout(() => {
          expect(target1.value).toBe('1');
          expect(target2.value).toBe('_1');
          done();
        }, checkDelay * 2);
      }, checkDelay * 2);
    });
  });

  it('handles BindingBehavior', done => {
    let bindingBehaviors = {
      numberToString: { bind: (binding, source) => {}, unbind: (binding, source) => {} },
      multiply: { bind: (binding, source) => {}, unbind: (binding, source) => {} }
    };
    spyOn(bindingBehaviors.numberToString, 'bind').and.callThrough();
    spyOn(bindingBehaviors.numberToString, 'unbind').and.callThrough();
    spyOn(bindingBehaviors.multiply, 'bind').and.callThrough();
    spyOn(bindingBehaviors.multiply, 'unbind').and.callThrough();
    let lookupFunctions = { bindingBehaviors: name => bindingBehaviors[name] };
    let source = { foo: { bar: 'baz' }, arg: 'hello world' };
    let target = document.createElement('input');
    let bindingExpression = bindingEngine.createBindingExpression('value', 'foo.bar & numberToString:arg & multiply', bindingMode.twoWay, lookupFunctions);
    let binding = bindingExpression.createBinding(target);
    function exerciseBindingBehavior(callback) {
      let scope = createScopeForTest(source);
      binding.bind(scope);
      expect(bindingBehaviors.numberToString.bind).toHaveBeenCalledWith(binding, scope, 'hello world');
      expect(bindingBehaviors.multiply.bind).toHaveBeenCalledWith(binding, scope);
      expect(target.value).toBe(source.foo.bar);
      let sourceObserver = bindingEngine.observerLocator.getObserver(source.foo, 'bar');
      expect(sourceObserver.hasSubscribers()).toBe(true);
      let argObserver = bindingEngine.observerLocator.getObserver(source, 'arg');
      expect(argObserver.hasSubscribers()).toBe(false);
      expect(binding.targetObserver.hasSubscribers()).toBe(true);
      source.foo.bar = 'xup';
      setTimeout(() => {
        expect(target.value).toBe(source.foo.bar);
        source.arg = 'goodbye world';
        setTimeout(() => {
          expect(target.value).toBe(source.foo.bar);
          target.value = 'burrito';
          target.dispatchEvent(DOM.createCustomEvent('change'));
          setTimeout(() => {
            expect(source.foo.bar).toBe(target.value);
            binding.unbind();
            expect(bindingBehaviors.numberToString.unbind).toHaveBeenCalledWith(binding, scope);
            expect(bindingBehaviors.multiply.unbind).toHaveBeenCalledWith(binding, scope);
            expect(sourceObserver.hasSubscribers()).toBe(false);
            expect(argObserver.hasSubscribers()).toBe(false);
            expect(binding.targetObserver.hasSubscribers()).toBe(false);
            source.foo.bar = 'test';
            setTimeout(() => {
              expect(target.value).toBe('burrito');
              callback();
            }, checkDelay * 2);
          }, checkDelay * 2);
        }, checkDelay * 2);
      }, checkDelay * 2);
    }
    exerciseBindingBehavior(() => exerciseBindingBehavior(done));
  });
});
