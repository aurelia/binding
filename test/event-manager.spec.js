import './setup';
import {DOM} from 'aurelia-pal';
import {EventManager, delegationStrategy} from '../src/event-manager';
import * as LogManager from 'aurelia-logging';

describe('EventManager', () => {
  describe('getElementHandler', () => {
    let em;
    beforeAll(() => em = new EventManager());

    it('handles input', () => {
      let element = DOM.createElement('input');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'checked')).not.toBeNull();
      expect(em.getElementHandler(element, 'files')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles textarea', () => {
      let element = DOM.createElement('textarea');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles select', () => {
      let element = DOM.createElement('select');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles textContent and innerHTML properties', () => {
      let element = DOM.createElement('div');

      expect(em.getElementHandler(element, 'textContent')).not.toBeNull();
      expect(em.getElementHandler(element, 'innerHTML')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles scrollTop and scrollLeft properties', () => {
      let element = DOM.createElement('div');

      expect(em.getElementHandler(element, 'scrollTop')).not.toBeNull();
      expect(em.getElementHandler(element, 'scrollLeft')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('can subscribe', () => {
      let element = DOM.createElement('input'),
        handler = em.getElementHandler(element, 'value'),
        dispose,
        callback = jasmine.createSpy('callback'),
        inputEvent = DOM.createCustomEvent('input');
      element.value = 'foo';
      expect(handler).toBeDefined();
      expect(handler.subscribe).toBeDefined();
      expect(handler.element).toBe(null);
      expect(handler.handler).toBe(null);

      handler.subscribe(element, callback);
      element.dispatchEvent(inputEvent);
      expect(callback).toHaveBeenCalledWith(inputEvent);

      expect(handler.element).toBeDefined();
      expect(handler.handler).toBeDefined();
      handler.dispose();
      expect(handler.element).toBe(null);
      expect(handler.handler).toBe(null);
    });
  });

  describe('addEventListener', () => {
    let em, one, two, three, shadowHost, shadowRoot, shadowButton, oneClick, threeClick, oneDelegate, threeDelegate, delegationEntryHandlers;

    beforeEach(() => {
      em = new EventManager();
      one = document.createElement('div');
      two = document.createElement('div');
      three = document.createElement('div');
      shadowHost = document.createElement('div');
      shadowButton = document.createElement('button');

      oneClick = jasmine.createSpy('one-click');
      threeClick = jasmine.createSpy('three-click');
      oneDelegate = jasmine.createSpy('one-delegate');
      threeDelegate = jasmine.createSpy('three-delegate');

      document.body.appendChild(one);
      one.appendChild(two);
      two.appendChild(three);
      one.appendChild(shadowHost);

      shadowRoot = shadowHost.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(shadowButton);

      delegationEntryHandlers = [
        em.addEventListener(one, 'click', oneClick, delegationStrategy.none, true),
        em.addEventListener(three, 'click', threeClick, delegationStrategy.none, true),
        em.addEventListener(one, 'delegate', oneDelegate, delegationStrategy.bubbling, true),
        em.addEventListener(three, 'delegate', threeDelegate, delegationStrategy.bubbling, true)
      ];
    });

    afterEach(() => {
      delegationEntryHandlers.forEach(delegationEntryHandler => delegationEntryHandler.dispose());
      one.remove();
    });

    it('bubbles properly when not delegated', () => {
      const threeClickEvent = DOM.createCustomEvent('click', { bubbles: true });
      three.dispatchEvent(threeClickEvent);
      expect(threeClick).toHaveBeenCalledWith(threeClickEvent);
      expect(oneClick).toHaveBeenCalledWith(threeClickEvent);
      oneClick.calls.reset();
      threeClick.calls.reset();

      const twoClickEvent = DOM.createCustomEvent('click', { bubbles: true });
      two.dispatchEvent(twoClickEvent);
      expect(threeClick).not.toHaveBeenCalledWith(twoClickEvent);
      expect(oneClick).toHaveBeenCalledWith(twoClickEvent);
      oneClick.calls.reset();
      threeClick.calls.reset();

      const oneClickEvent = DOM.createCustomEvent('click', { bubbles: true });
      one.dispatchEvent(oneClickEvent);
      expect(threeClick).not.toHaveBeenCalledWith(threeClickEvent);
      expect(oneClick).toHaveBeenCalledWith(oneClickEvent);
    });

    it('bubbles properly out of shadow dom when not delegated with composed flag', () => {
      em.escapeShadowRoot = true;
      const shadowButtonClickEvent = DOM.createCustomEvent('click', { bubbles: true, composed: true });
      shadowButton.dispatchEvent(shadowButtonClickEvent);
      expect(oneClick).toHaveBeenCalledWith(shadowButtonClickEvent);
    });

    it('should not bubble out of shadow dom when not delegated without composed flag', () => {
      em.escapeShadowRoot = true;
      const shadowButtonClickEvent = DOM.createCustomEvent('click', { bubbles: true });
      shadowButton.dispatchEvent(shadowButtonClickEvent);
      expect(oneClick).not.toHaveBeenCalledWith(shadowButtonClickEvent);
    });

    it('bubbles properly when delegated', () => {
      const threeDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true });
      three.dispatchEvent(threeDelegateEvent);
      expect(threeDelegate).toHaveBeenCalledWith(threeDelegateEvent);
      expect(oneDelegate).toHaveBeenCalledWith(threeDelegateEvent);
      oneDelegate.calls.reset();
      threeDelegate.calls.reset();

      const twoFooEvent = DOM.createCustomEvent('delegate', { bubbles: true });
      two.dispatchEvent(twoFooEvent);
      expect(threeDelegate).not.toHaveBeenCalledWith(twoFooEvent);
      expect(oneDelegate).toHaveBeenCalledWith(twoFooEvent);
      oneDelegate.calls.reset();
      threeDelegate.calls.reset();

      const oneDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true });
      one.dispatchEvent(oneDelegateEvent);
      expect(threeDelegate).not.toHaveBeenCalledWith(threeDelegateEvent);
      expect(oneDelegate).toHaveBeenCalledWith(oneDelegateEvent);
    });

    it('should not bubble out of shadow dom when escapeShadowRoot is not explicitly set', () => {
      const shadowButtonDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true, composed: true });
      shadowButton.dispatchEvent(shadowButtonDelegateEvent);
      expect(oneDelegate).not.toHaveBeenCalled();
    });

    it('bubbles properly out of shadow dom when delegated with composed flag', () => {
      em.escapeShadowRoot = true;
      const shadowButtonDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true, composed: true });
      shadowButton.dispatchEvent(shadowButtonDelegateEvent);
      expect(oneDelegate).toHaveBeenCalledWith(shadowButtonDelegateEvent);
    });

    it('should not bubble out of shadow dom when delegated without composed flag', () => {
      em.escapeShadowRoot = true;
      const shadowButtonDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true });
      shadowButton.dispatchEvent(shadowButtonDelegateEvent);
      expect(oneDelegate).not.toHaveBeenCalledWith(shadowButtonDelegateEvent);
    });

    it('stops bubbling when asked', () => {
      let wasCalled = false;
      let stopDelegate = (event) => {
        event.stopPropagation();
        wasCalled = true;
      };
      em.addEventListener(one, 'delegate', oneDelegate, delegationStrategy.bubbling);
      em.addEventListener(three, 'delegate', stopDelegate, delegationStrategy.bubbling);

      const threeDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true });
      three.dispatchEvent(threeDelegateEvent);

      expect(wasCalled).toBeTruthy();
      expect(oneDelegate).not.toHaveBeenCalledWith(threeDelegateEvent);
    });

    it('calls handleEvent', () => {
      let wasCalled = false;
      let listener = {
        handleEvent() {
          wasCalled = true;
        }
      };
      em.addEventListener(one, 'any', listener);

      one.dispatchEvent(DOM.createCustomEvent('any'));
      expect(wasCalled).toBe(true);
    });
  });

  describe('addEventListener using disposable', () => {
    const em = new EventManager();
    const one = document.createElement('div');
    const two = document.createElement('div');
    const three = document.createElement('div');

    let handlers = [];

    let originalWarn;
    beforeEach(() => {
      originalWarn = LogManager.Logger.prototype.warn;
      spyOn(LogManager.Logger.prototype, 'warn');
    });
    afterEach(() => {
      LogManager.Logger.prototype.warn = originalWarn;
    });
    it('dispose', () => {
      document.body.appendChild(one);
      one.appendChild(two);
      two.appendChild(three);

      const oneClick = jasmine.createSpy('one-click');
      const threeClick = jasmine.createSpy('three-click');
      const oneDelegate = jasmine.createSpy('one-delegate');
      const threeDelegate = jasmine.createSpy('three-delegate');
      const oneCapture = jasmine.createSpy('one-capture');
      const threeCapture = jasmine.createSpy('three-capture');

      handlers = [
        em.addEventListener(one, 'click', oneClick, delegationStrategy.none, true),
        em.addEventListener(three, 'click', threeClick, delegationStrategy.none, true),
        em.addEventListener(one, 'delegate', oneDelegate, delegationStrategy.bubbling, true),
        em.addEventListener(three, 'delegate', threeDelegate, delegationStrategy.bubbling, true),
        em.addEventListener(one, 'delegate', oneCapture, delegationStrategy.capturing, true),
        em.addEventListener(three, 'delegate', threeCapture, delegationStrategy.capturing, true)
      ];

      let threeClickEvent = DOM.createCustomEvent('click', { bubbles: true });
      three.dispatchEvent(threeClickEvent);
      expect(threeClick).toHaveBeenCalledWith(threeClickEvent);
      expect(oneClick).toHaveBeenCalledWith(threeClickEvent);
      oneClick.calls.reset();
      threeClick.calls.reset();

      let delegateBubblingCount = em.defaultEventStrategy.delegatedHandlers.delegate.count;

      handlers.push(
        em.addEventListener(one, 'delegate', oneDelegate, delegationStrategy.bubbling, true),
        em.addEventListener(three, 'delegate', threeDelegate, delegationStrategy.bubbling, true)
      );
      let delegateBubblingCountAfterDoubleSubscription = em.defaultEventStrategy.delegatedHandlers.delegate.count;
      expect(delegateBubblingCountAfterDoubleSubscription).toEqual(delegateBubblingCount, 'allows double subscription for bubbling');
      expect(LogManager.Logger.prototype.warn).toHaveBeenCalled();
      let delegateCaptureCount = em.defaultEventStrategy.delegatedHandlers.delegate.count;

      handlers.push(
        em.addEventListener(one, 'delegate', oneCapture, delegationStrategy.capturing, true),
        em.addEventListener(three, 'delegate', threeCapture, delegationStrategy.capturing, true),
      );
      expect(LogManager.Logger.prototype.warn).toHaveBeenCalledTimes(2);
      let delegateCaptureCountAfterDoubleSubscription = em.defaultEventStrategy.capturedHandlers.delegate.count;
      expect(delegateCaptureCountAfterDoubleSubscription).toEqual(delegateCaptureCount, 'allows double subscription for capture');

      handlers[0].dispose();
      handlers[1].dispose();

      threeClickEvent = DOM.createCustomEvent('click', { bubbles: true });
      three.dispatchEvent(threeClickEvent);
      expect(threeClick).not.toHaveBeenCalled();
      expect(oneClick).not.toHaveBeenCalled();

      // With strategy
      let threeDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true });
      three.dispatchEvent(threeDelegateEvent);
      expect(threeDelegate).toHaveBeenCalledWith(threeDelegateEvent);
      expect(oneDelegate).toHaveBeenCalledWith(threeDelegateEvent);

      expect(threeCapture).toHaveBeenCalledWith(threeDelegateEvent);
      expect(oneCapture).toHaveBeenCalledWith(threeDelegateEvent);
      oneDelegate.calls.reset();
      threeDelegate.calls.reset();
      threeCapture.calls.reset();
      oneCapture.calls.reset();

      handlers[2].dispose();
      let delegateBubblingCountBeforeDisposingDisposed = em.defaultEventStrategy.delegatedHandlers.delegate.count;
      handlers[2].dispose();
      let delegateBubblingCountAfterDisposingDisposed = em.defaultEventStrategy.delegatedHandlers.delegate.count;
      expect(delegateBubblingCountAfterDisposingDisposed).toEqual(delegateBubblingCountBeforeDisposingDisposed, 'allows double disposing for bubbling');
      expect(LogManager.Logger.prototype.warn).toHaveBeenCalledTimes(3);
      handlers[3].dispose();

      handlers[4].dispose();
      let delegateCaptureCountBeforeDisposingDisposed = em.defaultEventStrategy.capturedHandlers.delegate.count;
      handlers[4].dispose();
      let delegateCaptureCountAfterDisposingDisposed = em.defaultEventStrategy.capturedHandlers.delegate.count;
      expect(delegateCaptureCountAfterDisposingDisposed).toEqual(delegateCaptureCountBeforeDisposingDisposed, 'allows double disposing for bubbling');
      expect(LogManager.Logger.prototype.warn).toHaveBeenCalledTimes(4);
      handlers[5].dispose();

      em.defaultEventStrategy.capturedHandlers.delegate.decrement();
      expect(LogManager.Logger.prototype.warn).toHaveBeenCalledTimes(5);
      em.defaultEventStrategy.delegatedHandlers.delegate.decrement();
      expect(LogManager.Logger.prototype.warn).toHaveBeenCalledTimes(6);

      threeDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true });
      three.dispatchEvent(threeDelegateEvent);
      expect(threeDelegate).not.toHaveBeenCalled();
      expect(oneDelegate).not.toHaveBeenCalled();

      expect(threeCapture).not.toHaveBeenCalled();
      expect(oneCapture).not.toHaveBeenCalled();
    });
  });
});
