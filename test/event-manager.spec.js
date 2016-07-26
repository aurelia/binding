import './setup';
import {DOM} from 'aurelia-pal';
import {EventManager} from '../src/event-manager';

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

      dispose = handler.subscribe(element, callback);
      element.dispatchEvent(inputEvent);
      expect(callback).toHaveBeenCalledWith(inputEvent);

      expect(dispose).toBeDefined();
      dispose();
    });
  });

  describe('addEventListener', () => {
    const em = new EventManager();

    it('bubbles properly', () => {
      const one = document.createElement('div');
      const two = document.createElement('div');
      const three = document.createElement('div');
      document.body.appendChild(one);
      one.appendChild(two);
      two.appendChild(three);

      const oneClick = jasmine.createSpy('one-click');
      const threeClick = jasmine.createSpy('three-click');
      const oneFoo = jasmine.createSpy('one-foo');
      const threeFoo = jasmine.createSpy('three-foo');

      em.addEventListener(one, 'click', oneClick, false);
      em.addEventListener(three, 'click', threeClick, false);
      em.addEventListener(one, 'foo', oneFoo, true);
      em.addEventListener(three, 'foo', threeFoo, true);

      // click event (not delegated)
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

      // foo event (delegate)
      const threeFooEvent = DOM.createCustomEvent('foo', { bubbles: true });
      three.dispatchEvent(threeFooEvent);
      expect(threeFoo).toHaveBeenCalledWith(threeFooEvent);
      expect(oneFoo).toHaveBeenCalledWith(threeFooEvent);
      oneFoo.calls.reset();
      threeFoo.calls.reset();

      const twoFooEvent = DOM.createCustomEvent('foo', { bubbles: true });
      two.dispatchEvent(twoFooEvent);
      expect(threeFoo).not.toHaveBeenCalledWith(twoFooEvent);
      expect(oneFoo).toHaveBeenCalledWith(twoFooEvent);
      oneFoo.calls.reset();
      threeFoo.calls.reset();

      const oneFooEvent = DOM.createCustomEvent('foo', { bubbles: true });
      one.dispatchEvent(oneFooEvent);
      expect(threeFoo).not.toHaveBeenCalledWith(threeFooEvent);
      expect(oneFoo).toHaveBeenCalledWith(oneFooEvent);
      oneFoo.calls.reset();
      threeFoo.calls.reset();
    });
  });
});
