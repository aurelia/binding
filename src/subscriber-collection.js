function addSubscriber(subscriber) {
  if (this.hasSubscriber(subscriber)) {
    return false;
  }
  if (!this._subscriber0) {
    this._subscriber0 = subscriber;
    return true;
  }
  if (!this._subscriber1) {
    this._subscriber1 = subscriber;
    return true;
  }
  if (!this._subscriber2) {
    this._subscriber2 = subscriber;
    return true;
  }
  if (!this._subscribersRest) {
    this._subscribersRest = [subscriber];
    return true;
  }
  this._subscribersRest.push(subscriber);
  return true;
}

function removeSubscriber(subscriber) {
  if (this._subscriber0 === subscriber) {
    this._subscriber0 = null;
    return true;
  }
  if (this._subscriber1 === subscriber) {
    this._subscriber1 = null;
    return true;
  }
  if (this._subscriber2 === subscriber) {
    this._subscriber2 = null;
    return true;
  }
  let rest = this._subscribersRest;
  let index;
  if (!rest || !rest.length || (index = rest.indexOf(subscriber)) === -1) {
    return false;
  }
  rest.splice(index, 1);
  return true;
}

let tempRest = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

function callSubscribers(newValue, oldValue) {
  let subscriber0 = this._subscriber0;
  let subscriber1 = this._subscriber1;
  let subscriber2 = this._subscriber2;
  let length = !this._subscribersRest ? 0 : this._subscribersRest.length;
  let i = length;
  if (length) {
    while(i--) {
      tempRest[i] = this._subscribersRest[i];
    }
  }

  if (subscriber0) {
    subscriber0(newValue, oldValue);
  }
  if (subscriber1) {
    subscriber1(newValue, oldValue);
  }
  if (subscriber2) {
    subscriber2(newValue, oldValue);
  }
  for (i = 0; i < length; i++) {
    tempRest[i](newValue, oldValue);
    tempRest[i] = null;
  }
}

function hasSubscribers() {
  return !!(
    this._subscriber0
    || this._subscriber1
    || this._subscriber2
    || this._subscribersRest && this._subscribersRest.length);
}

function hasSubscriber(subscriber) {
  return this._subscriber0 === subscriber
    || this._subscriber1 === subscriber
    || this._subscriber2 === subscriber
    || !!this._subscribersRest && this._subscribersRest.indexOf(subscriber) !== -1;
}

export function subscriberCollection() {
  return function(target) {
    target.prototype.addSubscriber = addSubscriber;
    target.prototype.removeSubscriber = removeSubscriber;
    target.prototype.callSubscribers = callSubscribers;
    target.prototype.hasSubscribers = hasSubscribers;
    target.prototype.hasSubscriber = hasSubscriber;
  }
}
