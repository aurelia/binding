import {EventManager} from '../src/event-manager';
import {createElement, createEvent} from './shared';
import {initialize} from 'aurelia-pal-browser';

describe('EventManager', () => {
  beforeAll(() => initialize());

  describe('getElementHandler', () => {
    var em;
    beforeAll(() => em = new EventManager());

    it('handles input', () => {
      var element = createElement('<input>');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'checked')).not.toBeNull();
      expect(em.getElementHandler(element, 'files')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles textarea', () => {
      var element = createElement('<textarea></textarea>');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles select', () => {
      var element = createElement('<select></select>');

      expect(em.getElementHandler(element, 'value')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles textContent and innerHTML properties', () => {
      var element = createElement('<div></div>');

      expect(em.getElementHandler(element, 'textContent')).not.toBeNull();
      expect(em.getElementHandler(element, 'innerHTML')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('handles scrollTop and scrollLeft properties', () => {
      var element = createElement('<div></div>');

      expect(em.getElementHandler(element, 'scrollTop')).not.toBeNull();
      expect(em.getElementHandler(element, 'scrollLeft')).not.toBeNull();
      expect(em.getElementHandler(element, 'id')).toBeNull();
    });

    it('can subscribe', () => {
      var element = createElement('<input value="foo">'),
          handler = em.getElementHandler(element, 'value'),
          dispose,
          callback = jasmine.createSpy('callback'),
          inputEvent = createEvent('input');
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
