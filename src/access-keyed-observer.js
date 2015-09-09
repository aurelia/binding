export class AccessKeyedObserver {
  constructor(expression, scope, binding) {
    this.expression = expression;
    this.scope = scope;
    this.binding = binding;
    this.value = this.expression.evaluate(this.scope, this.binding.valueConverterLookupFunction);
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    this.value = newValue;
    this.expression.assign(this.scope, newValue);
  }

  subscribe(callback) {
    this.callback = callback;
    this.objectInfo = this.expression.object.connect(this.binding, this.scope);
    if (this.objectInfo.observer) {
      this.boundObjectChanged = this.objectChanged.bind(this);
      this.objectInfo.observer.subscribe(this.boundObjectChanged);
    }
    let key;
    if (this.expression.key) {
      // AccessKeyed
      this.keyInfo = this.expression.key.connect(this.binding, this.scope);
      key = this.keyInfo.value;
      if (this.keyInfo.observer) {
        this.boundKeyChanged = this.keyChanged.bind(this);
        this.keyInfo.observer.subscribe(this.boundKeyChanged);
      }
    } else {
      // AccessMember
      key = this.expression.name;
    }
    this.boundMemberChanged = this.memberChanged.bind(this);
    this.subscribeMember(this.objectInfo.value, key);
  }

  unsubscribe(callback) {
    this.callback = null;
    if (this.objectInfo.observer) {
      this.objectInfo.observer.unsubscribe(this.boundObjectChanged);
    }
    if (this.keyInfo && this.keyInfo.observer) {
      this.keyInfo.observer.unsubscribe(this.boundKeyChanged);
    }
    this.unsubscribeMember();
  }

  subscribeMember(object, key) {
    this.unsubscribeMember();
    if (object instanceof Object && key !== null && key !== undefined) {
      this.memberObserver = this.binding.getObserver(object, key);
      this.memberObserver.subscribe(this.boundMemberChanged);
    }
  }

  unsubscribeMember() {
    if (this.memberObserver) {
      this.memberObserver.unsubscribe(this.boundMemberChanged);
      this.memberObserver = null;
    }
  }

  objectChanged(newValue, oldValue) {
    this.memberChanged(this.expression.evaluate(this.scope, this.binding.valueConverterLookupFunction), this.value);
    this.unsubscribeMember();
    let key = this.expression.key ? this.expression.key.evaluate(this.scope, this.binding.valueConverterLookupFunction) : this.expression.name;
    this.subscribeMember(newValue, key);
  }

  keyChanged(newValue, oldValue) {
    this.memberChanged(this.expression.evaluate(this.scope, this.binding.valueConverterLookupFunction), this.value);
    this.unsubscribeMember();
    this.subscribeMember(this.expression.object.evaluate(this.scope, this.binding.valueConverterLookupFunction), newValue);
  }

  memberChanged(newValue, oldValue) {
    if (newValue === oldValue || !this.callback) {
      return;
    }
    this.value = newValue;
    this.callback(newValue, oldValue);
  }
}
