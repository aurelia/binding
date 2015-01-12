import {PathObserver} from './path-observer';
import {CompositeObserver} from './composite-observer';
import {
  ValueConverter,
  Assign,
  Conditional,
  AccessScope, 
  AccessMember,
  AccessKeyed,
  CallScope,
  CallMember,
  CallFunction,
  Binary,
  PrefixNot,
  LiteralPrimitive,
  LiteralString,
  LiteralArray,
  LiteralObject
} from './expressions/ast';

export function patchAST(){
  ValueConverter.prototype.connect = function(binding, scope){
    var observer,
        childObservers = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.allArgs.length; i<ii; ++i){
      exp = this.allArgs[i]
      expInfo = exp.connect(binding, scope);
          
      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.eval(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }

  Assign.prototype.connect = function(binding, scope){
    return { value: this.eval(scope, binding.valueConverterLookupFunction) };
  };

  Conditional.prototype.connect = function(binding, scope){
    var conditionInfo = this.condition.connect(binding, scope),
        yesInfo = this.yes.connect(binding, scope),
        noInfo = this.no.connect(binding, scope),
        childObservers = [],
        observer;

    if(conditionInfo.observer){
      childObservers.push(conditionInfo.observer);
    }

    if(yesInfo.observer){
      childObservers.push(yesInfo.observer);
    }

    if(noInfo.observer){
      childObservers.push(noInfo.observer);
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:(!!conditionInfo.value) ? yesInfo.value : noInfo.value,
      observer: observer
    }
  }

  AccessScope.prototype.connect = function(binding, scope){
    var observer = binding.getObserver(scope, this.name);

    return {
      value: observer.getValue(),
      observer: observer
    }
  }

  AccessMember.prototype.connect = function(binding, scope){
    var info = this.object.connect(binding, scope),
        objectInstance = info.value,
        objectObserver = info.observer,
        observer;

    if(objectObserver){
      observer = new PathObserver(
        objectObserver, 
        value => {
          if(value == null){
            return null;
          }

          return binding.getObserver(value, this.name)
        },
        objectInstance
        );
    }else{
      observer = binding.getObserver(objectInstance, this.name);
    }

    return {
      value: objectInstance == null ? null : objectInstance[this.name], //TODO: use prop abstraction
      observer: observer
    }
  }

  AccessKeyed.prototype.connect = function(binding, scope){
    var objectInfo = this.object.connect(binding, scope),
        keyInfo = this.key.connect(binding, scope),
        childObservers = [],
        observer;

    if(objectInfo.observer){
      childObservers.push(objectInfo.observer);
    }

    if(keyInfo.observer){
      childObservers.push(keyInfo.observer);
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.eval(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }

  CallScope.prototype.connect = function(binding, scope){
    var observer,
        childObservers = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);
          
      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.eval(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }

  CallMember.prototype.connect = function(binding, scope){
    var observer,
        objectInfo = this.object.connect(binding, scope),
        childObservers = [],
        i, ii, exp, expInfo;

    if(objectInfo.observer){
      childObservers.push(objectInfo.observer);
    }

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);
          
      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.eval(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }

  CallFunction.prototype.connect = function(binding, scope){
    var observer,
        funcInfo = this.func.connect(binding, scope),
        childObservers = [],
        i, ii, exp, expInfo;

    if(funcInfo.observer){
      childObservers.push(funcInfo.observer);
    }

    for(i = 0, ii = this.args.length; i<ii; ++i){
      exp = this.args[i];
      expInfo = exp.connect(binding, scope);
          
      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.eval(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }

  Binary.prototype.connect = function(binding, scope){
    var leftInfo = this.left.connect(binding, scope),
        rightInfo = this.right.connect(binding, scope),
        childObservers = [],
        observer;

    if(leftInfo.observer){
      childObservers.push(leftInfo.observer);
    }

    if(rightInfo.observer){
      childObservers.push(rightInfo.observer);
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:this.eval(scope, binding.valueConverterLookupFunction),
      observer:observer
    };
  }

  PrefixNot.prototype.connect = function(binding, scope){
    var info = this.expression.connect(binding, scope),
        observer;

    if(info.observer){
      observer = new CompositeObserver([info.observer], () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value: !info.value,
      observer: observer
    };
  }

  LiteralPrimitive.prototype.connect = function(binding, scope){
    return { value:this.value }
  }

  LiteralString.prototype.connect = function(binding, scope){
    return { value:this.value }
  }

  LiteralArray.prototype.connect = function(binding, scope) {
    var observer,
        childObservers = [],
        results = [],
        i, ii, exp, expInfo;

    for(i = 0, ii = this.elements.length; i<ii; ++i){
      exp = this.elements[i];
      expInfo = exp.connect(binding, scope);
          
      if(expInfo.observer){
        childObservers.push(expInfo.observer);
      }

      results[i] = expInfo.value;
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:results,
      observer:observer
    };
  }

  LiteralObject.prototype.connect = function(binding, scope){
    var observer,
        childObservers = [],
        instance = {},
        keys = this.keys,
        values = this.values,
        length = keys.length,
        i, valueInfo;

    for(i = 0; i < length; ++i){
      valueInfo = values[i].connect(binding, scope);

      if(valueInfo.observer){
        childObservers.push(valueInfo.observer);
      }

      instance[keys[i]] = valueInfo.value;
    }

    if(childObservers.length){
      observer = new CompositeObserver(childObservers, () => {
        return this.eval(scope, binding.valueConverterLookupFunction);
      });
    }

    return {
      value:instance,
      observer:observer
    };
  }
}