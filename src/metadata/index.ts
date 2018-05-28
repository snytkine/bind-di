import "reflect-metadata";
import {
    IfComponentIdentity,
    Target,
    _COMPONENT_IDENTITY_,
    _UNNAMED_COMPONENT_,
    StringOrSymbol
} from "../";


const debug = require("debug")("bind:decorator");
export const INVALID_COMPONENT_NAMES = ["Object", "String", "Number", "Boolean"];

export class Identity implements IfComponentIdentity {
    constructor(public readonly componentName: StringOrSymbol, public readonly clazz: any,
                public readonly className?: string) {
    }

    equals(other: IfComponentIdentity) {

        /**
         * Named component match other component by name only
         * This forces componentName to be unique except in cases of _UNNAMED_COMPONENT_
         * which is a special componentName
         */
        if (this.componentName !== _UNNAMED_COMPONENT_) {
            return this.componentName === other.componentName;
        }

        /**
         * In case of unnamed component
         * clazz must refer to the same object
         * and other component must also be unnamed
         */
        return (other.componentName === _UNNAMED_COMPONENT_ && this.clazz === other.clazz);

    }

}


export const defineMetadata = (metadataKey: any, metadataValue: any, target: Object,
                               propertyKey?: StringOrSymbol) => (isUnique: boolean = false) => {

    if (isUnique && Reflect.hasMetadata(metadataKey, target, propertyKey)) {
        const className = getClassName(target);
        const err = `Target ${className} already has metadata with metadataKey="${metadataKey.toString()}" for propertyKey="${propertyKey}"`;
        throw new TypeError(err);
    }

    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);

    // Need for decorating instances on classes?
    // Why were these prototype and constructor things here?
    // Why adding metadata of prototype of constructor?
    // Has something to do with factory component? When commented these out got
    // exception Factory component componentName ... is not providing any components
    if (target["prototype"]) {
        //Reflect.defineMetadata(metadataKey, metadataValue, target["prototype"], propertyKey);
    } else if (target.constructor) {
        // Need for decorating properties on properties of a prototype
        // without adding metadata on target.constructor getting this exception
        //exception Factory component componentName ... is not providing any components
        // this is because in case of decorator applied to class properties and methods
        // the target is a prototype and not a constructor like in case of decorating class
        //Reflect.defineMetadata(metadataKey, metadataValue, target.constructor, propertyKey);
    }

};


export function setComponentIdentity(identity: IfComponentIdentity, target: Object, propertyKey?: string): void {
    return defineMetadata(_COMPONENT_IDENTITY_, identity, target, propertyKey)(); // used to be true but was causing problems when component extended another decorated component
}


export function getComponentIdentity(target: Target, propertyKey?: StringOrSymbol): IfComponentIdentity {
    let ret = Reflect.getMetadata(_COMPONENT_IDENTITY_, target, propertyKey);
    if (ret) {
        debug("Found className from _COMPONENT_IDENTITY_ metadata ", ret);
        return ret;
    } else {
        /**
         * Maybe a raw class unannotated.
         * In this case create clazz-based identity
         */
        const className = getClassName(target, propertyKey);
        debug("Returning unnamed component className=", className);

        return new Identity(_UNNAMED_COMPONENT_, target, className);
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
        let ret = Reflect.getMetadata(_COMPONENT_IDENTITY_, target, propertyKey);
        if (ret) {
            debug("Found component name from _COMPONENT_IDENTITY_ metadata ", String(ret.componentName));
            return ret.componentName;
        } else {
            return _UNNAMED_COMPONENT_;
        }
    }
}


export function getClassName(target: Target, propertyKey?: StringOrSymbol): string {

    if (target) {
        let ret = Reflect.getMetadata(_COMPONENT_IDENTITY_, target);
        if (ret) {
            debug("Found className from _COMPONENT_IDENTITY_ metadata ", ret);
            return ret.className;
        } else if (target["name"]) {
            debug(`Found className in .name property "${target["name"]}"`);

            return target["name"];

        } else if (target.constructor && target.constructor.name) {
            debug(`Found className in constructor.name "${target.constructor.name}"`);

            return target.constructor.name;
        }
    }
}







