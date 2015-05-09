export class NameExpression {
  constructor(name, mode){
    this.property = name;
    this.discrete = true;
    this.mode = mode.replace(/-([a-z])/g, (m, w) => w.toUpperCase());
  }

  createBinding(target){
    return new NameBinder(this.property, target, this.mode);
  }
}

class NameBinder {
  constructor(property, target, mode){
    this.property = property;

    if(mode === 'element'){
      this.target = target;
    } else {
      this.target = target[mode];

      if(this.target === undefined){
        throw new Error(`Attempted to reference "${mode}", but it was not found on the target element.`)
      }else{
        this.target = this.target.executionContext || this.target;
      }
    }
  }

  bind(source){
    if(this.source){
      if(this.source === source){
        return;
      }

      this.unbind();
    }

    this.source = source;
    source[this.property] = this.target;
  }

  unbind(){
    this.source[this.property] = null;
  }
}
