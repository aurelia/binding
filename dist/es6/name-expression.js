export class NameExpression {
  constructor(name, mode){
    this.property = name;
    this.discrete = true;
    this.mode = mode;
  }

  createBinding(target){
    return new NameBinder(this.property, target, this.mode);
  }
}

class NameBinder {
  constructor(property, target, mode){
    this.property = property;

    switch (mode) {
      case 'element':
        this.target = target;
        break;
      case 'view-model':
        this.target = target.primaryBehavior.executionContext;
        break;
      default:
        this.target = target[mode];

        if(this.target === undefined){
          throw new Error(`Attempted to reference "${mode}", but it was not found on the target element.`)
        }else{
          this.target = this.target.executionContext || this.target;
        }

        break;
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
