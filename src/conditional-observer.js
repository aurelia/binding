export class ConditionalObserver {
  constructor(binding, scope, conditionInfo, valueInfo, yes, no, evaluate) {
    this.binding = binding;
    this.scope = scope;
    this.conditionValue = !!conditionInfo.value;
    this.true = { expression: yes, connected: this.conditionValue };
    this.false = { expression: no, connected: !this.conditionValue };
    this.evaluate = evaluate;
    this.conditionSubscription = conditionInfo.observer.subscribe(this.conditionValueChanged.bind(this));
    this.valueChanged = newValue => this.notify(this.evaluate());
    if (valueInfo.observer) {
      this[this.conditionValue].observer = valueInfo.observer;
      this[this.conditionValue].subscription = valueInfo.observer.subscribe(this.valueChanged);
    }
  }

  conditionValueChanged(newValue) {
    var info;
    newValue = !!newValue;
    if (newValue !== this.conditionValue) {
      info = this[this.conditionValue];
      if (info.subscription) {
        info.subscription();
        info.subscription = null;
      }
      info = this[newValue];
      if (!info.connected) {
        info.observer = info.expression.connect(this.binding, this.scope).observer;
      }
      if (info.observer) {
        info.subscription = info.observer.subscribe(this.valueChanged);
      }
      this.conditionValue = newValue;
    }
    this.notify(this.evaluate());
  }

  subscribe(callback) {
    var that = this;
    that.callback = callback;
    return function() {
      that.callback = null;
    };
  }

  notify(newValue) {
    var callback = this.callback;

    if(callback){
      callback(newValue);
    }
  }

  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.binding = null;
    this.scope = null;
    this.callback = null;
    this.conditionSubscription();
    this.conditionSubscription = null;
    this.true.expression = null;
    this.false.expression = null;
    this.true.observer = null;
    this.false.observer = null;
    if (this.true.subscription) {
      this.true.subscription();
      this.true.subscription = null;
    }
    if (this.false.subscription) {
      this.false.subscription();
      this.false.subscription = null;
    }
  }
}
