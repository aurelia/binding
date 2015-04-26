import core from 'core-js';

function camelCase(name){
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export class ValueConverterResource {
  constructor(name){
    this.name = name;
  }

  static convention(name){
    if(name.endsWith('ValueConverter')){
      return new ValueConverterResource(camelCase(name.substring(0, name.length-14)));
    }
  }

  analyze(container, target){
    this.instance = container.get(target);
  }

  register(registry, name){
    registry.registerValueConverter(name || this.name, this.instance);
  }

  load(container, target){
    return Promise.resolve(this);
  }
}
