import {inject} from 'aurelia-dependency-injection';
import {BindingSignaler} from 'aurelia-templating-resources';

@inject(BindingSignaler)
export class App {
  postDateTime = new Date();

  constructor(signaler) {
    this.signaler = signaler;
  }

  signalBindings() {
    this.signaler.signal('my-signal');
  }
}

export class DemoTimeAgoValueConverter {
  toView(value) {
    // primitive for demonstration purposes:
    return Math.floor((new Date() - value) / 1000).toString() + ' seconds ago';
    // better to use: http://momentjs.com/docs/#/displaying/from/
  }
}
