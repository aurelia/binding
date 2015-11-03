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
      case 'view-model':
        return getAU(element).controller.viewModel;
      case 'view':
        return getAU(element).controller.view;
      default:
        let target = getAU(element)[apiName];

        if (target === undefined) {
          throw new Error(`Attempted to reference "${apiName}", but it was not found amongst the target's API.`)
        }

        return target.viewModel;
    }
  }
}

class NameBinder {
  constructor(property, target) {
    this.property = property;
    this.target = target;
    this.source = null;
    this.context = null;
  }

  bind(source) {
    if (this.source !== null) {
      if (this.source === source) {
        return;
      }

      this.unbind();
    }

    this.source = source || null;
    this.context = source.bindingContext || source.overrideContext || null;

    if(this.context !== null) {
      this.context[this.property] = this.target;
    }
  }

  unbind() {
    if (this.source !== null) {
      this.source = null;
    }

    if(this.context !== null) {
      this.context[this.property] = null;
    }
  }
}
