var hyphenMatcher = /-([a-z])/gi;

function toUpperCase(match, char, index, str) {
  return char.toUpperCase();
}

export class NameExpression {
  constructor(attribute, value){
    this.attribute = attribute;
    this.property = attribute.replace(hyphenMatcher, toUpperCase); 
    this.discrete = true;
    this.mode = (value || 'model').toLowerCase();
  }

  createBinding(target){
    return new NameBinder(this.property, target, this.mode);
  }
}

class NameBinder {
  constructor(property, target, mode){
    this.property = property;

    switch(mode){
      case 'model':
        this.target = target.primaryBehavior ? target.primaryBehavior.executionContext : target;
        break;
      case 'element':
        this.target = target;
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