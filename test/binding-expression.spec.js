import {Container} from 'aurelia-dependency-injection';
import {bindingMode} from '../src/binding-mode';
import {BindingEngine} from '../src/binding-engine';
import {checkDelay, fireEvent} from './shared';
import {createScopeForTest} from '../src/scope';

describe('BindingExpression', () => {
  let bindingEngine;

  beforeAll(() => {
    bindingEngine = new Container().get(BindingEngine);
    bindingEngine.observerLocator.dirtyChecker.checkDelay = checkDelay;
  });

  it('handles AccessMember', done => {
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

  it('handles ValueConverter', done => {
    let valueConverters = {
      one: { toView: value => value, fromView: value => value },
      two: { toView: value => value, fromView: value => value }
    };
    spyOn(valueConverters.one, 'toView').and.callThrough();
    spyOn(valueConverters.one, 'fromView').and.callThrough();
    spyOn(valueConverters.two, 'toView').and.callThrough();
    spyOn(valueConverters.two, 'fromView').and.callThrough();
    let lookupFunctions = { valueConverters: name => valueConverters[name] };
    let source = { foo: { bar: 'baz' }, arg: 'hello world' };
    let target = document.createElement('input');
    let bindingExpression = bindingEngine.createBindingExpression('value', 'foo.bar | one:arg | two', bindingMode.twoWay, lookupFunctions);
    let binding = bindingExpression.createBinding(target);
    binding.bind(createScopeForTest(source));
    expect(target.value).toBe(source.foo.bar);
    expect(valueConverters.one.toView).toHaveBeenCalledWith(source.foo.bar, source.arg);
    expect(valueConverters.two.toView).toHaveBeenCalledWith(source.foo.bar);
    let sourceObserver = bindingEngine.observerLocator.getObserver(source.foo, 'bar');
    expect(sourceObserver.hasSubscribers()).toBe(true);
    let argObserver = bindingEngine.observerLocator.getObserver(source, 'arg');
    expect(argObserver.hasSubscribers()).toBe(true);
    expect(binding.targetProperty.hasSubscribers()).toBe(true);
    source.foo.bar = 'xup';
    setTimeout(() => {
      expect(target.value).toBe(source.foo.bar);
      expect(valueConverters.one.toView).toHaveBeenCalledWith(source.foo.bar, source.arg);
      expect(valueConverters.one.fromView).toHaveBeenCalledWith(source.foo.bar, source.arg);
      expect(valueConverters.two.toView).toHaveBeenCalledWith(source.foo.bar);
      expect(valueConverters.two.fromView).toHaveBeenCalledWith(source.foo.bar);
      valueConverters.one.toView.calls.reset();
      valueConverters.one.fromView.calls.reset();
      valueConverters.two.toView.calls.reset();
      valueConverters.two.fromView.calls.reset();
      source.arg = 'goodbye world';
      setTimeout(() => {
        expect(target.value).toBe(source.foo.bar);
        expect(valueConverters.one.toView).toHaveBeenCalledWith(source.foo.bar, source.arg);
        expect(valueConverters.one.fromView).not.toHaveBeenCalled();
        expect(valueConverters.two.toView).toHaveBeenCalledWith(source.foo.bar);
        expect(valueConverters.two.fromView).not.toHaveBeenCalled();
        valueConverters.one.toView.calls.reset();
        valueConverters.one.fromView.calls.reset();
        valueConverters.two.toView.calls.reset();
        valueConverters.two.fromView.calls.reset();
        target.value = 'burrito';
        fireEvent(target, 'change');
        setTimeout(() => {
          expect(valueConverters.one.toView).toHaveBeenCalledWith(target.value, source.arg);
          expect(valueConverters.one.fromView).toHaveBeenCalledWith(target.value, source.arg);
          expect(valueConverters.two.toView).toHaveBeenCalledWith(target.value);
          expect(valueConverters.two.fromView).toHaveBeenCalledWith(target.value);
          valueConverters.one.toView.calls.reset();
          valueConverters.one.fromView.calls.reset();
          valueConverters.two.toView.calls.reset();
          valueConverters.two.fromView.calls.reset();
          expect(source.foo.bar).toBe(target.value);
          binding.unbind();
          expect(sourceObserver.hasSubscribers()).toBe(false);
          expect(argObserver.hasSubscribers()).toBe(false);
          expect(binding.targetProperty.hasSubscribers()).toBe(false);
          source.foo.bar = 'test';
          setTimeout(() => {
            expect(valueConverters.one.toView).not.toHaveBeenCalled();
            expect(valueConverters.one.fromView).not.toHaveBeenCalled();
            expect(valueConverters.two.toView).not.toHaveBeenCalled();
            expect(valueConverters.two.fromView).not.toHaveBeenCalled();
            expect(target.value).toBe('burrito');
            done();
          }, checkDelay * 2);
        }, checkDelay * 2);
      }, checkDelay * 2);
    }, checkDelay * 2);
  });

  it('handles BindingBehavior', done => {
    let bindingBehaviors = {
      one: { bind: (binding, source) => {}, unbind: (binding, source) => {} },
      two: { bind: (binding, source) => {}, unbind: (binding, source) => {} }
    }
    spyOn(bindingBehaviors.one, 'bind').and.callThrough();
    spyOn(bindingBehaviors.one, 'unbind').and.callThrough();
    spyOn(bindingBehaviors.two, 'bind').and.callThrough();
    spyOn(bindingBehaviors.two, 'unbind').and.callThrough();
    let lookupFunctions = { bindingBehaviors: name => bindingBehaviors[name] };
    let source = { foo: { bar: 'baz' }, arg: 'hello world' };
    let target = document.createElement('input');
    let bindingExpression = bindingEngine.createBindingExpression('value', 'foo.bar & one:arg & two', bindingMode.twoWay, lookupFunctions);
    let binding = bindingExpression.createBinding(target);
    function exerciseBindingBehavior(callback) {
      let scope = createScopeForTest(source);
      binding.bind(scope);
      expect(bindingBehaviors.one.bind).toHaveBeenCalledWith(binding, scope, 'hello world');
      expect(bindingBehaviors.two.bind).toHaveBeenCalledWith(binding, scope);
      expect(target.value).toBe(source.foo.bar);
      let sourceObserver = bindingEngine.observerLocator.getObserver(source.foo, 'bar');
      expect(sourceObserver.hasSubscribers()).toBe(true);
      let argObserver = bindingEngine.observerLocator.getObserver(source, 'arg');
      expect(argObserver.hasSubscribers()).toBe(false);
      expect(binding.targetProperty.hasSubscribers()).toBe(true);
      source.foo.bar = 'xup';
      setTimeout(() => {
        expect(target.value).toBe(source.foo.bar);
        source.arg = 'goodbye world';
        setTimeout(() => {
          expect(target.value).toBe(source.foo.bar);
          target.value = 'burrito';
          fireEvent(target, 'change');
          setTimeout(() => {
            expect(source.foo.bar).toBe(target.value);
            binding.unbind();
            expect(bindingBehaviors.one.unbind).toHaveBeenCalledWith(binding, scope);
            expect(bindingBehaviors.two.unbind).toHaveBeenCalledWith(binding, scope);
            expect(sourceObserver.hasSubscribers()).toBe(false);
            expect(argObserver.hasSubscribers()).toBe(false);
            expect(binding.targetProperty.hasSubscribers()).toBe(false);
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
