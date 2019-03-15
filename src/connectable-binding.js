import {sourceContext} from './call-context';


const slotNames = [];
const versionSlotNames = [];
let lastSlot = -1;
function ensureEnoughSlotNames(currentSlot) {
  if (currentSlot === lastSlot) {
    lastSlot += 5;
    const ii = slotNames.length = versionSlotNames.length = lastSlot + 1;
    for (let i = currentSlot + 1; i < ii; ++i) {
      slotNames[i] = `_observer${i}`;
      versionSlotNames[i] = `_observerVersion${i}`;
    }
  }
}
ensureEnoughSlotNames(-1);

function addObserver(observer) {
  // find the observer.
  let observerSlots = this._observerSlots === undefined ? 0 : this._observerSlots;
  let i = observerSlots;
  while (i-- && this[slotNames[i]] !== observer) {
    // Do nothing
  }

  // if we are not already observing, put the observer in an open slot and subscribe.
  if (i === -1) {
    i = 0;
    while (this[slotNames[i]]) {
      i++;
    }
    this[slotNames[i]] = observer;
    observer.subscribe(sourceContext, this);
    // increment the slot count.
    if (i === observerSlots) {
      this._observerSlots = i + 1;
    }
  }
  // set the "version" when the observer was used.
  if (this._version === undefined) {
    this._version = 0;
  }
  this[versionSlotNames[i]] = this._version;
  ensureEnoughSlotNames(i);
}

function observeProperty(obj, propertyName) {
  let observer = this.observerLocator.getObserver(obj, propertyName);
  addObserver.call(this, observer);
}

function observeArray(array) {
  let observer = this.observerLocator.getArrayObserver(array);
  addObserver.call(this, observer);
}

function unobserve(all) {
  let i = this._observerSlots;
  while (i--) {
    if (all || this[versionSlotNames[i]] !== this._version) {
      let observer = this[slotNames[i]];
      this[slotNames[i]] = null;
      if (observer) {
        observer.unsubscribe(sourceContext, this);
      }
    }
  }
}

export function connectable() {
  return function(target) {
    target.prototype.observeProperty = observeProperty;
    target.prototype.observeArray = observeArray;
    target.prototype.unobserve = unobserve;
    target.prototype.addObserver = addObserver;
  };
}
