import './setup';
import {DOM} from 'aurelia-pal';
import {EventManager, delegationStrategy} from '../src/event-manager';

describe('EventManager', () => {
  describe('getElementHandler', () => {
    var em;
    beforeAll(() => em = new EventManager());

    it('handles input', () => {
      var element = DOM.createElement('input');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'checked')).not.toBeNull();
      expect(em.getElementHandler(element, 'files')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles textarea', () => {
      var element = DOM.createElement('textarea');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles select', () => {
      var element = DOM.createElement('select');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles textContent and innerHTML properties', () => {
      var element = DOM.createElement('div');

      expect(em.getElementHandler(element, 'textContent')).not.toBeNull();
      expect(em.getElementHandler(element, 'innerHTML')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles scrollTop and scrollLeft properties', () => {
      var element = DOM.createElement('div');

      expect(em.getElementHandler(element, 'scrollTop')).not.toBeNull();
      expect(em.getElementHandler(element, 'scrollLeft')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('can subscribe', () => {
      var element = DOM.createElement('input'),
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
    const em = new EventManager();
    const one = document.createElement('div');
    const two = document.createElement('div');
    const three = document.createElement('div');

    const oneClick = jasmine.createSpy('one-click');
    const threeClick = jasmine.createSpy('three-click');
    const oneDelegate = jasmine.createSpy('one-delegate');
    const threeDelegate = jasmine.createSpy('three-delegate');

    beforeEach(() => {
      document.body.appendChild(one);
      one.appendChild(two);
      two.appendChild(three);

      em.addEventListener(one, 'click', oneClick, delegationStrategy.none);
      em.addEventListener(three, 'click', threeClick, delegationStrategy.none);
      em.addEventListener(one, 'delegate', oneDelegate, delegationStrategy.bubbling);
      em.addEventListener(three, 'delegate', threeDelegate, delegationStrategy.bubbling);
    });

    afterEach(() => {
      one.parentNode.removeChild(one);
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
      oneClick.calls.reset();
      threeClick.calls.reset();
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
      oneDelegate.calls.reset();
      threeDelegate.calls.reset();
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
        em.addEventListener(three, 'delegate', threeCapture, delegationStrategy.capturing, true),
      ];

      let threeClickEvent = DOM.createCustomEvent('click', { bubbles: true });
      three.dispatchEvent(threeClickEvent);
      expect(threeClick).toHaveBeenCalledWith(threeClickEvent);
      expect(oneClick).toHaveBeenCalledWith(threeClickEvent);
      oneClick.calls.reset();
      threeClick.calls.reset();

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
      handlers[3].dispose();
      handlers[4].dispose();
      handlers[5].dispose();

      threeDelegateEvent = DOM.createCustomEvent('delegate', { bubbles: true });
      three.dispatchEvent(threeDelegateEvent);
      expect(threeDelegate).not.toHaveBeenCalled();
      expect(oneDelegate).not.toHaveBeenCalled();

      expect(threeCapture).not.toHaveBeenCalled();
      expect(oneCapture).not.toHaveBeenCalled();
    });
  });
});
