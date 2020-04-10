import { Maybe, StringOrSymbol } from '../definitions/types';
import { FrameworkError } from '../exceptions';
import { COMPONENT_IDENTITY } from '../consts';
import { Identity } from '../framework/identity';
import getClassName from './getclassname';
import isObject from '../framework/lib/isobject';
import { ComponentIdentity } from '../utils/componentidentity';
import { Target } from '../definitions/target';

const debug = require('debug')('bind:decorator');

const TAG = 'getComponentIdentity';

export default function getComponentIdentity(
  target: Target,
  propertyKey?: StringOrSymbol,
): Maybe<ComponentIdentity> {
  if (!isObject(target)) {
    throw new FrameworkError('Target passed to getComponentIdentity is not an object');
  }

  const ret = <ComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, target, propertyKey);

  /**
   * Now get className
   * if it's different than found by Identity it could be a sub-class
   * or an annotated class. In such case the parent class since it had
   * a Component decorator, will already have a COMPONENT_IDENTITY meta
   * but a child-class if it's not decorated will not have own meta
   * In this edge-case we should generate an Identity for a child-class
   * and not use parent, otherwise it will not be possible
   * to add child class and parent class to container since they will
   * have same Identity object
   */
  if (ret) {
    debug('%s Found COMPONENT_IDENTITY propertyKey="%s"  ret=%s  ', TAG, propertyKey, ret);

    /**
     * Special case when target is child-class and not decorated
     * but parent class has @Component decorator
     * in this case the COMPONENT_IDENTITY metadata will be from parent class
     * and it will have parent's .class in identity.
     * This is not what we want
     */
    if (!propertyKey && target !== ret.clazz) {
      debug('%s .clazz of target does not match .clazz in found identity "%s"', TAG, ret);
      return Identity(target);
    }

    return ret;
    /*
     if (target.name) {
     debug('%s Found className in .name property "%s"', TAG, target.name);

     targetName = target.name;
     } else if (target.constructor && target.constructor.name) {
     debug('%s Found className in constructor.name "%s"', TAG, target.constructor.name);

     targetName = target.constructor.name;
     }

     if (targetName && ret.clazz && targetName !== ret.clazz.name) {
     debug(
     `%s Different className from Identity and class name.
     className="%s" name="%s"`,
     TAG,
     ret?.clazz?.name,
     targetName,
     );

     /!**
     * @todo not sure what was the logic behind this.
     * if COMPONENT_IDENTITY metadata was found
     * but the .clazz is not the same as target then why returning
     * different identity from what was explicitely set in metadata?
     *!/
     if (target !== ret.clazz) {
     return Identity(target);
     }
     }
     */
  }

  /**
   * Maybe a raw class unannotated.
   * In this case create clazz-based identity
   */
  if (!propertyKey) {
    const className = getClassName(target);
    debug('%s Returning unnamed component className="%s"', TAG, className);
    return Identity(target);
  }
  debug('%s Could not determine Identity for target with propertyKey="%s"', TAG, propertyKey);

  return ret;
}
