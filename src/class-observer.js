export class ClassObserver {
  constructor(element) {
    this.element = element;
    this.doNotCache = true;
    this.value = '';
    this.version = 0;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    var nameIndex = this.nameIndex || {},
        version = this.version,
        names, name, i;

    // Add the classes, tracking the version at which they were added.
    if (newValue !== null && newValue !== undefined && newValue.length) {
      names = newValue.split(' ');
      i = names.length;
      while(i--) {
        name = names[i];
        if (name === '') {
          continue;
        }
        nameIndex[name] = version;
        this.element.classList.add(name);
      }
    }

    // Update state variables.
    this.value = newValue;
    this.nameIndex = nameIndex;
    this.version += 1;

    // First call to setValue?  We're done.
    if (version === 0) {
      return;
    }

    // Remove classes from previous version.
    version -= 1;
    for(name in nameIndex) {
      if (!nameIndex.hasOwnProperty(name) || nameIndex[name] !== version) {
        continue;
      }
      this.element.classList.remove(name);
    }
  }

  subscribe(callback) {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "class" property is not supported.`);
  }
}
