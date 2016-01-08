export class App {
  firstName = 'John';
  lastName = 'Doe';

  mouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  mouseMove200(e) {
    this.mouse200X = e.clientX;
    this.mouse200Y = e.clientY;
  }

  mouseMove800(e) {
    this.mouse800X = e.clientX;
    this.mouse800Y = e.clientY;
  }
}
