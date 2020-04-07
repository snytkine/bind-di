import { StringOrSymbol } from '../definitions/types';
import FrameworkError from '../exceptions/frameworkerror';
import { UNNAMED_COMPONENT } from '../consts';
import isStringOrSymbol from './lib/isstringorsymbol';
import { ComponentIdentity } from '../utils/componentidentity';
import { Target } from '../definitions/target';

/**
 * Factory function to create ComponentIdentity
 * Overloaded function signature
 * Can be called with single param Target
 * or with first param StringOrSymbol and optional second param Target
 *
 * @param componentName
 * @param clazz
 * @constructor
 */
export function Identity(component: Target): ComponentIdentity;
export function Identity(component: StringOrSymbol, clazz?: Target): ComponentIdentity;

/**
 * Implementation
 *
 * @param component
 * @param clazz
 * @constructor
 */
export function Identity(component: Target | StringOrSymbol, clazz?: Target): ComponentIdentity {
  if (isStringOrSymbol(component)) {
    if (component === UNNAMED_COMPONENT && !clazz) {
      throw new FrameworkError(`Cannot create Identity for UNNAMED_COMPONENT without clazz`);
    }

    return new ComponentIdentity(component as StringOrSymbol, clazz);
  }

  /**
   * called with single param Target.
   */
  return new ComponentIdentity(UNNAMED_COMPONENT, component);
}
