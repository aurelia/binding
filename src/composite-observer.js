export class CompositeObserver {
  constructor(observers, evaluate){
    this.subscriptions = new Array(observers.length);
    this.evaluate = evaluate;

    for(var i = 0, ii = observers.length; i < ii; i++){
      this.subscriptions[i] = observers[i].subscribe((newValue) => {
        this.notify(this.evaluate());
      });
    }
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
    var subscriptions = this.subscriptions;

    var i = subscriptions.length;
    while(i--) {
      subscriptions[i]();
    }
  }
}
