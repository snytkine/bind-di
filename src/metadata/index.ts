import 'reflect-metadata';
import {
    IfComponentIdentity,
    Target,
    _COMPONENT_IDENTITY_,
    _UNNAMED_COMPONENT_,
    StringOrSymbol,
} from '../';


const debug = require('debug')('bind:decorator');

export interface IfIdentityCtorArgs {
    componentName: StringOrSymbol
    clazz: any
    filePath?: string
    className?: string
}

export class Identity implements IfComponentIdentity {

    public componentName: StringOrSymbol;

    /**
     * clazz is the Class, which is actually constructor Function object
     * it's already unique, so if two classes have the same name
     * their className will be the same but clazz will be different using === equality test
     * That basically means we don't need to use filePath for class equality test.
     */
    public clazz: any;
    public className?: string;
    public filePath?: string;

    constructor({
                    componentName,
                    clazz,
                    filePath,
                    className,
                }: IfIdentityCtorArgs) {
        this.componentName = componentName;
        this.filePath = filePath;
        this.className = className;
        this.clazz = clazz;
    }

    copy() {
        return new Identity({
            clazz: this.clazz,
            className: this.className,
            filePath: this.filePath,
            componentName: this.componentName,
        });
    }

    equals(other: IfComponentIdentity) {

        /**
         * Named component match other component by name only
         * This forces componentName to be unique except in cases of _UNNAMED_COMPONENT_
         * which is a special componentName
         */
        if (this.componentName!==_UNNAMED_COMPONENT_) {
            /**
             * Just using componentName is enough for named components,
             * components that have been annotated with @Component('my_service-x')
             */
            return this.componentName===other.componentName;
        }

        /**
         * In case of unnamed component
         * clazz must refer to the same object
         * and other component must also be unnamed
         */
        return (other.componentName===_UNNAMED_COMPONENT_ &&
                this.clazz===other.clazz);

    }

}


export const defineMetadata = (metadataKey: any, metadataValue: any, target: Object,
                               propertyKey?: StringOrSymbol) => (isUnique: boolean = false) => {

    if (isUnique && Reflect.hasMetadata(metadataKey, target, propertyKey)) {
        const className = getClassName(target);
        const err = `Target ${className} already has metadata with metadataKey="${metadataKey.toString()}" for propertyKey="${String(propertyKey)}"`;
        throw new TypeError(err);
    }

    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);

    // Need for decorating instances on classes?
    // Why were these prototype and constructor things here?
    // Why adding metadata of prototype of constructor?
    // Has something to do with factory component? When commented these out got
    // exception Factory component componentName ... is not providing any components
    if (target['prototype']) {
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
    return defineMetadata(_COMPONENT_IDENTITY_, identity, target, propertyKey)(); // used to be true but was causing
                                                                                  // problems when component extended
                                                                                  // another decorated component
}

export interface IfGetComponentIdentityArg {
    target: Target
    propertyKey?: StringOrSymbol
    filePath?: string
}

export function getComponentIdentity({ target, propertyKey, filePath }: IfGetComponentIdentityArg): IfComponentIdentity {
    let ret = Reflect.getMetadata(_COMPONENT_IDENTITY_, target, propertyKey);
    let targetName: string;

    /**
     * Now get className
     * it it's different that found by Identity it could be a sub-class
     * or an annotated class. In such case the parent class since it had
     * a Component decorator, will already have a _COMPONENT_IDENTITY_ meta
     * but a child-class if it's not decorated will not have own meta
     * In this edge-case we should generate an Identity for a child-class
     * and not use parent, otherwise it will not be possible
     * to add child class and parent class to container since they will
     * have same Identity object
     */
    if (ret) {
        debug('Found className from _COMPONENT_IDENTITY_ metadata ', ret);
        if (target.name) {
            debug(`Found className in .name property "${target['name']}"`);

            targetName = target.name;

        } else if (target.constructor && target.constructor.name) {
            debug(`Found className in constructor.name "${target.constructor.name}"`);

            targetName = target.constructor.name;
        }

        if (targetName && targetName!==ret.className) {
            debug(`Different className from Identity and class name. className=${ret.className} name=${targetName}`);
            if (target!==ret.clazz) {
                return new Identity({
                    componentName: _UNNAMED_COMPONENT_,
                    className: targetName,
                    filePath,
                    clazz: target,
                });
            }
        }
        return ret;
    } else {
        /**
         * Maybe a raw class unannotated.
         * In this case create clazz-based identity
         */
        const className = getClassName(target, propertyKey);
        debug('Returning unnamed component className=', className);

        return new Identity({ componentName: _UNNAMED_COMPONENT_, filePath, className, clazz: target });
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
            debug('Found component name from _COMPONENT_IDENTITY_ metadata ', String(ret.componentName));
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
            debug('Found className from _COMPONENT_IDENTITY_ metadata ', ret);
            return ret.className;
        } else if (target['name']) {
            debug(`Found className in .name property "${target['name']}"`);

            return target['name'];

        } else if (target.constructor && target.constructor.name) {
            debug(`Found className in constructor.name "${target.constructor.name}"`);

            return target.constructor.name;
        }
    }
}







