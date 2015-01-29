export class NameExpression {
  constructor(name, mode){
    this.property = name;
    this.discrete = true;
    this.mode = (mode || 'view-model').toLowerCase();
  }

  createBinding(target){
    return new NameBinder(this.property, target, this.mode);
  }
}

class NameBinder {
  constructor(property, target, mode){
    this.property = property;

    switch(mode){
      case 'element':
        this.target = target;
        break;
      case 'view-model':
        this.target = target.primaryBehavior ? target.primaryBehavior.executionContext : target;
        break;
      default:
        throw new Error('Name expressions do not support mode: ' + mode);
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
