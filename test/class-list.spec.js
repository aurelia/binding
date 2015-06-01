describe('classList', () => {
  it('Element', () => {
    var element = document.createElement('p');
    element.classList.add('foo');
    expect(element.className).toBe('foo');
    element.classList.add('bar');
    expect(element.className).toBe('foo bar');
    element.classList.remove('foo');
    expect(element.className).toBe('bar');
    element.classList.remove('bar');
    expect(element.className).toBe('');
  });
});

describe('classList', () => {
  it('SVGElement', () => {
    var element = document.createElementNS('http://www.w3.org/2000/svg','g');
    element.classList.add('foo');
    expect(element.className.baseVal).toBe('foo');
    element.classList.add('bar');
    expect(element.className.baseVal).toBe('foo bar');
    element.classList.remove('foo');
    expect(element.className.baseVal).toBe('bar');
    element.classList.remove('bar');
    expect(element.className.baseVal).toBe('');
  });
});
