function getAU(element) {
  let au = element.au;

  if (au === undefined) {
    throw new Error('No Aurelia APIs are defined for the referenced element.');
  }

  return au;
}

export class NameExpression {
  constructor(property, apiName) {
    this.property = property;
    this.apiName = apiName;
    this.discrete = true;
  }

  createBinding(target) {
    return new NameBinder(this.property, NameExpression.locateAPI(target, this.apiName));
  }

  static locateAPI(element: Element, apiName: string): Object {
    switch (apiName) {
      case 'element':
        return element;
      case 'controller':
        return getAU(element).controller;
      case 'model':
      case 'view-model':
        return getAU(element).controller.model;
      case 'view':
        return getAU(element).controller.view;
      default:
        let target = getAU(element)[apiName];

        if (target === undefined) {
          throw new Error(`Attempted to reference "${apiName}", but it was not found amongst the target's API.`)
        }

        return target.model;
    }
  }
}

class NameBinder {
  constructor(property, target) {
    this.property = property;
    this.target = target;
  }

  bind(source) {
    if (this.source) {
      if (this.source === source) {
        return;
      }

      this.unbind();
    }

    this.source = source;
    source.bindingContext[this.property] = this.target;
  }

  unbind() {
    if (this.source) {
      this.source.bindingContext[this.property] = null;
      this.source = null;
    }
  }
}
