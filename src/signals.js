const signals = {};

export function connectBindingToSignal(binding, name) {
  if (!signals.hasOwnProperty(name)) {
    signals[name] = 0;
  }
  binding.observeProperty(signals, name);
}

export function signalBindings(name) {
  if (signals.hasOwnProperty(name)) {
    signals[name]++;
  }
}
