import { INIT_METHOD, PRE_DESTROY } from '../consts';
import { LifecycleCallback, Target } from '../definitions';
import defineMetadata from '../metadata/definemetadata';
import getComponentName from '../metadata/getcomponentname';

const debug = require('debug')('bind:decorator:lifecycle');

const TAG = 'LIFECYCLE';

export function PostConstruct(
  target: Target,
  propertyKey: string,
  // eslint-disable-next-line
  descriptor: TypedPropertyDescriptor<LifecycleCallback>,
) {
  defineMetadata(INIT_METHOD, propertyKey, target.constructor)();
  /**
   * @todo from the old implementation
   * add actual new method to the prototype
   * this way if will work in cases when component extends another
   * component that has this decorator.
   *
   *
   const aSymbols = Object.getOwnPropertySymbols(target);
   if (aSymbols.includes(SYM_INIT_METHOD)) {
      throw new ReferenceError(`Only one method can have ${TAG} annotation. Class ${target.constructor.name} has more than one method annotated with ${TAG}`);
    }

   const rt = Reflect.getMetadata(RETURN_TYPE, target, propertyKey);
   if (!rt || typeof rt !== 'function' || rt.name !== 'Promise') {
      throw new TypeError(`Wrong return type of ${TAG} method ${target.constructor.name}.${propertyKey}. Initializer method have defined return type 'Promise'`);
    }

   const res = Reflect.defineProperty(target, SYM_INIT_METHOD, {
      value: function () {
        return this[propertyKey]();
      }
    });

   */
}

export function PreDestroy(
  target: Target,
  propertyKey: string,
  // eslint-disable-next-line
  descriptor: TypedPropertyDescriptor<LifecycleCallback>,
) {
  debug(
    '%s Adding @PreDestroy decorator to "%s" for method "%s"',
    TAG,
    String(target.name),
    propertyKey,
  );
  defineMetadata(PRE_DESTROY, propertyKey, target)();
  /**
   * target is a prototype of class in this case
   * we also need to define this on constructor method
   * to be able to get the value of this meta by passing just a class
   * (in which case it actually is passing a constructor)
   */
  defineMetadata(PRE_DESTROY, propertyKey, target.constructor);
  /**
   * @todo see the comments in PostConstruct and defined actual
   * method on the prototype
   * it will make this method avaiable in the sub-classes
   * of the component.
   */
}

export function getPredestroy(target: Target): string {
  return Reflect.getMetadata(PRE_DESTROY, target);
}

/**
 * @todo will not be able to get metadata that was defined on a property
 * from a target!
 *
 * @param {Target} target
 * @returns {string}
 */
export function getPostConstruct(target: Target): string {
  const cName = String(getComponentName(target));

  debug('%s Entered getPostConstruct for target=%s', TAG, cName);

  const ret = Reflect.getMetadata(INIT_METHOD, target);

  if (ret) {
    debug('%s Found method of postConstruct on %s method=%s', TAG, cName, ret);

    return ret;
  }

  const a = Object.getOwnPropertyNames(target);
  debug('%s Property names of %s are %o', TAG, cName, a);

  if (target.prototype) {
    const targetPropNames = Object.getOwnPropertyNames(target.prototype);
    const initPropName = targetPropNames.find(p =>
      Reflect.hasMetadata(INIT_METHOD, target.prototype, p),
    );
    debug('%s Found INIT_METHOD="%s" in target="%s"', TAG, ret, cName);

    return initPropName;
    /* for (const p in target.prototype) {
     if (target.prototype.hasOwnProperty(p)) {
     debug('%s Checking postConstruct of %s.%s', TAG, cName, p);
     if (Reflect.hasMetadata(INIT_METHOD, target.prototype, p)) {
     return p;
     }
     }
     } */
  }

  return undefined;
}
