import { IfComponentIdentity } from '../definitions';
import { UNNAMED_COMPONENT } from '../consts';

/**
 * Compare 2 component identities
 * Component identities considered the same if
 * either one is named and both have same componentName
 *
 * if both are unnamed components them compare by equality of clazz
 *
 *
 * @param a
 * @param b
 * @return boolean
 */
export default function isSameIdentity(a: IfComponentIdentity, b: IfComponentIdentity): boolean {
  /**
   * Either one is NOT UNNAMED_COMPONENT
   * then compare by componentName
   */
  if (a.componentName !== UNNAMED_COMPONENT || b.componentName !== UNNAMED_COMPONENT) {
    return a.componentName === b.componentName;
  }
  /**
   * Both are UNNAMED_COMPONENT
   * then both must have same clazz
   */
  return b.componentName === UNNAMED_COMPONENT && a.clazz === b.clazz;
}
