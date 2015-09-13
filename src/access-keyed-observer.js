const objectChangedContext = 'objectChanged';
const keyChangedContext = 'keyChanged';
const memberChangedContext = 'memberChanged';

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

  subscribe(context, callable) {
    this.context = context;
    this.callable = callable;
    this.objectInfo = this.expression.object.connect(this.binding, this.scope);
    if (this.objectInfo.observer) {
      this.objectInfo.observer.subscribe(objectChangedContext, this);
    }
    let key;
    if (this.expression.key) {
      // AccessKeyed
      this.keyInfo = this.expression.key.connect(this.binding, this.scope);
      key = this.keyInfo.value;
      if (this.keyInfo.observer) {
        this.keyInfo.observer.subscribe(keyChangedContext, this);
      }
    } else {
      // AccessMember
      key = this.expression.name;
    }
    this.subscribeMember(this.objectInfo.value, key);
  }

  unsubscribe(context, callable) {
    this.context = null;
    this.callable = null;
    if (this.objectInfo.observer) {
      this.objectInfo.observer.unsubscribe(objectChangedContext, this);
    }
    if (this.keyInfo && this.keyInfo.observer) {
      this.keyInfo.observer.unsubscribe(keyChangedContext, this);
    }
    this.unsubscribeMember();
  }

  subscribeMember(object, key) {
    this.unsubscribeMember();
    if (object instanceof Object && key !== null && key !== undefined) {
      this.memberObserver = this.binding.getObserver(object, key);
      this.memberObserver.subscribe(memberChangedContext, this);
    }
  }

  unsubscribeMember() {
    if (this.memberObserver) {
      this.memberObserver.unsubscribe(memberChangedContext, this);
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
    if (newValue === oldValue || !this.context) {
      return;
    }
    this.value = newValue;
    if (this.callable) {
      this.callable.call(this.context, newValue, oldValue);
    } else {
      this.context(newValue, oldValue);
    }
  }

  call(context, newValue, oldValue) {
    this[context](newValue, oldValue);
  }
}
