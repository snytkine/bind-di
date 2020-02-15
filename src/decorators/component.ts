import "reflect-metadata";
import {
    Target,
    _COMPONENT_IDENTITY_,
    _UNNAMED_COMPONENT_,
    INVALID_COMPONENT_NAMES,
    _COMPONENT_TYPE_,
    _DEFAULT_SCOPE_,
    RETURN_TYPE,
    IocComponentType,
    IfComponentFactoryMethod
} from "../";

import {ComponentScope} from "../enums/componentscope"

import {
    defineMetadata,
    Identity,
    setComponentIdentity
} from "../metadata/index";
import {randomBytes} from "crypto";
import {getComponentName} from "../index";


/**
 * When @Component or @Factory is added to class
 * Component name is added to class as a hidden non-enumerable property (with Symbol as name)
 * Component scope is added to class as hidden non-enumerable property (with Symbol as name)
 * Component type (Component or ComponentFactory is added to class as hidden non-enumerable hidded property (with
 * Symbol as name) A Scope property must NOT be added ONLY if explicitly set with @Scope or @Singleton decorator,
 * cannot be set to initial default value. But what about decorating controller? Controller in not Singleton by default
 * but generic component IS singleton! A component must also have _DEFAULT_SCOPE_ This way when a new component type
 * needs to add component meta data (like controller) it must call the addComponentDecoration with own _DEFAULT_SCOPE_
 * value.
 *
 *
 * When @Component is added to method or get accessor:
 *
 *
 * @type {debug.IDebugger | any}
 */

const debug = require("debug")("bind:decorator:component");
const TAG = "@Component";

/**
 export type _Target = {
    new? (...args: any[]): any
    constructor: (...args: any[]) => any
    name?: string
    //constructor: any
    prototype?: any
}
 **/

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

export function Component(name: string): (target: any, propertyKey?: string,
                                          descriptor?: TypedPropertyDescriptor<Object>) => void

export function Component(nameOrTarget: string | Target, propertyKey?: string,
                          descriptor?: TypedPropertyDescriptor<Object>) {

    let componentName: string;
    let className: string;


    if (typeof nameOrTarget !== "string") {

        className = nameOrTarget["name"];
        componentName = className + "." + randomBytes(36)
        .toString("hex");

        debug(`Entered @Component for unnamed component propertyKey="${propertyKey}"`);

        if (typeof nameOrTarget === "function" && !propertyKey && nameOrTarget["prototype"]) {
            /**
             * Applying decorator to class
             */

            debug(`Defining unnamed ${TAG} for class ${componentName}`);

            setComponentIdentity(new Identity(componentName, nameOrTarget, className), nameOrTarget);

            defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, nameOrTarget)(); // used to be true

        } else {

            debug(`Defining unnamed ${TAG} for property ${propertyKey} of class ${nameOrTarget["name"]}`);

            /**
             * Applying decorator to method of the class
             * In this case the target is a prototype of the class for instance member
             * or constructor function for a static member.
             *
             * We should not allow Component decorator on a static member.
             */
            if (!descriptor || typeof descriptor.value !== "function") {
                const ex1 = `Only class or class method can have a '${TAG}'decorator. ${nameOrTarget.constructor.name}.${propertyKey} decorated with ${TAG} is NOT a class or method`;
                throw new TypeError(ex1);
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

            /**
             *
             * Make sure that return type is user-defined class and not a build-in like String, Object, etc.
             */
            if (INVALID_COMPONENT_NAMES.includes(rettype.name)) {
                throw new TypeError(`${TAG} Return type of method "${nameOrTarget.constructor.name}.${propertyKey}" 
                is not a valid name for a component: "${rettype.name}". 
                Possibly return type was not explicitly defined or the Interface name was used for return type instead of class name`);
            }

            className = rettype.name;

            setComponentIdentity(new Identity(_UNNAMED_COMPONENT_, rettype, className), nameOrTarget, propertyKey);

            defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, nameOrTarget, propertyKey)(); // used to be true
            /**
             * Components created by functions of factory have default scope SINGLETON
             */
            defineMetadata(_DEFAULT_SCOPE_, ComponentScope.SINGLETON, nameOrTarget, propertyKey)(true);

        }


    } else {
        debug(`${TAG} decorator Called with component name="${nameOrTarget}"`);
        componentName = nameOrTarget;
        return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {

            if (typeof target === "function" && !propertyKey) {
                className = target.name;

                debug(`Defining named ${TAG} '${componentName}' for class ${target.name}`);

                // Applying to target (without .prototype fails to get meta for the instance)
                //defineMetadataUnique(_COMPONENT_IDENTITY_, name, target);
                setComponentIdentity(new Identity(componentName, target, className), target);
                defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, target)(); // used to be true

            } else {
                /**
                 * This is a named component applied to method.
                 */
                const factoryClassName = target.constructor && target.constructor.name;

                if (typeof descriptor.value !== "function") {
                    throw new TypeError(`Only class or class method can have a '${TAG}' decorator. ${target.constructor.name}.${propertyKey} decorated with ${TAG}('${componentName}') is NOT a class or method`);
                }

                debug(`Defining named ${TAG} "${componentName}" for class method "${factoryClassName}.${propertyKey}"`);

                /**
                 * Get return type of component getter method
                 */
                const rettype = Reflect.getMetadata(RETURN_TYPE, target, propertyKey);

                className = rettype && rettype.name;

                setComponentIdentity(new Identity(componentName, rettype, className), target, propertyKey);
                defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, target, propertyKey)(); // used to be true
                /**
                 * Method component are components generated by factory
                 * these components are always Singleton?
                 */
                defineMetadata(_DEFAULT_SCOPE_, ComponentScope.SINGLETON, target, propertyKey)(true);

            }

        };
    }
}


