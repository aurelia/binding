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
});
