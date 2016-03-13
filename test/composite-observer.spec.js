import './setup';
import {bindingMode} from '../src/binding-mode';
import {sourceContext} from '../src/connectable-binding';
import {
  createElement,
  checkDelay,
  createObserverLocator,
  getBinding
} from './shared';
import {createScopeForTest} from '../src/scope';

describe('CompositeObserver', () => {
  let observerLocator;

  beforeAll(() => {
    observerLocator = createObserverLocator();
  });

  it('handles Conditional expressions', done => {
    let obj = { condition: true, yes: 'yes', 'no': 'no' };
    let el = createElement('<div></div>');
    document.body.appendChild(el);
    let binding = getBinding(observerLocator, obj, 'condition ? yes : no', el, 'textContent', bindingMode.oneWay).binding;

    let conditionObserver = observerLocator.getObserver(obj, 'condition');
    let yesObserver = observerLocator.getObserver(obj, 'yes');
    let noObserver = observerLocator.getObserver(obj, 'no');
    expect(conditionObserver.hasSubscribers()).toBe(false);
    expect(yesObserver.hasSubscribers()).toBe(false);
    expect(noObserver.hasSubscribers()).toBe(false);

    binding.bind(createScopeForTest(obj));
    expect(conditionObserver.hasSubscribers()).toBe(true);
    expect(yesObserver.hasSubscribers()).toBe(true);
    expect(noObserver.hasSubscribers()).toBe(false);
    expect(el.textContent).toBe(obj.yes);

    obj.condition = false;
    setTimeout(() => {
      expect(conditionObserver.hasSubscribers()).toBe(true);
      expect(yesObserver.hasSubscribers()).toBe(false);
      expect(noObserver.hasSubscribers()).toBe(true);
      expect(el.textContent).toBe(obj.no);
      obj.no = 'noooo';

      setTimeout(() => {
        expect(el.textContent).toBe(obj.no);
        binding.unbind();
        expect(conditionObserver.hasSubscribers()).toBe(false);
        expect(yesObserver.hasSubscribers()).toBe(false);
        expect(noObserver.hasSubscribers()).toBe(false);
        let threw = false;
        try {
          binding.call(sourceContext);
        } catch(e) {
          threw = true;
        }
        expect(threw).toBe(false);
        document.body.removeChild(el);
        done();
      }, checkDelay * 2);
    }, checkDelay * 2);
  });

  it('handles Binary expressions', done => {
    let obj = { a: false, b: false, c: 1 };
    let el = createElement('<div></div>');
    document.body.appendChild(el);
    let binding = getBinding(observerLocator, obj, 'a && b || c', el, 'textContent', bindingMode.oneWay).binding;

    let aObserver = observerLocator.getObserver(obj, 'a');
    let bObserver = observerLocator.getObserver(obj, 'b');
    let cObserver = observerLocator.getObserver(obj, 'c');
    expect(aObserver.hasSubscribers()).toBe(false);
    expect(bObserver.hasSubscribers()).toBe(false);
    expect(cObserver.hasSubscribers()).toBe(false);

    binding.bind(createScopeForTest(obj));
    expect(aObserver.hasSubscribers()).toBe(true);
    expect(bObserver.hasSubscribers()).toBe(false);
    expect(cObserver.hasSubscribers()).toBe(true);
    expect(el.textContent).toBe(obj.c.toString());

    obj.a = true;
    setTimeout(() => {
      expect(aObserver.hasSubscribers()).toBe(true);
      expect(bObserver.hasSubscribers()).toBe(true);
      expect(cObserver.hasSubscribers()).toBe(true);
      expect(el.textContent).toBe(obj.c.toString());
      obj.b = true;

      setTimeout(() => {
        expect(el.textContent).toBe(obj.a.toString());
        expect(aObserver.hasSubscribers()).toBe(true);
        expect(bObserver.hasSubscribers()).toBe(true);
        expect(cObserver.hasSubscribers()).toBe(false);

        binding.unbind();
        expect(aObserver.hasSubscribers()).toBe(false);
        expect(bObserver.hasSubscribers()).toBe(false);
        expect(cObserver.hasSubscribers()).toBe(false);
        document.body.removeChild(el);
        done();
      }, checkDelay * 2);
    }, checkDelay * 2);
  });

  it('handles PrefixNot expressions', done => {
    let obj = { condition: true };
    let el = createElement('<div></div>');
    document.body.appendChild(el);
    let binding = getBinding(observerLocator, obj, '!condition', el, 'textContent', bindingMode.oneWay).binding;

    let conditionObserver = observerLocator.getObserver(obj, 'condition');
    expect(conditionObserver.hasSubscribers()).toBe(false);

    binding.bind(createScopeForTest(obj));
    expect(conditionObserver.hasSubscribers()).toBe(true);
    expect(el.textContent).toBe((!obj.condition).toString());

    obj.condition = false;
    setTimeout(() => {
      expect(conditionObserver.hasSubscribers()).toBe(true);
      expect(el.textContent).toBe((!obj.condition).toString());
      binding.unbind();
      expect(conditionObserver.hasSubscribers()).toBe(false);
      document.body.removeChild(el);
      done();
    }, checkDelay * 2);
  });

  it('handles CallScope expressions', done => {
    let obj = { a: 'a', b: 'b', test: (a, b) => a + b };
    let el = createElement('<div></div>');
    document.body.appendChild(el);
    let binding = getBinding(observerLocator, obj, 'test(a, b)', el, 'textContent', bindingMode.oneWay).binding;

    let aObserver = observerLocator.getObserver(obj, 'a');
    let bObserver = observerLocator.getObserver(obj, 'b');
    let testObserver = observerLocator.getObserver(obj, 'test');
    expect(aObserver.hasSubscribers()).toBe(false);
    expect(bObserver.hasSubscribers()).toBe(false);
    expect(testObserver.hasSubscribers()).toBe(false);

    binding.bind(createScopeForTest(obj));
    expect(aObserver.hasSubscribers()).toBe(true);
    expect(bObserver.hasSubscribers()).toBe(true);
    //expect(testObserver.hasSubscribers()).toBe(true);
    expect(el.textContent).toBe('ab');
    obj.a = 'aa';
    setTimeout(() => {
      expect(aObserver.hasSubscribers()).toBe(true);
      expect(bObserver.hasSubscribers()).toBe(true);
      //expect(testObserver.hasSubscribers()).toBe(true);
      expect(el.textContent).toBe('aab');

      binding.unbind();
      expect(aObserver.hasSubscribers()).toBe(false);
      expect(bObserver.hasSubscribers()).toBe(false);
      //expect(testObserver.hasSubscribers()).toBe(false);
      document.body.removeChild(el);
      done();
    }, checkDelay * 2);
  });

  it('handles CallScope expressions', done => {
    let foo = { obj: { a: 'a', b: 'b', test: (a, b) => a + b } };
    let obj = foo.obj;
    let el = createElement('<div></div>');
    document.body.appendChild(el);
    let binding = getBinding(observerLocator, foo, 'obj.test(obj.a, obj.b)', el, 'textContent', bindingMode.oneWay).binding;

    let aObserver = observerLocator.getObserver(obj, 'a');
    let bObserver = observerLocator.getObserver(obj, 'b');
    let testObserver = observerLocator.getObserver(obj, 'test');
    expect(aObserver.hasSubscribers()).toBe(false);
    expect(bObserver.hasSubscribers()).toBe(false);
    expect(testObserver.hasSubscribers()).toBe(false);

    binding.bind(createScopeForTest(foo));
    expect(aObserver.hasSubscribers()).toBe(true);
    expect(bObserver.hasSubscribers()).toBe(true);
    //expect(testObserver.hasSubscribers()).toBe(true);
    expect(el.textContent).toBe('ab');
    obj.a = 'aa';
    setTimeout(() => {
      expect(aObserver.hasSubscribers()).toBe(true);
      expect(bObserver.hasSubscribers()).toBe(true);
      //expect(testObserver.hasSubscribers()).toBe(true);
      expect(el.textContent).toBe('aab');

      binding.unbind();
      expect(aObserver.hasSubscribers()).toBe(false);
      expect(bObserver.hasSubscribers()).toBe(false);
      expect(testObserver.hasSubscribers()).toBe(false);
      document.body.removeChild(el);
      done();
    }, checkDelay * 2);
  });

  it('handles CallFunction expressions', done => {
    let foo = { obj: { a: 'a', b: 'b', test: (a, b) => a + b } };
    let obj = foo.obj;
    let el = createElement('<div></div>');
    document.body.appendChild(el);
    let binding = getBinding(observerLocator, foo, 'obj[\'test\'](obj.a, obj.b)', el, 'textContent', bindingMode.oneWay).binding;

    let aObserver = observerLocator.getObserver(obj, 'a');
    let bObserver = observerLocator.getObserver(obj, 'b');
    let testObserver = observerLocator.getObserver(obj, 'test');
    expect(aObserver.hasSubscribers()).toBe(false);
    expect(bObserver.hasSubscribers()).toBe(false);
    expect(testObserver.hasSubscribers()).toBe(false);

    binding.bind(createScopeForTest(foo));
    expect(aObserver.hasSubscribers()).toBe(true);
    expect(bObserver.hasSubscribers()).toBe(true);
    expect(testObserver.hasSubscribers()).toBe(true);
    expect(el.textContent).toBe('ab');
    obj.a = 'aa';
    setTimeout(() => {
      expect(aObserver.hasSubscribers()).toBe(true);
      expect(bObserver.hasSubscribers()).toBe(true);
      expect(testObserver.hasSubscribers()).toBe(true);
      expect(el.textContent).toBe('aab');

      binding.unbind();
      expect(aObserver.hasSubscribers()).toBe(false);
      expect(bObserver.hasSubscribers()).toBe(false);
      expect(testObserver.hasSubscribers()).toBe(false);
      document.body.removeChild(el);
      done();
    }, checkDelay * 2);
  });

  it('handles kitchen sink', done => {
    let foo = { obj: { a: 'a', b: 'b', test: (a, b) => a + b, yes: true, no: false, x: { y: { z: 'z' } } } };
    let obj = foo.obj;
    let el = createElement('<div></div>');
    document.body.appendChild(el);
    let binding = getBinding(observerLocator, foo, 'obj[\'test\'](obj.a, obj.b) && obj.test(obj.a, obj.b) && obj.yes && !!obj.x.y.z || obj.no', el, 'textContent', bindingMode.oneWay).binding;

    let objObserver = observerLocator.getObserver(foo, 'obj');
    let aObserver = observerLocator.getObserver(obj, 'a');
    let bObserver = observerLocator.getObserver(obj, 'b');
    let testObserver = observerLocator.getObserver(obj, 'test');
    let yesObserver = observerLocator.getObserver(obj, 'yes');
    let noObserver = observerLocator.getObserver(obj, 'no');
    let xObserver = observerLocator.getObserver(obj, 'x');
    let yObserver = observerLocator.getObserver(obj.x, 'y');
    let zObserver = observerLocator.getObserver(obj.x.y, 'z');
    expect(objObserver.hasSubscribers()).toBe(false);
    expect(aObserver.hasSubscribers()).toBe(false);
    expect(bObserver.hasSubscribers()).toBe(false);
    expect(testObserver.hasSubscribers()).toBe(false);
    expect(yesObserver.hasSubscribers()).toBe(false);
    expect(noObserver.hasSubscribers()).toBe(false);
    expect(xObserver.hasSubscribers()).toBe(false);
    expect(yObserver.hasSubscribers()).toBe(false);
    expect(zObserver.hasSubscribers()).toBe(false);

    binding.bind(createScopeForTest(foo));
    expect(objObserver.hasSubscribers()).toBe(true);
    expect(aObserver.hasSubscribers()).toBe(true);
    expect(bObserver.hasSubscribers()).toBe(true);
    expect(testObserver.hasSubscribers()).toBe(true);
    expect(yesObserver.hasSubscribers()).toBe(true);
    expect(noObserver.hasSubscribers()).toBe(false);
    expect(xObserver.hasSubscribers()).toBe(true);
    expect(yObserver.hasSubscribers()).toBe(true);
    expect(zObserver.hasSubscribers()).toBe(true);
    expect(el.textContent).toBe('true');
    obj.a = 0;
    obj.b = 0;
    setTimeout(() => {
      expect(objObserver.hasSubscribers()).toBe(true);
      expect(aObserver.hasSubscribers()).toBe(true);
      expect(bObserver.hasSubscribers()).toBe(true);
      expect(testObserver.hasSubscribers()).toBe(true);
      expect(yesObserver.hasSubscribers()).toBe(false);
      expect(noObserver.hasSubscribers()).toBe(true);
      expect(xObserver.hasSubscribers()).toBe(false);
      expect(yObserver.hasSubscribers()).toBe(false);
      expect(zObserver.hasSubscribers()).toBe(false);
      expect(el.textContent).toBe('false');
      obj.a = true;
      obj.b = true;
      obj.x = null;
      obj.no = 'hello world';
      setTimeout(() => {
        expect(objObserver.hasSubscribers()).toBe(true);
        expect(aObserver.hasSubscribers()).toBe(true);
        expect(bObserver.hasSubscribers()).toBe(true);
        expect(testObserver.hasSubscribers()).toBe(true);
        expect(yesObserver.hasSubscribers()).toBe(true);
        expect(noObserver.hasSubscribers()).toBe(true);
        expect(xObserver.hasSubscribers()).toBe(true);
        expect(yObserver.hasSubscribers()).toBe(false);
        expect(zObserver.hasSubscribers()).toBe(false);
        expect(el.textContent).toBe('hello world');

        binding.unbind();
        expect(objObserver.hasSubscribers()).toBe(false);
        expect(aObserver.hasSubscribers()).toBe(false);
        expect(bObserver.hasSubscribers()).toBe(false);
        expect(testObserver.hasSubscribers()).toBe(false);
        expect(yesObserver.hasSubscribers()).toBe(false);
        expect(noObserver.hasSubscribers()).toBe(false);
        expect(xObserver.hasSubscribers()).toBe(false);
        expect(yObserver.hasSubscribers()).toBe(false);
        expect(zObserver.hasSubscribers()).toBe(false);
        document.body.removeChild(el);
        done();
      }, checkDelay * 2);
    }, checkDelay * 2);
  });
});
