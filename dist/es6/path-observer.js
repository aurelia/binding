export class PathObserver {
  constructor(leftObserver, getRightObserver, value){
    this.leftObserver = leftObserver;
    
    this.disposeLeft = leftObserver.subscribe((newValue) => {
      var newRightValue = this.updateRight(getRightObserver(newValue));
      this.notify(newRightValue);
    });

    this.updateRight(getRightObserver(value));
  }

  updateRight(observer){
    this.rightObserver = observer;

    if(this.disposeRight){
      this.disposeRight();
    }

    if(!observer){
      return null;
    }

    this.disposeRight = observer.subscribe(newValue => this.notify(newValue));
    return observer.getValue();
  }

  subscribe(callback){
    var that = this;
    that.callback = callback;
    return function(){
      that.callback = null;
    };
  }

  notify(newValue){
    var callback = this.callback;

    if(callback){
      callback(newValue);
    }
  }

  dispose(){
    if(this.disposeLeft){
      this.disposeLeft();
    }

    if(this.disposeRight){
      this.disposeRight();
    }
  }
}
