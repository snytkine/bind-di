import "reflect-metadata";
import {
    IfComponentIdentity,
    Target,
    _COMPONENT_IDENTITY_
} from "../"

const debug = require('debug')('bind:decorator');
export const INVALID_COMPONENT_NAMES = ["Object", "String", "Number", "Boolean"];

export function Identity(componentName:string, className:string):IfComponentIdentity {
    return {componentName, className}
}

export function defineMetadataUnique(metadataKey: any, metadataValue: any, target: Object, propertyKey?: string | symbol): void {
    // Need for prototype decorating class and for properties on class instances

    if(Reflect.hasMetadata(metadataKey, target, propertyKey)){
        const className = getClassName(target);
        throw new TypeError(`Target ${className} already has metadata with metadataKey="${metadataKey.toString()}" for propertyKey="${propertyKey}"`);
    }

    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);

    // Need for decorating instances on classes
    if (target['prototype']) {
        Reflect.defineMetadata(metadataKey, metadataValue, target['prototype'], propertyKey);
    } else if (target.constructor) {
        // Need for decorating properties on properties of a prototype
        Reflect.defineMetadata(metadataKey, metadataValue, target.constructor, propertyKey);
    }
}


export function setComponentIdentity(identity: IfComponentIdentity, target: Object, propertyKey?: string): void {
    return defineMetadataUnique(_COMPONENT_IDENTITY_, identity, target, propertyKey)
}


export function getComponentIdentity(target: Target): IfComponentIdentity| undefined {
    let ret = Reflect.getMetadata(_COMPONENT_IDENTITY_, target);
    if (ret) {
        debug("Found className from _COMPONENT_IDENTITY_ metadata ", ret);
        return ret;
    } else {
        return void 0;
    }
}


/**
 * Get the name of component from class or instance
 * use metadata value if available, otherwise use the .name of class or .name of constructor.prototype
 * @param {Object} component
 * @returns {string}
 */
export function getComponentName(target: Target): string {
    let ret = Reflect.getMetadata(_COMPONENT_IDENTITY_, target);
    if (ret) {
        debug("Found component name from _COMPONENT_IDENTITY_ metadata ", ret);
        return ret.componentName;
    } else if (target['name']) {
        debug(`Found component name in .name property "${target['name']}"`);

        return target['name'];

    } else if (target.constructor && target.constructor.name) {
        debug(`Found component name in constructor.name "${target.constructor.name}"`);

        return target.constructor.name;
    }
}


export function getClassName(target: Target): string {
    let ret = Reflect.getMetadata(_COMPONENT_IDENTITY_, target);
    if (ret) {
        debug("Found className from _COMPONENT_IDENTITY_ metadata ", ret);
        return ret.className;
    } else if (target['name']) {
        debug(`Found className in .name property "${target['name']}"`);

        return target['name'];

    } else if (target.constructor && target.constructor.name) {
        debug(`Found className in constructor.name "${target.constructor.name}"`);

        return target.constructor.name;
    }
}







