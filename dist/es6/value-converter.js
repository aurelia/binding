import {ResourceType} from 'aurelia-metadata';

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

function camelCase(name){
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export class ValueConverter extends ResourceType {
  constructor(name){
    this.name = name;
  }

  static convention(name){
    if(name.endsWith('ValueConverter')){
      return new ValueConverter(camelCase(name.substring(0, name.length-14)));
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
