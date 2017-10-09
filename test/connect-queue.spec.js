import './setup';
import {PLATFORM, DOM} from 'aurelia-pal';
import {Container} from 'aurelia-dependency-injection';
import {TaskQueue} from 'aurelia-task-queue';
import {BindingEngine} from '../src/binding-engine';
import {bindingMode} from '../src/binding-mode';
import {createOverrideContext} from '../src/scope';

describe('connect-queue', () => {
  let bindingEngine, taskQueue;

  beforeEach(() => {
    let container = new Container();
    taskQueue = container.get(TaskQueue);
    bindingEngine = container.get(BindingEngine);
  });

  it('connects two-way bindings immediately', done => {
    let expression = bindingEngine.createBindingExpression('value', 'foo', bindingMode.twoWay);
    let source = { bindingContext: { foo: 'bar' } };
    source.overrideContext = createOverrideContext(source.bindingContext);
    let targets = [];
    for (let i = 1; i <= 101; i++) {
      let target = DOM.createElement('input');
      targets.push(target);
      let binding = expression.createBinding(target);
      binding.bind(source);
      expect(target.value).toBe('bar');
    }
    source.bindingContext.foo = 'baz';
    taskQueue.queueMicroTask({
      call: () => {
        let i = targets.length;
        while (i--) {
          expect(targets[i].value).toBe('baz');
        }
        done();
      }
    });
  });

  it('connects 100 bindings immediately before queueing rest', done => {
    let expression = bindingEngine.createBindingExpression('value', 'foo', bindingMode.toView);
    let source = { bindingContext: { foo: 'bar' } };
    source.overrideContext = createOverrideContext(source.bindingContext);
    let targets = [];
    for (let i = 1; i <= 101; i++) {
      let target = DOM.createElement('input');
      targets.push(target);
      let binding = expression.createBinding(target);
      binding.bind(source);
      expect(target.value).toBe('bar');
    }
    source.bindingContext.foo = 'baz';
    taskQueue.queueMicroTask({
      call: () => {
        let i = targets.length - 1;
        expect(targets[i].value).toBe('bar');
        while (i--) {
          expect(targets[i].value).toBe('baz');
        }
        setTimeout(() => {
          expect(targets[targets.length - 1].value).toBe('baz');
          done();
        });
      }
    });
  });

  it('handles bindings that unbind before queue flushes', done => {
    let expression = bindingEngine.createBindingExpression('value', 'foo', bindingMode.toView);
    let source = { bindingContext: { foo: 'bar' } };
    source.overrideContext = createOverrideContext(source.bindingContext);
    for (let i = 1; i <= 100; i++) {
      expression.createBinding(DOM.createElement('input')).bind(source);
    }
    let target = DOM.createElement('input');
    let binding = expression.createBinding(target);
    binding.bind(source);
    expect(target.value).toBe('bar');
    source.bindingContext.foo = 'baz';
    binding.unbind();
    setTimeout(() => {
      expect(target.value).toBe('bar');
      done();
    });
  });
});
