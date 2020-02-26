import 'reflect-metadata';
import { Identity } from '../framework/lib';
import { FrameworkError } from '../exceptions';
import {
    COMPONENT_IDENTITY,
    UNNAMED_COMPONENT
} from '../consts';
import { IfComponentIdentity, StringOrSymbol, Target } from '../definitions';

const debug = require('debug')('bind:decorator');

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
export const isSameIdentity = (a: IfComponentIdentity, b: IfComponentIdentity): boolean => {
    /**
     * Either one is NOT UNNAMED_COMPONENT
     * then compare by componentName
     */
    if (a.componentName!==UNNAMED_COMPONENT ||
            b.componentName!==UNNAMED_COMPONENT) {
        return a.componentName===b.componentName;
    }
    /**
     * Both are UNNAMED_COMPONENT
     * then both must have same clazz
     */
    return b.componentName===UNNAMED_COMPONENT && a.clazz===b.clazz;
};

export const copyIdentity = (identity: IfComponentIdentity): IfComponentIdentity => {

    return Identity(identity.componentName, identity.clazz);
};

export const defineMetadata = (metadataKey: any, metadataValue: any, target: Object,
                               propertyKey?: StringOrSymbol) => (isUnique: boolean = false) => {

    if (isUnique && Reflect.hasMetadata(metadataKey, target, propertyKey)) {
        const className = getClassName(target);
        const err = `Target ${className} already has metadata with metadataKey="${metadataKey.toString()}" for propertyKey="${String(propertyKey)}"`;
        throw new FrameworkError(err);
    }

    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);

    // Need for decorating instances on classes?
    // Why were these prototype and constructor things here?
    // Why adding metadata of prototype of constructor?
    // Has something to do with factory component? When commented these out got
    // exception Factory component componentName ... is not providing any components
    //if (target['prototype']) {
        //Reflect.defineMetadata(metadataKey, metadataValue, target["prototype"], propertyKey);
    //} else if (target.constructor) {
        // Need for decorating properties on properties of a prototype
        // without adding metadata on target.constructor getting this exception
        //exception Factory component componentName ... is not providing any components
        // this is because in case of decorator applied to class properties and methods
        // the target is a prototype and not a constructor like in case of decorating class
        //Reflect.defineMetadata(metadataKey, metadataValue, target.constructor, propertyKey);
    //}

};


export function setComponentIdentity(identity: IfComponentIdentity, target: Object, propertyKey?: string): void {
    return defineMetadata(COMPONENT_IDENTITY, identity, target, propertyKey)(); // used to be true but was causing
                                                                                  // problems when component extended
                                                                                  // another decorated component
}

export function getComponentIdentity(target: Target, propertyKey?: StringOrSymbol): IfComponentIdentity {
    let ret = <IfComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, target, propertyKey);
    let targetName: string;

    /**
     * Now get className
     * it it's different that found by Identity it could be a sub-class
     * or an annotated class. In such case the parent class since it had
     * a Component decorator, will already have a COMPONENT_IDENTITY meta
     * but a child-class if it's not decorated will not have own meta
     * In this edge-case we should generate an Identity for a child-class
     * and not use parent, otherwise it will not be possible
     * to add child class and parent class to container since they will
     * have same Identity object
     */
    if (ret) {
        debug('Found className from COMPONENT_IDENTITY metadata ', ret);
        if (target.name) {
            debug(`Found className in .name property "${target['name']}"`);

            targetName = target.name;

        } else if (target.constructor && target.constructor.name) {
            debug(`Found className in constructor.name "${target.constructor.name}"`);

            targetName = target.constructor.name;
        }

        if (targetName && ret.clazz && targetName!==ret.clazz.name) {
            debug(`Different className from Identity and class name. className=${ret?.clazz?.name} name=${targetName}`);
            if (target!==ret.clazz) {
                return Identity(target);
            }
        }
        return ret;
    } else {
        /**
         * Maybe a raw class unannotated.
         * In this case create clazz-based identity
         *
         * @todo we will not have unannotated classes.
         */
        const className = getClassName(target, propertyKey);
        debug('Returning unnamed component className=', className);

        return Identity(target);
    }
}


/**
 * Get the name of component from class or instance
 * use metadata value if available, otherwise use the .name of class or .name of constructor.prototype
 * @param {Object} component
 * @returns {string}
 */
export function getComponentName(target: Target, propertyKey?: StringOrSymbol): StringOrSymbol {

    if (target) {
        let ret = <IfComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, target, propertyKey);
        if (ret) {
            debug('Found component name from COMPONENT_IDENTITY metadata ', String(ret.componentName));
            return ret.componentName;
        } else {
            return UNNAMED_COMPONENT;
        }
    }
}


export function getClassName(target: Target, propertyKey?: StringOrSymbol): string {

    if (target) {
        let ret = <IfComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, target);
        if (ret && ret.clazz) {
            debug('Found className from COMPONENT_IDENTITY metadata ', ret);
            return ret.clazz.name;
        } else if (target.name) {
            debug(`Found className in .name property "${target.name}"`);

            return target.name;

        } else if (target.constructor && target.constructor.name) {
            debug(`Found className in constructor.name "${target.constructor.name}"`);

            return target.constructor.name;
        }
    }
}







