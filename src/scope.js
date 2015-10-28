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
  bindingContext = bindingContext || null;
  parentOverrideContext = parentOverrideContext || null;
  return {
    bindingContext,
    parentOverrideContext,
    $parent: parentOverrideContext ? parentOverrideContext.bindingContext : undefined
  };
}

export function getContextFor(name: string, scope: Scope): any {
  // traverse the context and it's ancestors, searching for a context that has
  // the name.
  let oc = scope.overrideContext;
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
