var hyphenMatcher = /-([a-z])/gi;

function toUpperCase(match, char, index, str) {
  return char.toUpperCase();
}

export class NameExpression {
  constructor(attribute){
    this.attribute = attribute;
    this.property = attribute.replace(hyphenMatcher, toUpperCase); 
    this.discrete = true;
  }

  createBinding(target){
    return new NameBinder(this.property, target);
  }
}

class NameBinder {
  constructor(property, target){
    this.property = property;
    this.target = target.primaryBehavior ? target.primaryBehavior.executionContext : target;
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