/**
 * @todo
 * Functions to create Component annotations
 * For example it will be possible to create
 * Controller annotation by calling
 * Controller = ComponentDecorator(_CONTROLLER_TYPE_) and it will return
 * Component function with value for _COMPONENT_TYPE_
 *
 * Then it can be used like this: Normally Component("myservice")
 * @makeComponentDecorator(_SPECIAL_TYPE_, ComponentScope.SINGLETON)("myservice")
 * or
 * @makeComponentDecorator(_SPECIAL_TYPE_, ComponentScope.SINGLETON)  for unnamed component
 */
//const componentDecorator = (cType: IocComponentType, cMeta: Symbol):

export const Factory = (target: Target): void => {
    Component(target);
    Reflect.defineMetadata(_COMPONENT_TYPE_, IocComponentType.FACTORY, target)
};



/**
 * @todo will the getOwnPropertyNames be a problem in case of inheritance?
 * If factory class extends another class then method of parent class will not be considered?
 *
 * @param {Target} target
 * @returns {Array<IfComponentFactoryMethod>}
 */
export function getFactoryMethods(target: Target): Array<IfComponentFactoryMethod> {

    /**
     * use target.prototype because target is just a constructor function
     * we need to access to object's properties and for that we need
     * to get the prototype
     *
     *
     * @type {string[]}
     */
    /**
     * Take care of case when target has no .prototype
     * this is the case when attempting to add a pure function to container, which does not make sense
     * but could happen when loading ALL exported variables from file, in which case a pure function
     * can be imported
     */
    if(!target.prototype){
        return [];
    }

    /**
     * @todo
     * get rid of getOwnPropertyNames because it will cause problem
     * with inheritance.
     *
     * @type {string[]}
     */
    let methods = Object.getOwnPropertyNames(target.prototype);

    const cName = String(getComponentName(target));


    debug(`${TAG} property names of target "${cName}"`, methods);

    let factoryMethods = methods.filter(m => Reflect.hasMetadata(_COMPONENT_IDENTITY_, target.prototype, m)).map(m => {
        return {"methodName": m, "providesComponent": Reflect.getMetadata(_COMPONENT_IDENTITY_, target.prototype, m)}
    });

    debug(`${TAG} factory methods of "${cName}"=`, factoryMethods);

    return factoryMethods
}

