export class App {
  firstName = 'John';
  lastName = 'Doe';
  intercepted = [];
  myFunc;

  constructor() {
    this.myFunc = (method, update, value) => {
      // log the intercepted binding method.
      let info = {
        color: '#'+Math.floor(Math.random()*16777215).toString(16),
        method: method,
        value: value
      };

      this.intercepted.splice(0, 0, info);
      // call the intercepted binding method.
      update(value);
    };
  }

  mouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  clear() {
    this.firstName = '';
    this.lastName = '';
  }
}

const interceptMethods = ['updateTarget', 'updateSource', 'callSource'];

export class DemoInterceptBindingBehavior {
  bind(binding, scope, interceptor) {
    let i = interceptMethods.length;
    while (i--) {
      let method = interceptMethods[i];
      if (!binding[method]) {
        continue;
      }

      binding[`intercepted-${method}`] = binding[method];
      let update = binding[method].bind(binding);
      binding[method] = interceptor.bind(binding, method, update);
    }
  }

  unbind(binding, scope) {
    let i = interceptMethods.length;
    while (i--) {
      let method = interceptMethods[i];
      if (!binding[method]) {
        continue;
      }

      binding[method] = binding[`intercepted-${method}`];
      binding[`intercepted-${method}`] = null;
    }
  }
}
