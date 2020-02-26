import {
    INIT_METHOD,
    PRE_DESTROY,
} from '../consts';
import { LifecycleCallback, Target } from '../definitions';
import { defineMetadata, getComponentName } from '../metadata';

const debug = require('debug')('bind:decorator:lifecycle');

const TAG = 'LIFECYCLE';

export function PostConstruct(target: Target, propertyKey: string,
                              descriptor: TypedPropertyDescriptor<LifecycleCallback>) {

    defineMetadata(INIT_METHOD, propertyKey, target.constructor)();

}


export function PreDestroy(target: Target, propertyKey: string,
                           descriptor: TypedPropertyDescriptor<LifecycleCallback>) {
    debug('%s Adding @PreDestroy decorator to "%s" for method "%s"',TAG,  String(target.name), propertyKey);
    defineMetadata(PRE_DESTROY, propertyKey, target)();
    /**
     * target is a prototype of class in this case
     * we also need to define this on constructor method
     * to be able to get the value of this meta by passing just a class
     * (in which case it actually is passing a constructor)
     */
    defineMetadata(PRE_DESTROY, propertyKey, target.constructor);

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
        for (const p in target.prototype) {

            debug('%s Checking postConstruct of %s.%s', TAG, cName, p);
            if (Reflect.hasMetadata(INIT_METHOD, target.prototype, p)) {
                return p;
            }
        }
    }

    return undefined;
}
