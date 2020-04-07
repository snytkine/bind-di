import { INIT_METHOD, PRE_DESTROY } from '../consts';
import { LifecycleCallback, ClassPrototype } from '../definitions';
import defineMetadata from '../metadata/definemetadata';
import { Target } from '../definitions/target';

const debug = require('debug')('bind:decorator:lifecycle');

const TAG = 'LIFECYCLE';

export function PostConstruct(
  target: Target,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<LifecycleCallback>,
) {
  debug(
    '%s Adding @PostConstruct decorator to "%s" for method "%s" with descriptor %s',
    TAG,
    target.constructor.name,
    propertyKey,
    !!descriptor,
  );

  defineMetadata(INIT_METHOD, propertyKey, target)();
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
  target: ClassPrototype,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<LifecycleCallback>,
) {
  debug(
    '%s Adding @PreDestroy decorator to "%s" for method "%s" with descriptor %s',
    TAG,
    target.constructor.name,
    propertyKey,
    !!descriptor,
  );
  defineMetadata(PRE_DESTROY, propertyKey, target)();
  /**
   * target is a prototype of class in this case
   * we also need to define this on constructor method
   * to be able to get the value of this meta by passing just a class
   * (in which case it actually is passing a constructor)
   */
  defineMetadata(PRE_DESTROY, propertyKey, target.constructor)();
  /**
   * @todo see the comments in PostConstruct and defined actual
   * method on the prototype
   * it will make this method available in the sub-classes
   * of the component.
   */
}

export function getPredestroy(target: ClassPrototype): string | undefined {
  return Reflect.getMetadata(PRE_DESTROY, target);
}

/**
 *
 * @param {Target} target
 * @returns {string|undefined}
 */
export function getPostConstruct(target: ClassPrototype): string | undefined {
  debug('%s Entered getPostConstruct for target=%s', TAG, target.constructor.name);

  const ret = Reflect.getMetadata(INIT_METHOD, target);

  if (ret) {
    debug('%s Found method of postConstruct on %s method=%s', TAG, target.constructor.name, ret);

    return ret;
  }

  return undefined;
}
