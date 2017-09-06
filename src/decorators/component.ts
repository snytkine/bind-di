import "reflect-metadata";
import {
    _PROP_DEPENDENCIES_,
    _CTOR_DEPENDENCIES_,
    _COMPONENT_NAME_,
    _FACTORY_METHODS_,
    _COMPONENT_TYPE_,
    _DEFAULT_SCOPE_,
    IfComponentFactoryMethod,
    IfComponentPropDependency,
    IocComponentType,
    IocComponentScope,
    defineMetadataUnique
} from '../'
import {RETURN_TYPE} from "../definitions/consts";


/**
 * When @Component or @Factory is added to class
 * Component name is added to class as a hidden non-enumerable property (with Symbol as name)
 * Component scope is added to class as hidden non-enumerable property (with Symbol as name)
 * Component type (Component or ComponentFactory is added to class as hidden non-enumerable hidded property (with Symbol as name)
 * A Scope property must NOT be added ONLY if explicitly set with @Scope or @Singleton decorator, cannot be set
 * to initial default value.
 * But what about decorating controller? Controller in not Singleton by default but generic component IS singleton!
 * A component must also have _DEFAULT_SCOPE_
 * This way when a new component type needs to add component meta data (like controller) it must call
 * the addComponentDecoration with own _DEFAULT_SCOPE_ value.
 *
 *
 * When @Component is added to method or get accessor:
 *
 *
 * @type {debug.IDebugger | any}
 */

const debug = require('debug')('bind:decorator:component');
const TAG = '@Component';


export type Target = {
    new? (...args: any[]): any
    name?: string
    constructor: any
    prototype?: any
}

export interface IfPropertyWithDescriptor {
    propertyKey: string
    descriptor: TypedPropertyDescriptor<Object>
}

export interface IfComponentDecoration {
    componentName: string
    componentType: IocComponentType
    /**
     * Target should always be a Constructor function (newable) T extends {new(...args:any[]):{}}
     * @todo create separate interface for this property like ClassConstructor
     * it will have .name
     */
    target: object
    defaultScope: IocComponentScope
    componentMeta?: Symbol
    property?: IfPropertyWithDescriptor

}


export interface IfComponentDetails {

    /**
     * Component name
     */
    id?: string

    /**
     * Unique identifier of component type
     */
    componentType?: IocComponentType


    /**
     * Optional field may be used by consumer of this framework
     * to add extra info to component.
     * Example is to add a hint that component is a Middleware or Controller, or RequestFilter
     * or any other info that consuming framework may need to set
     *
     * Default value is DEFAULT_COMPONENT_META
     *
     */
    componentMeta?: Symbol

    /**
     * Component lifecycle
     */
    scope: IocComponentScope

    /**
     * Property dependencies
     */
    propDeps: Array<IfComponentPropDependency>

    /**
     * Constructor dependencies
     */
    ctorDeps: Array<string>

    /**
     * Array of componentIDs that this
     * component provides
     * I Component Factory may provide
     * multiple components
     */
    provides: Array<string>

}

/**
 * Get component metadata from class or object instance
 * @param target
 */
//export function getComponentMeta(target: any): IfComponentDetails {
//
//}

/**
 * Component decorator can be a factory - like @Component("my_stuff")
 * or Decorator function - simply a @Component
 * It can be applied to class or class method
 *
 * @param {Target} target
 * @constructor
 */
export function Component(target: Target): void

export function Component(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<Object>): void

export function Component(name: string): (target: any, propertyKey?: string, descriptor?: TypedPropertyDescriptor<Object>) => void

