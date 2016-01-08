export class NetWorth {
  constructor() {
    this.update();
    setInterval(() => this.update(), 1000);
  }

  update() {
    this.currentDate = new Date();
    this.netWorth = Math.random() * 1000000000;
  }
}
