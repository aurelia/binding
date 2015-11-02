interface OverrideContext {
  parentOverrideContext: OverrideContext;
  bindingContext: any;
}

// view instances implement this interface
interface Scope {
  bindingContext: any;
  overrideContext: OverrideContext;
}

export function createOverrideContext(bindingContext?: any, parentOverrideContext?: OverrideContext): OverrideContext {
  return {
    bindingContext: bindingContext,
    parentOverrideContext: parentOverrideContext || null
  };
}

export function getContextFor(name: string, scope: Scope, ancestor: number): any {
  // traverse the context and it's ancestors, searching for a context that has
  // the name.
  let oc = scope.overrideContext;
  while (ancestor && oc) {
    ancestor--;
    oc = oc.parentOverrideContext;
  }
  if (ancestor || !oc) {
    return undefined;
  }
  while (oc && !(name in oc) && !(oc.bindingContext && name in oc.bindingContext)) {
    oc = oc.parentOverrideContext;
  }
  if (oc) {
    // we located a context with the property.  return it.
    return name in oc ? oc : oc.bindingContext;
  }
  // the name wasn't found.  return the root binding context.
  return scope.bindingContext || scope.overrideContext;
}

export function createScopeForTest(bindingContext: any, parentBindingContext?: any): Scope {
  if (parentBindingContext) {
    return {
      bindingContext,
      overrideContext: createOverrideContext(bindingContext, createOverrideContext(parentBindingContext))
    }
  }
  return {
    bindingContext,
    overrideContext: createOverrideContext(bindingContext)
  };
}
