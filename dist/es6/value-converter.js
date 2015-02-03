import {ResourceType} from 'aurelia-metadata';

var capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char){
  return "-" + char.toLowerCase();
}

function hyphenate(name){
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

export class ValueConverter extends ResourceType {
  constructor(name){
    this.name = name;
  }

  static convention(name){
    if(name.endsWith('ValueConverter')){
      return new ValueConverter(hyphenate(name.substring(0, name.length-14)));
    }
  }

  load(container, target){
    this.instance = container.get(target);
    return Promise.resolve(this);
  }

  register(registry, name){
    registry.registerValueConverter(name || this.name, this.instance);
  }
}
