import { bindingMode } from './binding-mode';

function getAU(element) {
  let au = element.au;

  if (au === undefined) {
    throw new Error(`No Aurelia APIs are defined for the element: "${element.tagName}".`);
  }

  return au;
}

export class NameExpression {
  constructor(sourceExpression, apiName, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.apiName = apiName;
    this.lookupFunctions = lookupFunctions;
    this.discrete = true;
  }

  createBinding(target) {
    return new NameBinder(this.sourceExpression, NameExpression.locateAPI(target, this.apiName), this.lookupFunctions);
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
        throw new Error(`Attempted to reference "${apiName}", but it was not found amongst the target's API.`);
      }

      return target.viewModel;
    }
  }
}

class NameBinder {
  /**
   * Name binding for reference
   * @param {Expression} sourceExpression
   * @param {any} target
   * @param {any} lookupFunctions
   */
  constructor(sourceExpression, target, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.lookupFunctions = lookupFunctions;
    this.mode = bindingMode.oneTime;
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;
    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this.sourceExpression.assign(this.source, this.target, this.lookupFunctions);
  }

  call() {
    this.sourceExpression.assign(this.source, this.target, this.lookupFunctions);
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    const { source, lookupFunctions, sourceExpression } = this;
    if (sourceExpression.evaluate(source, lookupFunctions) === this.target) {
      sourceExpression.assign(source, null, lookupFunctions);
    }
    if (sourceExpression.unbind) {
      sourceExpression.unbind(this, source);
    }
    this.source = null;
  }
}