export function Component(nameOrTarget: string | Target, propertyKey?: string, descriptor?: TypedPropertyDescriptor<Object>) {
    let name: string;
    if (typeof nameOrTarget !== 'string') {
        name = nameOrTarget['name'];
        debug(`${TAG} Component decorator Called without params`);

        if (typeof nameOrTarget === "function" && !propertyKey && name && nameOrTarget['prototype']) {
            /**
             * Applying decorator to class
             */

            debug(`Defining unnamed ${TAG} for class ${name}`);

            defineMetadataUnique(_COMPONENT_NAME_, name, nameOrTarget);
            defineMetadataUnique(_COMPONENT_TYPE_, IocComponentType.COMPONENT, nameOrTarget);
            defineMetadataUnique(_DEFAULT_SCOPE_, IocComponentScope.SINGLETON, nameOrTarget);

        } else {

            debug(`Defining unnamed ${TAG} for property ${propertyKey} of class ${nameOrTarget['name']}`);

            /**
             * Applying decorator to method of the class
             * In this case the target is a prototype of the class for instance member
             * or constructor function for a static member.
             *
             * We should not allow Component decorator on a static member.
             */
            if (!descriptor || typeof descriptor.value !== 'function') {
                throw new TypeError(`Only class or class method can have a '${TAG}'decorator. ${nameOrTarget.constructor.name}.${propertyKey} decorated with ${TAG} is NOT a class or method`);
            }

            /**
             * Decorating method with @Component but now need to extract component name based on return type.
             * If return type is not declared in typescript then we cannot proceed.
             *
             * If @Component is applied to class method that class method must declared return type like this:
             * Here the @Component was applied to accessor method without providing component name
             * so we must extract component name from return type.
             *
             * getCollection(): Collection {
             *  //return a collection instance.
             * }
             *
             */
            const rettype = Reflect.getMetadata(RETURN_TYPE, nameOrTarget, propertyKey);
            const RT = typeof rettype;

            if (RT != "function" || !rettype.name) {
                throw new TypeError(`Cannot add ${TAG} to property ${propertyKey}. ${TAG} decorator was used without a name and rettype is not an object: ${RT}`);
            }

            defineMetadataUnique(_COMPONENT_NAME_, rettype.name, nameOrTarget, propertyKey);
            defineMetadataUnique(_COMPONENT_TYPE_, IocComponentType.COMPONENT, nameOrTarget, propertyKey);
            defineMetadataUnique(_DEFAULT_SCOPE_, IocComponentScope.SINGLETON, nameOrTarget, propertyKey);

        }


    } else {
        debug(`${TAG} decorator Called with component name="${nameOrTarget}"`);
        name = nameOrTarget;
        return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {

            if (typeof target === "function" && !propertyKey) {

                debug(`Defining named ${TAG} '${name}' for class ${target.name}`);

                // Applying to target (without .prototype fails to get meta for the instance)
                defineMetadataUnique(_COMPONENT_NAME_, name, target);
                defineMetadataUnique(_COMPONENT_TYPE_, IocComponentType.COMPONENT, target);
                defineMetadataUnique(_DEFAULT_SCOPE_, IocComponentScope.SINGLETON, target)

            } else {
                /**
                 * This is a named component applied to method.
                 */

                if (typeof descriptor.value !== 'function') {
                    throw new TypeError(`Only class or class method can have a '${TAG}' decorator. ${target.constructor.name}.${propertyKey} decorated with ${TAG}('${name}') is NOT a class or method`);
                }

                debug(`Defining named ${TAG} '${name}' for class method ${propertyKey}`);
                defineMetadataUnique(_COMPONENT_NAME_, name, target, propertyKey);
                defineMetadataUnique(_COMPONENT_TYPE_, IocComponentType.COMPONENT, target, propertyKey);
                defineMetadataUnique(_DEFAULT_SCOPE_, IocComponentScope.SINGLETON, target, propertyKey);

            }

        }
    }
}


// TEMP FOR TEST
export const requiredMetadataKey = Symbol("required");

export function required(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    let existingRequiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];
    existingRequiredParameters.push(parameterIndex);
    Reflect.defineMetadata(requiredMetadataKey, existingRequiredParameters, target, propertyKey);
}