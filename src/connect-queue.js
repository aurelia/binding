import {PLATFORM} from 'aurelia-pal';

const bindings = new Map();    // the connect queue
const minimumImmediate = 100;  // number of bindings we should connect immediately before resorting to queueing
const frameBudget = 15;        // milliseconds allotted to each frame for flushing queue

let isFlushRequested = false;  // whether a flush of the connect queue has been requested
let immediate = 0;             // count of bindings that have been immediately connected

function flush(animationFrameStart) {
  let i = 0;
  let keys = bindings.keys();
  let item;

  while (item = keys.next()) { // eslint-disable-line no-cond-assign
    if (item.done) {
      break;
    }

    let binding = item.value;
    bindings.delete(binding);
    binding.connect(true);
    i++;
    // periodically check whether the frame budget has been hit.
    // this ensures we don't call performance.now a lot and prevents starving the connect queue.
    if (i % 100 === 0 && PLATFORM.performance.now() - animationFrameStart > frameBudget) {
      break;
    }
  }

  if (bindings.size) {
    PLATFORM.requestAnimationFrame(flush);
  } else {
    isFlushRequested = false;
    immediate = 0;
  }
}

export function enqueueBindingConnect(binding) {
  if (immediate < minimumImmediate) {
    immediate++;
    binding.connect(false);
  } else {
    bindings.set(binding);
  }
  if (!isFlushRequested) {
    isFlushRequested = true;
    PLATFORM.requestAnimationFrame(flush);
  }
}
